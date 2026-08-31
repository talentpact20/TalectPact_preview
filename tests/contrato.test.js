/**
 * El contrato y lo que el backend cree que es el contrato.
 *
 * `SKILLPASS_ABI` en lib/tp.js es una copia a mano de la interfaz del contrato.
 * Si alguien toca el .sol y no actualiza esa copia, las funciones serverless
 * fallan en producción con un error de ethers difícil de leer, y solo se nota
 * al intentar anclar o verificar una credencial de verdad.
 *
 * Estos tests compilan el contrato de verdad y comparan.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");
const solc = require("solc");

const { SKILLPASS_ABI, CHAIN } = require("../netlify/functions/lib/tp");
const RUTA = path.join(__dirname, "..", "tfm", "tech", "contracts", "SkillPassRegistry.sol");

/** Compila una sola vez para todos los tests. */
let _compilado = null;
function compilar() {
  if (_compilado) return _compilado;
  const source = fs.readFileSync(RUTA, "utf8");
  const salida = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { "SkillPassRegistry.sol": { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } }
  })));
  const problemas = (salida.errors || []);
  const errores = problemas.filter((e) => e.severity === "error");
  _compilado = {
    abi: salida.contracts["SkillPassRegistry.sol"].SkillPassRegistry.abi,
    bytecode: salida.contracts["SkillPassRegistry.sol"].SkillPassRegistry.evm.bytecode.object,
    errores,
    avisos: problemas.filter((e) => e.severity === "warning"),
    source
  };
  return _compilado;
}

test("el contrato compila sin errores y sin avisos", () => {
  const { errores, avisos } = compilar();
  assert.equal(errores.length, 0, errores.map((e) => e.formattedMessage).join("\n"));
  // Un aviso del compilador en un contrato de 50 líneas es algo que hay que mirar,
  // no algo que se tolera.
  assert.equal(avisos.length, 0, avisos.map((e) => e.formattedMessage).join("\n"));
});

test("produce bytecode desplegable", () => {
  const { bytecode } = compilar();
  assert.ok(bytecode && bytecode.length > 200, "el bytecode está vacío");
});

test("el ABI que usa el backend coincide con el contrato compilado", () => {
  const real = new ethers.Interface(compilar().abi);
  const usado = new ethers.Interface(SKILLPASS_ABI);
  for (const frag of usado.fragments) {
    const firma = frag.format("sighash");
    assert.ok(
      real.fragments.some((f) => f.type === frag.type && f.format("sighash") === firma),
      `lib/tp.js declara «${firma}» y el contrato no lo tiene. Actualiza SKILLPASS_ABI.`
    );
  }
});

test("los selectores de las funciones que se llaman son los del contrato", () => {
  // Un cambio de tipos que no altere el nombre (bytes32 -> bytes) rompería el
  // selector sin que el test anterior lo notase.
  const real = new ethers.Interface(compilar().abi);
  const usado = new ethers.Interface(SKILLPASS_ABI);
  for (const nombre of ["anchor", "isAnchored", "issuer"]) {
    assert.equal(usado.getFunction(nombre).selector, real.getFunction(nombre).selector, `selector distinto en ${nombre}()`);
  }
});

test("anchor solo la puede llamar el emisor y rechaza el hash vacío", () => {
  // No hay nodo local para ejecutar el contrato, así que se comprueba sobre el
  // fuente que los dos controles siguen ahí. Es una red de seguridad barata
  // contra una edición descuidada.
  const { source } = compilar();
  const cuerpo = source.slice(source.indexOf("function anchor("), source.indexOf("function isAnchored("));
  assert.match(cuerpo, /onlyIssuer/, "anchor() ha perdido el modificador onlyIssuer");
  assert.match(cuerpo, /cvHash != bytes32\(0\)/, "anchor() ya no rechaza el hash vacío");
  assert.match(cuerpo, /anchoredAt\[cvHash\] == 0/, "anchor() ha perdido la guarda de idempotencia");
});

test("transferIssuer no permite tirar el control a la dirección cero", () => {
  const { source } = compilar();
  const cuerpo = source.slice(source.indexOf("function transferIssuer("));
  assert.match(cuerpo, /onlyIssuer/);
  assert.match(cuerpo, /newIssuer != address\(0\)/);
});

test("el contrato no declara ninguna función de borrado", () => {
  // El argumento RGPD del trabajo es que on-chain solo hay un hash y que el
  // olvido se ejerce borrando el dato off-chain. Si alguien añadiese un
  // selfdestruct o un delete, ese argumento cambiaría y hay que reescribirlo.
  const { source } = compilar();
  assert.ok(!/selfdestruct|delete\s+anchoredAt/.test(source), "el contrato ahora puede borrar: revisa el apartado de RGPD");
});

test("la red del despliegue registrado es la que usan las funciones", () => {
  const desp = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tfm", "tech", "build", "deployment-sepolia.json"), "utf8"));
  const chainId = desp.chainId || (desp.network && desp.network.chainId);
  assert.equal(Number(chainId), CHAIN.chainId);
  assert.ok(ethers.isAddress(desp.address || desp.contractAddress));
});
