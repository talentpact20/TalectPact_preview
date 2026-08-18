/**
 * doctor — diagnostico de la configuracion del demo (IA + datos + blockchain).
 *
 * Revisa, sin modificar nada, que cada capa este realmente conectada:
 *   1. .env presente y variables cargadas
 *   2. Supabase alcanzable y tablas creadas
 *   3. RPC de Polygon Amoy y saldo de la wallet emisora
 *   4. Contrato desplegado y con el emisor correcto
 *
 * Uso:  npm run doctor
 */
const fs = require("fs");
const path = require("path");
const { ROOT, loadDotEnv, env, normalizePrivateKey, AMOY } = require("./lib-env");

const n = loadDotEnv();
const results = [];

function ok(area, msg) { results.push({ level: "ok", area, msg }); }
function warn(area, msg) { results.push({ level: "warn", area, msg }); }
function fail(area, msg) { results.push({ level: "fail", area, msg }); }

async function checkEnvFile() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) {
    fail("entorno", ".env no existe. Copia .env.example a .env y rellenalo.");
    return;
  }
  ok("entorno", ".env encontrado (" + n + " variable(s) cargada(s))");
}

async function checkAI() {
  if (!env("ANTHROPIC_API_KEY")) {
    warn("ia", "ANTHROPIC_API_KEY no configurada: la correccion por IA fallara.");
    return;
  }
  ok("ia", "ANTHROPIC_API_KEY presente (modelo: " + (env("ANTHROPIC_MODEL") || "claude-sonnet-4-6") + ")");
}

async function checkSupabase() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_KEY");
  if (!url || !key) {
    fail("datos", "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY: no se puede emitir ni anclar nada.");
    return;
  }
  for (const table of ["profiles", "evaluations", "credentials"]) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: key, authorization: `Bearer ${key}` }
      });
      if (res.ok) ok("datos", `tabla ${table} accesible`);
      else fail("datos", `tabla ${table} -> HTTP ${res.status}. Ejecuta tfm/tech/supabase_schema.sql en el SQL Editor.`);
    } catch (e) {
      fail("datos", `no se pudo contactar con Supabase: ${e.message}`);
      return;
    }
  }
}

async function checkChain() {
  const { ethers } = require("ethers");
  const rpc = env("POLYGON_AMOY_RPC") || AMOY.defaultRpc;
  let provider;
  try {
    provider = new ethers.JsonRpcProvider(rpc);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== AMOY.chainId) {
      fail("blockchain", `el RPC responde chainId ${net.chainId}, se esperaba ${AMOY.chainId} (${AMOY.name}).`);
      return;
    }
    const block = await provider.getBlockNumber();
    ok("blockchain", `RPC ${AMOY.name} respondiendo (bloque ${block})`);
  } catch (e) {
    fail("blockchain", `RPC inalcanzable (${rpc}): ${e.message}`);
    return;
  }

  let wallet = null;
  const pk = env("ISSUER_PRIVATE_KEY");
  if (!pk) {
    fail("blockchain", "ISSUER_PRIVATE_KEY no configurada: no se puede anclar (si se puede verificar).");
  } else {
    try {
      wallet = new ethers.Wallet(normalizePrivateKey(pk), provider);
      const balance = await provider.getBalance(wallet.address);
      const pol = ethers.formatEther(balance);
      if (balance === 0n) fail("blockchain", `wallet emisora ${wallet.address} sin gas. Faucet: ${AMOY.faucet}`);
      else ok("blockchain", `wallet emisora ${wallet.address} con ${pol} POL`);
      const declared = env("ISSUER_ADDRESS");
      if (declared && declared.toLowerCase() !== wallet.address.toLowerCase()) {
        warn("blockchain", `ISSUER_ADDRESS (${declared}) no coincide con la clave privada (${wallet.address}).`);
      }
    } catch (e) {
      fail("blockchain", `ISSUER_PRIVATE_KEY invalida: ${e.message}`);
    }
  }

  const address = env("SKILLPASS_CONTRACT_ADDRESS");
  if (!address) {
    fail("blockchain", "SKILLPASS_CONTRACT_ADDRESS no configurada. Despliega con: npm run deploy:contract");
    return;
  }
  try {
    const code = await provider.getCode(address);
    if (!code || code === "0x") {
      fail("blockchain", `no hay contrato en ${address} (¿red equivocada?).`);
      return;
    }
    const abi = ["function issuer() view returns (address)"];
    const contract = new ethers.Contract(address, abi, provider);
    const issuer = await contract.issuer();
    ok("blockchain", `contrato en ${address} (${(code.length / 2 - 1)} bytes)`);
    if (wallet && issuer.toLowerCase() !== wallet.address.toLowerCase()) {
      fail("blockchain", `el emisor del contrato es ${issuer}, pero firmas con ${wallet.address}: anchor() sera rechazado.`);
    } else if (wallet) {
      ok("blockchain", "la wallet del .env es el emisor autorizado del contrato");
    }
    console.log("");
    console.log("  Explorer: " + AMOY.explorer + "/address/" + address);
  } catch (e) {
    fail("blockchain", `no se pudo leer el contrato: ${e.message}`);
  }
}

const ICON = { ok: "[ok]  ", warn: "[warn]", fail: "[FALLA]" };

async function main() {
  console.log("\n  TalentPact — diagnostico de configuracion\n");
  await checkEnvFile();
  await checkAI();
  await checkSupabase();
  await checkChain();

  console.log("");
  let lastArea = null;
  for (const r of results) {
    if (r.area !== lastArea) { console.log("  " + r.area.toUpperCase()); lastArea = r.area; }
    console.log("    " + ICON[r.level] + " " + r.msg);
  }

  const fails = results.filter((r) => r.level === "fail").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log("");
  if (fails) {
    console.log(`  ${fails} bloqueo(s) y ${warns} aviso(s). El flujo end-to-end aun no esta listo.\n`);
    process.exit(1);
  }
  console.log(`  Todo conectado (${warns} aviso(s)). Flujo IA -> Supabase -> anclaje -> verificacion operativo.\n`);
}

main().catch((e) => { console.error("\n  Error inesperado: " + e.message + "\n"); process.exit(1); });
