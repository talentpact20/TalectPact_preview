/**
 * admin-solicitudes — cola del backoffice: reaperturas y alternativas a la cámara.
 *
 * Body:
 *   { accion: "listar" }
 *   { accion: "resolver", id, decision: "aprobada"|"rechazada", nota? }
 *
 * Solo `app_metadata.role = admin`. Minimización: alias del candidato, nunca
 * email ni nombre. Al aprobar una reapertura se anula el intento previo (también
 * lo hace el trigger de supabase_schema_intentos.sql; aquí se hace además para
 * no depender solo de él y para poder probarlo sin Postgres).
 */
const { jsonResponse, sb, authUser, anonymousAlias, isUuid, errorInterno, faltaEnEsquema } = require("../tp");
const { esAdmin } = require("./admin-metrics");
const { retoComun } = require("../catalogo");
const { notificarSolicitudIntento } = require("../notify");

const sinTabla = (err) => faltaEnEsquema(err, /attempt_requests|attempts/i);

function tituloReto(challengeId) {
  if (!challengeId) return null;
  const r = retoComun(challengeId);
  return r ? r.title : challengeId;
}

function sanearNota(texto, obligatoria) {
  const nota = typeof texto === "string" ? texto.trim().slice(0, 800) : "";
  if (obligatoria && nota.length < 5) return { error: "Al rechazar, escribe una nota breve para el candidato (mín. 5 caracteres)." };
  return { nota: nota || null };
}

function mapearFila(fila) {
  return {
    id: fila.id,
    tipo: fila.tipo,
    challengeId: fila.challenge_id || null,
    reto: tituloReto(fila.challenge_id),
    motivo: fila.motivo,
    estado: fila.estado,
    nota: fila.nota || null,
    creadaEn: fila.created_at,
    resueltaEn: fila.resuelto_en || null,
    alias: anonymousAlias(fila.user_id)
  };
}

async function listar() {
  let pendientes = [], recientes = [];
  try {
    [pendientes, recientes] = await Promise.all([
      sb.select("attempt_requests",
        "select=id,user_id,tipo,challenge_id,motivo,estado,nota,created_at,resuelto_en&estado=eq.pendiente&order=created_at.asc&limit=100"),
      sb.select("attempt_requests",
        "select=id,user_id,tipo,challenge_id,motivo,estado,nota,created_at,resuelto_en&estado=neq.pendiente&order=created_at.desc&limit=40")
    ]);
  } catch (err) {
    if (sinTabla(err)) {
      return jsonResponse(200, { ok: true, configurado: false, pendientes: [], recientes: [], pendientesCount: 0 });
    }
    throw err;
  }
  const p = Array.isArray(pendientes) ? pendientes.map(mapearFila) : [];
  const r = Array.isArray(recientes) ? recientes.map(mapearFila) : [];
  return jsonResponse(200, {
    ok: true,
    configurado: true,
    pendientesCount: p.length,
    pendientes: p,
    recientes: r
  });
}

async function anularIntento(userId, challengeId) {
  if (!userId || !challengeId) return;
  try {
    await sb.update(
      "attempts",
      `user_id=eq.${userId}&challenge_id=eq.${encodeURIComponent(challengeId)}&estado=neq.anulado`,
      { estado: "anulado" }
    );
  } catch (err) {
    if (!sinTabla(err)) throw err;
  }
}

async function resolver(admin, b) {
  if (!isUuid(String(b.id || ""))) return jsonResponse(400, { error: "Solicitud no válida" });
  if (!["aprobada", "rechazada"].includes(b.decision)) return jsonResponse(400, { error: "Decisión no válida" });
  const { nota, error } = sanearNota(b.nota, b.decision === "rechazada");
  if (error) return jsonResponse(400, { error });

  let filas;
  try {
    filas = await sb.select("attempt_requests", `id=eq.${b.id}&select=*&limit=1`);
  } catch (err) {
    if (sinTabla(err)) return jsonResponse(503, { error: "Las solicitudes aún no están activadas en este entorno.", code: "sin_tabla" });
    throw err;
  }
  const fila = Array.isArray(filas) ? filas[0] : null;
  if (!fila) return jsonResponse(404, { error: "No encontramos esa solicitud" });
  if (fila.estado !== "pendiente") return jsonResponse(409, { error: "Esta solicitud ya estaba resuelta", code: "ya_resuelta", estado: fila.estado });

  const ahora = new Date().toISOString();
  const patch = {
    estado: b.decision,
    nota: nota || (b.decision === "aprobada" ? "Aprobada" : null),
    resuelto_en: ahora
  };
  let actualizadas;
  try {
    actualizadas = await sb.update("attempt_requests", `id=eq.${b.id}&estado=eq.pendiente`, patch);
  } catch (err) {
    if (sinTabla(err)) return jsonResponse(503, { error: "Las solicitudes aún no están activadas en este entorno.", code: "sin_tabla" });
    throw err;
  }
  const hecha = Array.isArray(actualizadas) ? actualizadas[0] : actualizadas;
  if (!hecha) return jsonResponse(409, { error: "Esta solicitud ya estaba resuelta", code: "ya_resuelta" });

  if (b.decision === "aprobada" && hecha.tipo === "reapertura") {
    await anularIntento(hecha.user_id, hecha.challenge_id);
  }

  await notificarSolicitudIntento({
    userId: hecha.user_id,
    tipo: hecha.tipo,
    decision: b.decision,
    challengeId: hecha.challenge_id,
    reto: tituloReto(hecha.challenge_id),
    nota: hecha.nota,
    requestId: hecha.id,
    adminId: admin.id
  });

  return jsonResponse(200, { ok: true, solicitud: mapearFila(hecha) });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return jsonResponse(400, { error: "Body JSON no válido" }); }
  try {
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión" });
    if (!esAdmin(user)) return jsonResponse(403, { error: "Tu cuenta no tiene rol de administrador" });
    if (b.accion === "listar") return await listar();
    if (b.accion === "resolver") return await resolver(user, b);
    return jsonResponse(400, { error: "Acción no válida" });
  } catch (err) {
    return errorInterno("No se pudieron gestionar las solicitudes", err);
  }
};

module.exports.sanearNota = sanearNota;
module.exports.mapearFila = mapearFila;
module.exports.tituloReto = tituloReto;
