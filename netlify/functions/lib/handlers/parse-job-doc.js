/**
 * parse-job-doc — propone los campos de una oferta a partir del documento de
 * requisitos de la empresa (PDF, Word o texto), con IA.
 *
 * Body: { nombre: "requisitos.pdf", base64: "<archivo>" }   o   { texto: "<texto pegado>" }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 * Devuelve: { ok, propuesta: { title, sector, description, ..., skillRequirements, avisos } }
 *
 * Solo para cuentas de empresa y con límite de uso: cada llamada cuesta dinero.
 * No guarda nada: la propuesta vuelve al formulario y la empresa la revisa.
 * El documento no se almacena ni se registra.
 */
const { jsonResponse, sb, authUser, errorInterno } = require("../tp");
const { limitar } = require("../limites");
const { skillsDelCatalogo } = require("../catalogo");
const {
  MAX_BYTES, MAX_TEXTO, tipoDeArchivo, textoDeDocx, esquemaPropuesta, construirPeticion, normalizarPropuesta
} = require("../oferta-doc");

// La entrada .mjs registra el SDK (así el empaquetador lo incluye); los tests
// registran un cliente falso y no tocan la red.
let _Anthropic = null, _cliente = null;
function usarAnthropic(Ctor) { _Anthropic = Ctor; _cliente = null; }
function usarClienteDePrueba(c) { _cliente = c; }
function cliente() {
  if (_cliente) return _cliente;
  const Ctor = _Anthropic || require("@anthropic-ai/sdk").default;
  // Netlify corta a los 60 s: un intento largo y un reintento corto como mucho.
  _cliente = new Ctor({ timeout: 45000, maxRetries: 1 });
  return _cliente;
}

const MODELO = () => process.env.ANTHROPIC_DOC_MODEL || "claude-opus-5-5";

/** Lee el cuerpo y devuelve { doc } o { error, status }. */
function leerDocumento(b) {
  if (typeof b.texto === "string" && b.texto.trim()) {
    const texto = b.texto.trim();
    if (texto.length > MAX_TEXTO) return { status: 413, error: "El texto es demasiado largo. Pega solo la parte de requisitos del puesto." };
    if (texto.length < 40) return { status: 400, error: "Hay muy poco texto para rellenar la oferta." };
    return { doc: { tipo: "texto", texto } };
  }
  const tipo = tipoDeArchivo(b.nombre);
  if (!tipo) return { status: 415, error: "Sube un PDF, un Word (.docx) o un archivo de texto." };
  if (typeof b.base64 !== "string" || !b.base64) return { status: 400, error: "No ha llegado el archivo." };
  const buf = Buffer.from(b.base64, "base64");
  if (!buf.length) return { status: 400, error: "El archivo está vacío." };
  if (buf.length > MAX_BYTES) return { status: 413, error: "El archivo pasa de 3 MB. Sube solo el documento de requisitos." };
  if (tipo === "pdf") {
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return { status: 400, error: "El archivo no es un PDF válido." };
    return { doc: { tipo: "pdf", base64: buf.toString("base64") } };
  }
  let texto;
  try { texto = tipo === "docx" ? textoDeDocx(buf) : buf.toString("utf8"); }
  catch (e) { return { status: 400, error: e.message }; }
  texto = texto.trim();
  if (texto.length < 40) return { status: 400, error: "No hemos encontrado texto suficiente en el documento." };
  if (texto.length > MAX_TEXTO) return { status: 413, error: "El documento es demasiado largo. Sube solo la parte de requisitos del puesto." };
  return { doc: { tipo: "texto", texto } };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch { return jsonResponse(400, { error: "Body JSON no válido" }); }

  try {
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });
    const empresas = await sb.select("companies", `user_id=eq.${user.id}&select=id&limit=1`);
    if (!Array.isArray(empresas) || !empresas.length) return jsonResponse(403, { error: "Necesitas una cuenta de empresa" });
    if (await limitar("doc:" + user.id, { max: 10, ventanaS: 3600 })) {
      return jsonResponse(429, { error: "Has leído muchos documentos seguidos. Prueba de nuevo dentro de un rato." });
    }

    const leido = leerDocumento(b);
    if (leido.error) return jsonResponse(leido.status, { error: leido.error });

    if (!_cliente && !process.env.ANTHROPIC_API_KEY) {
      return jsonResponse(503, { error: "La lectura automática no está disponible ahora. Rellena la oferta a mano." });
    }

    const catalogo = skillsDelCatalogo();
    const { system, messages } = construirPeticion(leido.doc, catalogo);
    const respuesta = await cliente().beta.messages.create({
      model: MODELO(),
      max_tokens: 8000,
      // Si el modelo declina por política, el API reintenta con otro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: esquemaPropuesta(catalogo) } },
      system,
      messages
    });

    if (respuesta.stop_reason === "refusal") {
      return jsonResponse(422, { error: "No hemos podido leer este documento. Rellena la oferta a mano." });
    }
    if (respuesta.stop_reason === "max_tokens") {
      return jsonResponse(422, { error: "El documento es demasiado extenso para leerlo de una vez. Sube solo los requisitos." });
    }
    const bloque = (respuesta.content || []).find((c) => c.type === "text");
    let raw;
    try { raw = JSON.parse(bloque ? bloque.text : ""); }
    catch { return jsonResponse(502, { error: "La lectura ha fallado. Vuelve a intentarlo o rellena la oferta a mano." }); }

    return jsonResponse(200, { ok: true, propuesta: normalizarPropuesta(raw, catalogo) });
  } catch (err) {
    if (err && (err.name === "APIConnectionTimeoutError" || err.name === "TimeoutError")) {
      return jsonResponse(504, { error: "La lectura ha tardado demasiado. Vuelve a intentarlo." });
    }
    return errorInterno("No se pudo leer el documento", err);
  }
};

module.exports.usarAnthropic = usarAnthropic;
module.exports.usarClienteDePrueba = usarClienteDePrueba;
module.exports.leerDocumento = leerDocumento;
