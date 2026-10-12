/**
 * save-job — publica, edita o cierra una oferta de la empresa autenticada.
 *
 * Body: { id?, title, sector, description, requiredSkills, tags?, requiredLevel?,
 *         exerciseConfig?, jornada?, modalidad?, contrato?, ubicacion?, salMin?, salMax? }
 *       { id, status: "closed" | "open" }   → cerrar o reabrir
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * La empresa sale del token y tiene que tener ficha en `companies`. Una oferta
 * solo la puede tocar quien la publicó: la propiedad se impone en el filtro.
 */
const { jsonResponse, sb, authUser, isUuid } = require("../tp");

const SECTORES = ["Marketing", "IT", "Data", "Business", "Design", "RRHH", "Finance", "Legal", "Ops", "Sales", "Languages"];
const NIVELES = ["basico", "intermedio", "avanzado"];
const CONFIGS = ["common", "common+custom", "custom", "contact"];
const JORNADAS = ["completa", "parcial", "horas", "practicas"];
const MODALIDADES = ["remoto", "hibrido", "presencial"];
const CONTRATOS = ["indefinido", "temporal", "freelance", "practicas"];

const texto = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const lista = (v, max, n) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, n)))].slice(0, max) : []);
const entero = (v) => { const x = Number(v); return Number.isFinite(x) && x > 0 ? Math.round(x) : null; };
const uno = (v, opciones, def) => (opciones.includes(v) ? v : def);

/** Valida y normaliza una oferta. Devuelve { fila } o { error }. */
function validarOferta(b) {
  const fila = {
    title: texto(b.title, 120),
    sector: texto(b.sector, 40),
    description: texto(b.description, 4000),
    required_skills: lista(b.requiredSkills, 8, 60),
    tags: lista(b.tags, 6, 40),
    required_level: uno(b.requiredLevel, NIVELES, "basico"),
    exercise_config: uno(b.exerciseConfig, CONFIGS, "common+custom"),
    jornada: uno(b.jornada, JORNADAS, "completa"),
    modalidad: uno(b.modalidad, MODALIDADES, "presencial"),
    contrato: uno(b.contrato, CONTRATOS, "indefinido"),
    ubicacion: texto(b.ubicacion, 80) || null,
    sal_min: entero(b.salMin),
    sal_max: entero(b.salMax)
  };
  if (fila.title.length < 3) return { error: "El título necesita al menos 3 caracteres" };
  if (!SECTORES.includes(fila.sector)) return { error: "Sector no válido" };
  if (fila.description.length < 20) return { error: "La descripción necesita al menos 20 caracteres" };
  if (!fila.required_skills.length) return { error: "Indica al menos una skill requerida" };
  if (fila.sal_min && fila.sal_max && fila.sal_min > fila.sal_max) return { error: "El salario mínimo no puede superar al máximo" };
  if (fila.modalidad !== "remoto" && !fila.ubicacion) return { error: "Indica la ubicación: la oferta no es 100 % remota" };
  return { fila };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });

    const empresas = await sb.select("companies", `user_id=eq.${user.id}&select=id&limit=1`);
    const empresa = Array.isArray(empresas) ? empresas[0] : null;
    if (!empresa) return jsonResponse(403, { error: "Necesitas una cuenta de empresa para publicar ofertas" });

    if (b.id != null && !isUuid(String(b.id))) return jsonResponse(400, { error: "id de oferta no válido" });
    const propia = (id) => `id=eq.${id}&company_user_id=eq.${user.id}`;

    // ── Cerrar o reabrir ──
    if (b.id && (b.status === "closed" || b.status === "open") && !b.title) {
      const filas = await sb.update("jobs", propia(b.id), {
        status: b.status,
        closed_at: b.status === "closed" ? new Date().toISOString() : null
      });
      if (!Array.isArray(filas) || !filas.length) return jsonResponse(404, { error: "Oferta no encontrada" });
      return jsonResponse(200, { ok: true, id: b.id, status: b.status });
    }

    const { fila, error } = validarOferta(b);
    if (error) return jsonResponse(400, { error });

    if (b.id) {
      const filas = await sb.update("jobs", propia(b.id), fila);
      if (!Array.isArray(filas) || !filas.length) return jsonResponse(404, { error: "Oferta no encontrada" });
      return jsonResponse(200, { ok: true, id: b.id });
    }
    const creada = await sb.insert("jobs", Object.assign({ company_user_id: user.id, company_id: empresa.id }, fila));
    const row = Array.isArray(creada) ? creada[0] : creada;
    return jsonResponse(200, { ok: true, id: row && row.id });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar la oferta", details: err.message });
  }
};

module.exports.validarOferta = validarOferta;
module.exports.SECTORES = SECTORES;
