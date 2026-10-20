/**
 * did-web — documento DID del emisor (did:web:talentpact.es), servido en
 * /.well-known/did.json. Publica la clave pública con la que TalentPact firma
 * los SkillPass: con ella cualquiera comprueba una credencial sin preguntarnos.
 */
const { jsonResponse } = require("../tp");
const { documentoDid } = require("../vc");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method not allowed" });
  const doc = documentoDid();
  if (!doc) return jsonResponse(503, { error: "La firma de credenciales no está configurada (falta VC_SIGNING_KEY)." });
  const res = jsonResponse(200, doc);
  res.headers = Object.assign({}, res.headers, { "content-type": "application/did+json", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" });
  return res;
};
