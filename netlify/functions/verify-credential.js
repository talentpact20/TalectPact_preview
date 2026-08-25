/**
 * verify-credential — verifica una credencial contra la blockchain.
 * Body: { cvJson }  o  { cvHash }  (el hash permite un enlace público portable)
 * Devuelve: { verified, anchoredAt?, cvHash, skills? }
 */
const { jsonResponse, sb, hashCv, getContract } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod === "GET") {
    const hash = (event.queryStringParameters && (event.queryStringParameters.h || event.queryStringParameters.hash)) || "";
    if (!hash) return jsonResponse(400, { error: "Pasa h= (cvHash) o usa POST con cvJson" });
    return verifyByHash(hash);
  }
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (b.cvHash) return verifyByHash(String(b.cvHash));

    let cvJson = b.cvJson;
    if (typeof cvJson === "string") {
      try { cvJson = JSON.parse(cvJson); }
      catch (_e) { return jsonResponse(400, { error: "El CV proporcionado no es un JSON válido" }); }
    }
    if (!cvJson || typeof cvJson !== "object") {
      return jsonResponse(400, { error: "Falta el CV a verificar (cvJson) o el hash (cvHash)" });
    }
    return verifyOnChain(hashCv(cvJson), cvJson);
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo verificar la credencial", details: err.message });
  }
};

async function verifyByHash(cvHash) {
  try {
    const rows = await sb.select(
      "credentials",
      `cv_hash=eq.${encodeURIComponent(cvHash)}&select=cv_json,cv_hash,tx_hash,anchored_at&limit=1`
    );
    const cred = Array.isArray(rows) ? rows[0] : null;
    if (!cred) {
      return jsonResponse(200, {
        verified: false,
        cvHash,
        reason: "No hay ninguna credencial con ese hash en TalentPact."
      });
    }
    return verifyOnChain(cred.cv_hash, cred.cv_json, cred.tx_hash);
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo verificar la credencial", details: err.message });
  }
}

async function verifyOnChain(cvHash, cvJson, txHash) {
  const contract = getContract({ signer: false });
  const [exists, timestamp] = await contract.isAnchored(cvHash);
  const skills = cvJson && Array.isArray(cvJson.skills) ? cvJson.skills : [];
  if (!exists) {
    return jsonResponse(200, {
      verified: false,
      cvHash,
      skills,
      reason: "El hash no está anclado en la blockchain (o el CV fue modificado)."
    });
  }
  return jsonResponse(200, {
    verified: true,
    cvHash,
    skills,
    txHash: txHash || null,
    anchoredAt: new Date(Number(timestamp) * 1000).toISOString()
  });
}
