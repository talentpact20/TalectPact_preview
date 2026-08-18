/**
 * verify-credential — verifica una credencial contra la blockchain.
 * Recibe el CV (JSON), recomputa su hash y consulta on-chain si está anclado.
 * Body: { cvJson }  (objeto o string JSON)
 * Devuelve: { verified, anchoredAt?, cvHash }
 */
const { jsonResponse, hashCv, getContract } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    let cvJson = b.cvJson;
    if (typeof cvJson === "string") {
      try { cvJson = JSON.parse(cvJson); }
      catch (_e) { return jsonResponse(400, { error: "El CV proporcionado no es un JSON válido" }); }
    }
    if (!cvJson || typeof cvJson !== "object") {
      return jsonResponse(400, { error: "Falta el CV a verificar (cvJson)" });
    }

    const cvHash = hashCv(cvJson);
    const contract = getContract({ signer: false });
    const [exists, timestamp] = await contract.isAnchored(cvHash);

    if (!exists) {
      return jsonResponse(200, {
        verified: false,
        cvHash,
        reason: "El hash no está anclado en la blockchain (o el CV fue modificado)."
      });
    }

    const anchoredAt = new Date(Number(timestamp) * 1000).toISOString();
    return jsonResponse(200, { verified: true, cvHash, anchoredAt });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo verificar la credencial", details: err.message });
  }
};
