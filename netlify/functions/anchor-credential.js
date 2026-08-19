/**
 * anchor-credential — ancla el hash de una credencial en la blockchain (testnet).
 * Body: { credentialId }  (o { cvHash })
 * Devuelve: { txHash, blockNumber, anchoredAt, explorerUrl }
 */
const { jsonResponse, sb, getContract } = require("./lib/tp");

const EXPLORER = "https://sepolia.etherscan.io/tx/";

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");

    // Localiza la credencial (por id o por hash).
    let cred;
    if (b.credentialId) {
      const rows = await sb.select("credentials", `id=eq.${b.credentialId}&select=*&limit=1`);
      cred = Array.isArray(rows) ? rows[0] : null;
    } else if (b.cvHash) {
      const rows = await sb.select("credentials", `cv_hash=eq.${encodeURIComponent(b.cvHash)}&select=*&limit=1`);
      cred = Array.isArray(rows) ? rows[0] : null;
    }
    if (!cred) return jsonResponse(404, { error: "Credencial no encontrada" });
    if (cred.tx_hash) {
      return jsonResponse(200, {
        ok: true,
        already: true,
        txHash: cred.tx_hash,
        blockNumber: cred.block_number,
        anchoredAt: cred.anchored_at,
        explorerUrl: EXPLORER + cred.tx_hash
      });
    }

    // Lanza la transacción de anclaje.
    const contract = getContract({ signer: true });
    const tx = await contract.anchor(cred.cv_hash);
    const receipt = await tx.wait();
    const anchoredAt = new Date().toISOString();

    await sb.update("credentials", `id=eq.${cred.id}`, {
      tx_hash: tx.hash,
      block_number: Number(receipt.blockNumber),
      anchored_at: anchoredAt
    });

    return jsonResponse(200, {
      ok: true,
      txHash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      anchoredAt,
      explorerUrl: EXPLORER + tx.hash
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo anclar la credencial", details: err.message });
  }
};
