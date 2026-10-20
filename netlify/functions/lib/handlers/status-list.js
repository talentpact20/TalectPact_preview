/**
 * status-list — lista de revocación pública de los SkillPass (/status/1).
 *
 * GET, sin sesión. Devuelve la BitstringStatusListCredential firmada por
 * TalentPact con un bit por credencial (1 = revocada). Quien comprueba descarga
 * la lista entera: TalentPact no sabe qué credencial está mirando.
 */
const { jsonResponse, sb, faltaEnEsquema, errorInterno } = require("../tp");
const { credencialDeLista } = require("../statuslist");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method not allowed" });
  try {
    let filas = [];
    try {
      filas = await sb.select("credentials", "revoked_at=not.is.null&status_index=not.is.null&select=status_index&limit=100000");
    } catch (err) {
      if (!faltaEnEsquema(err, /revoked_at|status_index/i)) throw err;
    }
    const indices = (Array.isArray(filas) ? filas : []).map((f) => f.status_index);
    const res = jsonResponse(200, credencialDeLista(indices));
    res.headers = Object.assign({}, res.headers, { "content-type": "application/vc+ld+json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" });
    return res;
  } catch (err) {
    return errorInterno("No se pudo generar la lista de revocación", err);
  }
};
