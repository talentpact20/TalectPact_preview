/**
 * inbox — avisos in-app del candidato (p. ej. desbloqueo de contacto).
 *
 * Body: {}                         → { notifications: [...] }
 * Body: { markRead: [id,…] }       → marca leídos y devuelve la lista
 * Cabecera: Authorization Bearer
 */
const { jsonResponse, sb, authUser, isUuid, faltaEnEsquema } = require("../tp");

/**
 * Lo que sale de meta hacia el navegador. El aviso de desbloqueo guarda el
 * company_user_id para auditoría, pero el candidato no debe recibirlo: con él
 * podría cruzar qué desbloqueos vienen de la misma empresa.
 */
function metaPublica(m) {
  const o = m && typeof m === "object" ? m : {};
  const r = {};
  if (typeof o.job_id === "string") r.job_id = o.job_id;
  if (typeof o.status === "string") r.status = o.status;
  return r;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para ver tus avisos" });

    if (Array.isArray(b.markRead) && b.markRead.length) {
      const ids = b.markRead.filter((id) => isUuid(String(id))).slice(0, 50);
      // Una sola petición para todos (antes, una por aviso).
      if (ids.length) {
        await sb.update(
          "notifications",
          `id=in.(${ids.join(",")})&user_id=eq.${user.id}&read_at=is.null`,
          { read_at: new Date().toISOString() }
        );
      }
    }

    let filas;
    try {
      filas = await sb.select(
        "notifications",
        `user_id=eq.${user.id}&select=id,type,title,body,meta,read_at,created_at&order=created_at.desc&limit=40`
      );
    } catch (err) {
      if (faltaEnEsquema(err, "notifications")) {
        return jsonResponse(200, { ok: true, notifications: [], pendingMigration: true });
      }
      throw err;
    }

    const notifications = (Array.isArray(filas) ? filas : []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body || "",
      meta: metaPublica(n.meta),
      readAt: n.read_at,
      createdAt: n.created_at
    }));
    return jsonResponse(200, { ok: true, notifications });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudieron cargar los avisos", details: err.message });
  }
};

module.exports.metaPublica = metaPublica;
