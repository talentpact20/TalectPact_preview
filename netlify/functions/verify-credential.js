/**
 * verify-credential — verifica una credencial contra la blockchain.
 *
 * Body: { cvJson }  o  { cvHash }   ·   GET: ?h=0x…
 *
 * Deliberadamente público: comprobar un SkillPass no debe exigir cuenta en
 * TalentPact — ese es justo el punto de una credencial verificable. Solo lee
 * de la cadena, nunca escribe, así que no gasta gas.
 *
 * Devuelve: { verified, cvHash, skills, anchoredAt?, txHash?, explorerUrl?, chain }
 */
const {
  jsonResponse, sb, hashCv, getContract, chainConfigured, isHash32,
  CHAIN, explorerTx, explorerAddress
} = require("./lib/tp");

function chainMeta(extra) {
  return Object.assign(
    {
      chain: CHAIN.slug,
      chainName: CHAIN.name,
      contract: process.env.SKILLPASS_CONTRACT_ADDRESS || null,
      contractUrl: process.env.SKILLPASS_CONTRACT_ADDRESS
        ? explorerAddress(process.env.SKILLPASS_CONTRACT_ADDRESS)
        : null
    },
    extra
  );
}

const NOT_CONFIGURED = {
  error: "La verificación en blockchain no está configurada en este entorno",
  details: "Falta SKILLPASS_CONTRACT_ADDRESS en las variables de entorno del servidor."
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });

  // Antes de leer nada: sin contrato configurado no hay verificación posible,
  // y decirlo aquí evita una consulta inútil a Supabase y un 500 sin sentido.
  if (!chainConfigured()) return jsonResponse(503, NOT_CONFIGURED);

  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    const hash = q.h || q.hash || "";
    if (!hash) return jsonResponse(400, { error: "Pasa h= (cvHash) o usa POST con cvJson" });
    return verifyByHash(String(hash));
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
    // El hash se recalcula desde el JSON recibido: si alguien retocó un score,
    // el hash cambia y el anclaje deja de encontrarse. Ahí está la garantía.
    return verifyOnChain(hashCv(cvJson), cvJson);
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo verificar la credencial", details: err.message });
  }
};

async function verifyByHash(raw) {
  const cvHash = String(raw).trim();
  if (!isHash32(cvHash)) {
    // Sin validar, un hash malformado llegaría a ethers y devolvería un 500
    // ilegible en lugar de decirle a la persona qué ha pegado mal.
    return jsonResponse(400, {
      error: "Hash no válido",
      details: "Se espera 0x seguido de 64 caracteres hexadecimales."
    });
  }
  // La consulta a Supabase es best-effort: solo aporta las skills y el txHash
  // para enriquecer la respuesta. Quien decide si el sello es válido es el
  // contrato, así que una caída de la base de datos no debe tumbar la
  // verificación — como mucho, deja la credencial sin detalle.
  let cred = null;
  try {
    const rows = await sb.select(
      "credentials",
      `cv_hash=eq.${encodeURIComponent(cvHash)}&select=cv_json,cv_hash,tx_hash,block_number,anchored_at&limit=1`
    );
    cred = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    console.warn("verify-credential: Supabase no disponible, se verifica solo on-chain:", err.message);
  }

  // Que TalentPact no la conozca no decide nada: la verdad está en la cadena.
  if (!cred) return verifyOnChain(cvHash, null, null, null);
  return verifyOnChain(cred.cv_hash, cred.cv_json, cred.tx_hash, cred.block_number);
}

async function verifyOnChain(cvHash, cvJson, txHash, blockNumber) {
  if (!chainConfigured()) return jsonResponse(503, NOT_CONFIGURED);

  let exists, timestamp;
  try {
    const contract = getContract({ signer: false });
    [exists, timestamp] = await contract.isAnchored(cvHash);
  } catch (err) {
    return jsonResponse(502, {
      error: "No se pudo consultar la blockchain",
      details: err.message,
      cvHash
    });
  }

  const skills = cvJson && Array.isArray(cvJson.skills) ? cvJson.skills : [];
  if (!exists) {
    return jsonResponse(200, chainMeta({
      verified: false,
      cvHash,
      skills,
      reason: cvJson
        ? "El hash no está anclado en la blockchain (o el CV fue modificado después de sellarlo)."
        : "Este hash no está anclado en la blockchain."
    }));
  }

  return jsonResponse(200, chainMeta({
    verified: true,
    cvHash,
    skills,
    issuedAt: (cvJson && cvJson.issuedAt) || null,
    subject: (cvJson && cvJson.subject) || null,
    txHash: txHash || null,
    blockNumber: blockNumber != null ? Number(blockNumber) : null,
    explorerUrl: txHash ? explorerTx(txHash) : null,
    // La fecha viene del propio contrato, no de la base de datos: es el dato
    // que nadie en TalentPact puede alterar.
    anchoredAt: new Date(Number(timestamp) * 1000).toISOString()
  }));
}
