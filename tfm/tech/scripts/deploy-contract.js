/**
 * deploy-contract — compila y despliega SkillPassRegistry.sol en Ethereum Sepolia.
 *
 * Sustituye al paso manual con Remix del SETUP_CHECKLIST: compila con solc,
 * firma con la wallet emisora del .env y deja la direccion resultante lista
 * para pegar en SKILLPASS_CONTRACT_ADDRESS.
 *
 * Uso:   npm run deploy:contract
 *        npm run deploy:contract -- --dry-run     (solo compila, no despliega)
 *
 * Requiere en .env:  ISSUER_PRIVATE_KEY   (y opcionalmente SEPOLIA_RPC)
 */
const fs = require("fs");
const path = require("path");
const { ROOT, loadDotEnv, env, requireEnv, normalizePrivateKey, CHAIN } = require("./lib-env");

loadDotEnv();

const CONTRACT_PATH = path.join(ROOT, "tfm", "tech", "contracts", "SkillPassRegistry.sol");
const CONTRACT_NAME = "SkillPassRegistry";
const BUILD_DIR = path.join(ROOT, "tfm", "tech", "build");
const DRY_RUN = process.argv.includes("--dry-run");

function compile() {
  const solc = require("solc");
  const source = fs.readFileSync(CONTRACT_PATH, "utf8");
  const input = {
    language: "Solidity",
    sources: { "SkillPassRegistry.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  const warnings = (output.errors || []).filter((e) => e.severity !== "error");
  for (const w of warnings) console.warn("  aviso:", w.formattedMessage.trim());
  if (errors.length) {
    for (const e of errors) console.error(e.formattedMessage);
    throw new Error("La compilacion fallo.");
  }

  const artifact = output.contracts["SkillPassRegistry.sol"][CONTRACT_NAME];
  const abi = artifact.abi;
  const bytecode = "0x" + artifact.evm.bytecode.object;

  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(BUILD_DIR, CONTRACT_NAME + ".json"),
    JSON.stringify({ contractName: CONTRACT_NAME, compiler: solc.version(), abi, bytecode }, null, 2)
  );

  return { abi, bytecode, compiler: solc.version() };
}

async function main() {
  console.log("\n  Despliegue de " + CONTRACT_NAME + " en " + CHAIN.name + "\n");

  console.log("  1. Compilando " + path.relative(ROOT, CONTRACT_PATH) + " ...");
  const { abi, bytecode, compiler } = compile();
  console.log("     compilador: " + compiler);
  console.log("     bytecode:   " + (bytecode.length / 2 - 1) + " bytes");
  console.log("     artefacto:  " + path.relative(ROOT, path.join(BUILD_DIR, CONTRACT_NAME + ".json")));

  if (DRY_RUN) {
    console.log("\n  --dry-run: compilacion correcta, no se despliega nada.\n");
    return;
  }

  const { ethers } = require("ethers");
  const rpc = env("SEPOLIA_RPC") || env("POLYGON_AMOY_RPC") || CHAIN.defaultRpc;
  const pk = normalizePrivateKey(
    requireEnv("ISSUER_PRIVATE_KEY", "Paso 2 del SETUP_CHECKLIST: exporta la clave de la wallet de testnet.")
  );

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  console.log("\n  2. Conectando a la red ...");
  const network = await provider.getNetwork();
  console.log("     RPC:        " + rpc);
  console.log("     chainId:    " + network.chainId);
  if (Number(network.chainId) !== CHAIN.chainId) {
    throw new Error(
      `El RPC responde chainId ${network.chainId}, pero se esperaba ${CHAIN.chainId} (${CHAIN.name}). Revisa SEPOLIA_RPC.`
    );
  }

  const declared = env("ISSUER_ADDRESS");
  console.log("     emisor:     " + wallet.address);
  if (declared && declared.toLowerCase() !== wallet.address.toLowerCase()) {
    console.warn("     aviso: ISSUER_ADDRESS del .env (" + declared + ") no coincide con la clave privada.");
  }

  const balance = await provider.getBalance(wallet.address);
  console.log("     saldo:      " + ethers.formatEther(balance) + " POL");
  if (balance === 0n) {
    throw new Error("La wallet no tiene ETH de Sepolia. Pide gas gratis (solo Gmail) en " + CHAIN.faucet);
  }

  console.log("\n  3. Desplegando ...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const tx = contract.deploymentTransaction();
  console.log("     tx:         " + tx.hash);
  console.log("     esperando confirmacion ...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await provider.getTransactionReceipt(tx.hash);

  console.log("\n  Contrato desplegado.\n");
  console.log("     direccion:  " + address);
  console.log("     bloque:     " + receipt.blockNumber);
  console.log("     gas usado:  " + receipt.gasUsed.toString());
  console.log("     explorer:   " + CHAIN.explorer + "/address/" + address);

  console.log("\n  Ultimo paso — anade esta linea a tu .env (y a Netlify):\n");
  console.log("     SKILLPASS_CONTRACT_ADDRESS=" + address + "\n");

  fs.writeFileSync(
    path.join(BUILD_DIR, "deployment-sepolia.json"),
    JSON.stringify(
      {
        contractName: CONTRACT_NAME,
        chain: CHAIN.slug,
        chainId: CHAIN.chainId,
        address,
        issuer: wallet.address,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        deployedAt: new Date().toISOString(),
        explorer: CHAIN.explorer + "/address/" + address
      },
      null,
      2
    )
  );
  console.log("  Registro guardado en tfm/tech/build/deployment-sepolia.json\n");
}

main().catch((err) => {
  console.error("\n  Error: " + err.message + "\n");
  process.exit(1);
});
