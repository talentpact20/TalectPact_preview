/**
 * anchor-credential — ancla el hash de una credencial en la blockchain (testnet).
 *
 * Body: { credentialId }  (o { cvHash })
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Requiere sesión: cada transacción gasta gas de la wallet emisora, así que sin
 * autenticar cualquiera podría vaciarla. Además solo se ancla una credencial
 * del propio usuario — la propiedad se impone en la consulta, no comparando ids.
 *
 * La confirmación de un bloque de Sepolia tarda ~12 s y Netlify corta las
 * funciones síncronas a 10 s. Por eso el anclaje NO bloquea hasta la
 * confirmación: difunde la transacción, la guarda, espera un margen corto y, si
 * aún no ha entrado en un bloque, responde `pending` con el txHash. Volver a
 * llamar con el mismo `credentialId` recoge el recibo y cierra el anclaje.
 *
 * Devuelve: { txHash, blockNumber, anchoredAt, explorerUrl, pending }
 */
const {
  jsonResponse, sb, authUser, getContract, getProvider,
  chainConfigured, isHash32, isUuid, CHAIN, explorerTx, explorerAddress
} = require("./lib/tp");

// Margen de espera antes de devolver `pending`. Deja aire dentro de los 10 s de
// Netlify para el resto de la petición (auth, Supabase, difusión).
const WAIT_MS = Number(process.env.ANCHOR_WAIT_MS || 5000);

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

/** Espera la confirmación como mucho `ms`; devuelve null si no llega a tiempo. */
async function waitWithBudget(tx, ms) {
  let timer;
  const budget = new Promise((resolve) => { timer = setTimeout(() => resolve(null), ms); });
  try {
    // El .catch evita que un rechazo tardío de wait() quede sin manejar cuando
    // ya hemos respondido `pending`.
    return await Promise.race([tx.wait(1).catch(() => null), budget]);
  } finally {
    clearTimeout(timer);
  }
}

/** Respuesta de una credencial ya anclada y confirmada. */
function anchoredResponse(cred, extra) {
  return jsonResponse(200, chainMeta(Object.assign({
    ok: true,
    pending: false,
    txHash: cred.tx_hash || null,
    blockNumber: cred.block_number != null ? Number(cred.block_number) : null,
    anchoredAt: cred.anchored_at || null,
    explorerUrl: cred.tx_hash ? explorerTx(cred.tx_hash) : null
  }, extra)));
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  // ── Sin configuración de cadena no se finge nada: se dice qué falta. ──
  if (!chainConfigured({ signer: true })) {
    return jsonResponse(503, {
      error: "El anclaje en blockchain no está configurado en este entorno",
      details: "Faltan SKILLPASS_CONTRACT_ADDRESS o ISSUER_PRIVATE_KEY en las variables de entorno del servidor."
    });
  }

  // ── Identidad: el servidor decide de quién es la credencial. ──
  let user;
  try { user = await authUser(event, b); }
  catch (err) { return jsonResponse(500, { error: "No se pudo validar la sesión", details: err.message }); }
  if (!user) {
    return jsonResponse(401, {
      error: "Necesitas iniciar sesión para sellar tu SkillPass",
      details: "Falta la cabecera Authorization: Bearer <access token> o el token ha caducado."
    });
  }

  try {
    // ── Localiza la credencial, siempre acotada al perfil de quien pide. ──
    const profiles = await sb.select("profiles", `user_id=eq.${user.id}&select=id&limit=1`);
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (!profile) return jsonResponse(404, { error: "Este usuario no tiene perfil ni credenciales" });

    let filter;
    if (b.credentialId) {
      if (!isUuid(b.credentialId)) return jsonResponse(400, { error: "credentialId no válido" });
      filter = `id=eq.${b.credentialId}`;
    } else if (b.cvHash) {
      if (!isHash32(b.cvHash)) return jsonResponse(400, { error: "cvHash no válido: se espera 0x + 64 hex" });
      filter = `cv_hash=eq.${b.cvHash.trim()}`;
    } else {
      return jsonResponse(400, { error: "Falta credentialId o cvHash" });
    }

    const rows = await sb.select("credentials", `${filter}&profile_id=eq.${profile.id}&select=*&limit=1`);
    const cred = Array.isArray(rows) ? rows[0] : null;
    if (!cred) return jsonResponse(404, { error: "Credencial no encontrada" });

    // ── ① Ya confirmada: nada que hacer. ──
    if (cred.tx_hash && cred.block_number != null) return anchoredResponse(cred, { already: true });

    const contract = getContract({ signer: true });

    // ── ② Difundida en una llamada anterior pero sin confirmar: recoge el recibo. ──
    if (cred.tx_hash) {
      const receipt = await getProvider().getTransactionReceipt(cred.tx_hash);
      if (receipt && receipt.blockNumber != null) {
        const anchoredAt = cred.anchored_at || new Date().toISOString();
        await sb.update("credentials", `id=eq.${cred.id}`, {
          block_number: Number(receipt.blockNumber),
          anchored_at: anchoredAt
        });
        return anchoredResponse(
          Object.assign({}, cred, { block_number: Number(receipt.blockNumber), anchored_at: anchoredAt })
        );
      }
      return jsonResponse(200, chainMeta({
        ok: true,
        pending: true,
        txHash: cred.tx_hash,
        blockNumber: null,
        anchoredAt: null,
        explorerUrl: explorerTx(cred.tx_hash)
      }));
    }

    // ── ③ El hash puede estar ya en la cadena aunque la fila no lo refleje.
    // Sin esta comprobación, anchor() revertiría con "already anchored". ──
    const [exists, ts] = await contract.isAnchored(cred.cv_hash);
    if (exists) {
      const anchoredAt = new Date(Number(ts) * 1000).toISOString();
      await sb.update("credentials", `id=eq.${cred.id}`, { anchored_at: anchoredAt });
      return jsonResponse(200, chainMeta({
        ok: true,
        already: true,
        pending: false,
        txHash: cred.tx_hash || null,
        blockNumber: null,
        anchoredAt,
        explorerUrl: cred.tx_hash ? explorerTx(cred.tx_hash) : null,
        note: "El hash ya estaba anclado en la cadena; se ha reconciliado el registro."
      }));
    }

    // ── ④ Difunde y guarda el txHash antes de esperar: si la respuesta se corta,
    // la transacción no se pierde y la siguiente llamada la recupera. ──
    const tx = await contract.anchor(cred.cv_hash);
    await sb.update("credentials", `id=eq.${cred.id}`, { tx_hash: tx.hash });

    const receipt = await waitWithBudget(tx, WAIT_MS);
    if (!receipt) {
      return jsonResponse(200, chainMeta({
        ok: true,
        pending: true,
        txHash: tx.hash,
        blockNumber: null,
        anchoredAt: null,
        explorerUrl: explorerTx(tx.hash),
        note: "Transacción enviada. La red aún no la ha confirmado; vuelve a consultar en unos segundos."
      }));
    }

    const anchoredAt = new Date().toISOString();
    await sb.update("credentials", `id=eq.${cred.id}`, {
      block_number: Number(receipt.blockNumber),
      anchored_at: anchoredAt
    });

    return jsonResponse(200, chainMeta({
      ok: true,
      pending: false,
      txHash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      anchoredAt,
      explorerUrl: explorerTx(tx.hash)
    }));
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo anclar la credencial", details: err.message });
  }
};
