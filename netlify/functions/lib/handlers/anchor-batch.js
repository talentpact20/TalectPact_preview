/**
 * anchor-batch — lote diario del sello público (docs/plan_post_reunion/03 §4.2).
 *
 * Función programada (cada noche, ver anchor-batch.mjs). También la puede lanzar
 * a mano una cuenta admin (POST con su token).
 *
 *  1. Reconcilia los lotes enviados en días anteriores que aún no tenían recibo.
 *  2. Toma la cola: credenciales con el sello pagado, sin lote y sin revocar.
 *  3. Hoja de cada una = keccak256(sal ‖ credencial); construye el árbol de
 *     Merkle y guarda en cada credencial su hoja y su prueba.
 *  4. Publica SOLO la raíz con anchorRoot(raíz, nº de hojas): una transacción
 *     al día, cueste lo que cueste el volumen.
 *  5. Si el envío falla, el lote queda «fallido» y sus credenciales vuelven a la
 *     cola para la noche siguiente. Las que lleven más de 3 días esperando se
 *     avisan en el registro (backoffice: reintentar o reembolsar).
 */
const { jsonResponse, sb, authUser, sealChain, sealChainConfigured, getSealContract, faltaEnEsquema, errorInterno } = require("../tp");
const { hoja, construir } = require("../merkle");
const { esAdmin } = require("./admin-metrics");

const MAX_LOTE = 5000;
const ESPERA_MS = Number(process.env.ANCHOR_WAIT_MS || 20000);
const DIAS_AVISO = 3;

async function esperar(tx, ms) {
  let t;
  const tope = new Promise((r) => { t = setTimeout(() => r(null), ms); });
  try { return await Promise.race([tx.wait(1).catch(() => null), tope]); }
  finally { clearTimeout(t); }
}

/** Lotes enviados sin confirmar: se recoge el recibo. */
async function reconciliar(contrato) {
  const pendientes = await sb.select("anchor_batches", "status=eq.enviado&tx_hash=not.is.null&select=id,tx_hash&limit=20");
  let confirmados = 0;
  for (const l of Array.isArray(pendientes) ? pendientes : []) {
    const r = await contrato.runner.provider.getTransactionReceipt(l.tx_hash);
    if (r && r.blockNumber != null) {
      await sb.update("anchor_batches", `id=eq.${l.id}`, { status: r.status === 0 ? "fallido" : "confirmado", anchored_at: new Date().toISOString() });
      if (r.status === 0) await liberar(l.id);
      else confirmados++;
    }
  }
  return confirmados;
}

/** Devuelve a la cola las credenciales de un lote que no llegó a la cadena. */
async function liberar(loteId) {
  await sb.update("credentials", `batch_id=eq.${loteId}`, { batch_id: null, merkle_leaf: null, merkle_proof: null });
}

async function ejecutarLote() {
  if (!sealChainConfigured({ signer: true })) {
    return { ok: false, motivo: "Falta SKILLPASS_V2_CONTRACT_ADDRESS o ISSUER_PRIVATE_KEY: el sello por lotes no está configurado." };
  }
  const red = sealChain();
  const contrato = getSealContract({ signer: true });
  const confirmados = await reconciliar(contrato);

  const cola = await sb.select(
    "credentials",
    `seal_paid_at=not.is.null&batch_id=is.null&revoked_at=is.null&salt=not.is.null&select=id,cv_json,salt,seal_paid_at&order=seal_paid_at.asc&limit=${MAX_LOTE}`
  );
  const lista = Array.isArray(cola) ? cola : [];
  const limite = Date.now() - DIAS_AVISO * 24 * 3600 * 1000;
  const atrasadas = lista.filter((c) => new Date(c.seal_paid_at).getTime() < limite).length;
  if (atrasadas) console.error(`[TP] sello: ${atrasadas} credenciales pagadas llevan más de ${DIAS_AVISO} días sin sellar (revisar o reembolsar)`);
  if (!lista.length) return { ok: true, sellados: 0, confirmados, atrasadas };

  const hojas = lista.map((c) => hoja(c.salt, c.cv_json));
  const { raiz, pruebas } = construir(hojas);
  const creado = await sb.insert("anchor_batches", {
    root: raiz, leaves: lista.length, chain: red.slug,
    contract: process.env.SKILLPASS_V2_CONTRACT_ADDRESS, status: "enviando"
  });
  const lote = Array.isArray(creado) ? creado[0] : creado;

  // La prueba de cada credencial se guarda antes de enviar: no depende de la red.
  for (let i = 0; i < lista.length; i++) {
    await sb.update("credentials", `id=eq.${lista[i].id}&batch_id=is.null`, { batch_id: lote.id, merkle_leaf: hojas[i], merkle_proof: pruebas[i] });
  }

  let tx;
  try {
    tx = await contrato.anchorRoot(raiz, lista.length);
  } catch (err) {
    await sb.update("anchor_batches", `id=eq.${lote.id}`, { status: "fallido", error: String(err.message || err).slice(0, 300) });
    await liberar(lote.id);
    return { ok: false, motivo: "No se pudo enviar el lote: " + (err.shortMessage || err.message), sellados: 0, confirmados, atrasadas };
  }
  await sb.update("anchor_batches", `id=eq.${lote.id}`, { tx_hash: tx.hash, status: "enviado" });
  const recibo = await esperar(tx, ESPERA_MS);
  if (recibo && recibo.blockNumber != null) {
    await sb.update("anchor_batches", `id=eq.${lote.id}`, { status: "confirmado", anchored_at: new Date().toISOString() });
  }
  return { ok: true, sellados: lista.length, raiz, txHash: tx.hash, confirmado: !!recibo, confirmados, atrasadas };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch (_e) { b = {}; }
  try {
    // Netlify llama a las funciones programadas con { next_run }. Una llamada a
    // mano solo la acepta una cuenta admin.
    const programada = typeof b.next_run === "string";
    if (!programada) {
      const user = await authUser(event, b);
      if (!esAdmin(user)) return jsonResponse(403, { error: "Solo una cuenta admin puede lanzar el lote a mano" });
    } else {
      // Freno ante llamadas repetidas: un lote por hora como mucho.
      const hace = new Date(Date.now() - 3600 * 1000).toISOString();
      const recientes = await sb.select("anchor_batches", `created_at=gte.${hace}&status=neq.fallido&select=id&limit=1`);
      if (Array.isArray(recientes) && recientes.length) return jsonResponse(200, { ok: true, omitido: "Ya hay un lote de la última hora" });
    }
    const r = await ejecutarLote();
    return jsonResponse(r.ok ? 200 : 503, r);
  } catch (err) {
    if (faltaEnEsquema(err, /anchor_batches|seal_paid_at|batch_id|salt/i)) {
      return jsonResponse(503, { error: "Falta supabase_schema_vc.sql: el sello por lotes no está activado", code: "pending_migration" });
    }
    return errorInterno("No se pudo publicar el lote del sello", err);
  }
};

module.exports.ejecutarLote = ejecutarLote;
