/**
 * get-company — devuelve la ficha de empresa de un usuario autenticado.
 * Body: { userId }
 */
const { jsonResponse, ensureCompanyByUser } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (!b.userId) return jsonResponse(400, { error: "userId es obligatorio" });
    const company = await ensureCompanyByUser(b.userId);
    return jsonResponse(200, { ok: true, company });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo cargar la empresa", details: err.message });
  }
};
