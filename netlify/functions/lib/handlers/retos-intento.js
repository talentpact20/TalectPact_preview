/**
 * retos-intento — intento oficial de un reto del catálogo.
 *
 * Body: { accion: "empezar", challengeId, camara: "activa", aceptaNormas: true }
 *         → { ok, intento: { id, expiraEn, retomado }, ejercicios: [{ id, type, scenario, data }] }
 *         409 si el intento ya se usó (con el estado de la solicitud, si la hay).
 *       { accion: "solicitar", tipo: "reapertura"|"sin_camara", challengeId?, motivo }
 *       { accion: "estado" } → intentos y solicitudes de la persona
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Sin la migración supabase_schema_intentos.sql el contenido se entrega igual
 * (la plataforma sigue funcionando) pero sin control de intento: control:false.
 */
const { jsonResponse, sb, authUser, faltaEnEsquema, esDuplicado, errorInterno } = require("../tp");
const { retoComun } = require("../catalogo");
const { duracionIntento, contenidoDelIntento, estadoIntento, validarSolicitud } = require("../intentos");

const sinTabla = (err) => faltaEnEsquema(err, /attempts|attempt_requests/i);

async function alternativaAprobada(userId) {
  const f = await sb.select("attempt_requests", `user_id=eq.${userId}&tipo=eq.sin_camara&estado=eq.aprobada&select=id&limit=1`);
  return Array.isArray(f) && f.length > 0;
}

async function empezar(user, b) {
  const reto = retoComun(b.challengeId);
  if (!reto) return jsonResponse(400, { error: "Reto no válido" });
  if (b.aceptaNormas !== true) return jsonResponse(400, { error: "Tienes que aceptar las normas del reto antes de empezar." });
  const ejercicios = contenidoDelIntento(reto.id);

  let previos;
  try {
    previos = await sb.select("attempts", `user_id=eq.${user.id}&challenge_id=eq.${encodeURIComponent(reto.id)}&estado=neq.anulado&select=*&limit=1`);
  } catch (err) {
    if (!sinTabla(err)) throw err;
    return jsonResponse(200, { ok: true, control: false, intento: null, ejercicios });
  }
  const previo = Array.isArray(previos) ? previos[0] : null;
  if (previo) {
    const estado = estadoIntento(previo);
    if (estado === "abierto") {
      // Mismo intento: el reloj no se ha parado.
      return jsonResponse(200, { ok: true, control: true, intento: { id: previo.id, expiraEn: previo.expira_en, retomado: true }, ejercicios });
    }
    const sol = await sb.select("attempt_requests", `user_id=eq.${user.id}&tipo=eq.reapertura&challenge_id=eq.${encodeURIComponent(reto.id)}&order=created_at.desc&select=estado,nota,created_at&limit=1`);
    return jsonResponse(409, {
      error: "Ya has usado tu intento en este reto.", code: "intento_usado", estado,
      solicitud: Array.isArray(sol) && sol[0] ? sol[0] : null
    });
  }

  if (b.camara !== "activa" && !(await alternativaAprobada(user.id))) {
    return jsonResponse(403, { error: "La cámara es obligatoria para hacer un reto oficial.", code: "camara_obligatoria" });
  }
  const ahora = Date.now();
  const fila = {
    user_id: user.id,
    challenge_id: reto.id,
    estado: "abierto",
    abierto_en: new Date(ahora).toISOString(),
    expira_en: new Date(ahora + duracionIntento(reto) * 1000).toISOString(),
    camara: b.camara === "activa" ? "activa" : "alternativa_aprobada"
  };
  let creado;
  try {
    creado = await sb.insert("attempts", fila);
  } catch (err) {
    // Dos pestañas a la vez: gana la primera y la segunda retoma ese intento.
    if (!esDuplicado(err)) throw err;
    return empezar(user, b);
  }
  const row = Array.isArray(creado) ? creado[0] : creado;
  return jsonResponse(200, { ok: true, control: true, intento: { id: row.id, expiraEn: row.expira_en, retomado: false }, ejercicios });
}

async function solicitar(user, b) {
  const { solicitud, error } = validarSolicitud(b);
  if (error) return jsonResponse(400, { error });
  const abiertas = await sb.select("attempt_requests",
    `user_id=eq.${user.id}&tipo=eq.${solicitud.tipo}&estado=eq.pendiente` +
    (solicitud.challenge_id ? `&challenge_id=eq.${encodeURIComponent(solicitud.challenge_id)}` : "") + "&select=id&limit=1");
  if (Array.isArray(abiertas) && abiertas.length) return jsonResponse(200, { ok: true, yaPendiente: true });
  await sb.insert("attempt_requests", Object.assign({ user_id: user.id, estado: "pendiente" }, solicitud));
  return jsonResponse(200, { ok: true });
}

async function estado(user) {
  const [intentos, solicitudes] = await Promise.all([
    sb.select("attempts", `user_id=eq.${user.id}&select=id,challenge_id,estado,expira_en,abierto_en&order=abierto_en.desc&limit=300`),
    sb.select("attempt_requests", `user_id=eq.${user.id}&select=tipo,challenge_id,estado,nota,created_at&order=created_at.desc&limit=100`)
  ]);
  return jsonResponse(200, {
    ok: true, control: true,
    intentos: (intentos || []).map((i) => ({ id: i.id, challengeId: i.challenge_id, estado: estadoIntento(i), expiraEn: i.expira_en })),
    solicitudes: solicitudes || []
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return jsonResponse(400, { error: "Body JSON no válido" }); }
  try {
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Crea tu cuenta o inicia sesión para hacer retos oficiales." });
    if ((user.user_metadata || {}).role === "empresa") return jsonResponse(403, { error: "Los retos son para candidatos." });
    if (b.accion === "empezar") return await empezar(user, b);
    if (b.accion === "solicitar") return await solicitar(user, b);
    if (b.accion === "estado") return await estado(user);
    return jsonResponse(400, { error: "Acción no válida" });
  } catch (err) {
    if (sinTabla(err)) return jsonResponse(200, { ok: true, control: false });
    return errorInterno("No se pudo gestionar el intento", err);
  }
};
