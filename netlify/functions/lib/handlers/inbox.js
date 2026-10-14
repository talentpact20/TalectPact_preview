/**
 * inbox — avisos in-app del candidato (p. ej. desbloqueo de contacto).
 *
 * Body: {}                         → { notifications: [...] }
 * Body: { markRead: [id,…] }       → marca leídos y devuelve la lista
 * Cabecera: Authorization Bearer
 */
const { jsonResponse, sb, authUser, isUuid } = require("../tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para ver tus avisos" });

    if (Array.isArray(b.markRead) && b.markRead.length) {
      const ids = b.markRead.filter((id) => isUuid(String(id))).slice(0, 50);
      for (const id of ids) {
        await sb.update(
          "notifications",
          `id=eq.${id}&user_id=eq.${user.id}&read_at=is.null`,
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
      if (/notifications/i.test(err.message)) {
        return jsonResponse(200, { ok: true, notifications: [], pendingMigration: true });
      }
      throw err;
    }

    const notifications = (Array.isArray(filas) ? filas : []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body || "",
      meta: n.meta || {},
      readAt: n.read_at,
      createdAt: n.created_at
    }));
    return jsonResponse(200, { ok: true, notifications });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudieron cargar los avisos", details: err.message });
  }
};
