/**
 * Árbol de Merkle del sellado por lotes (docs/plan_post_reunion/03, §4.2).
 *
 * Cada credencial sellada es una hoja: keccak256(sal ‖ JSON canónico de la
 * credencial). Al día se publica solo la raíz. Árbol de pares ordenados (en
 * cada nivel se hashea menor ‖ mayor), el mismo que comprueba verifyLeaf() del
 * contrato SkillPassRegistryV2 y la librería MerkleProof de OpenZeppelin: la
 * prueba de cada hoja es una lista de hashes, sin posiciones.
 */
const { getEthers, canonicalJson } = require("./tp");

const HEX32 = /^0x[0-9a-f]{64}$/;

function keccak(bytes) {
  const { ethers } = getEthers();
  return ethers.keccak256(bytes);
}

/** Hoja de una credencial. sal: 0x + 64 hex. */
function hoja(sal, credencial) {
  const { ethers } = getEthers();
  if (!HEX32.test(String(sal).toLowerCase())) throw new Error("Sal no válida");
  return keccak(ethers.concat([ethers.getBytes(sal), ethers.toUtf8Bytes(canonicalJson(credencial))]));
}

function par(a, b) {
  const { ethers } = getEthers();
  return a.toLowerCase() < b.toLowerCase() ? keccak(ethers.concat([a, b])) : keccak(ethers.concat([b, a]));
}

/**
 * Construye el árbol. Devuelve { raiz, pruebas } con una prueba por hoja, en
 * el mismo orden de entrada. Un nodo sin pareja sube tal cual al nivel siguiente.
 */
function construir(hojas) {
  if (!Array.isArray(hojas) || !hojas.length) throw new Error("Lote vacío");
  const pruebas = hojas.map(() => []);
  let nivel = hojas.map((h, i) => ({ h: h.toLowerCase(), hojas: [i] }));
  while (nivel.length > 1) {
    const siguiente = [];
    for (let i = 0; i < nivel.length; i += 2) {
      const a = nivel[i], b = nivel[i + 1];
      if (!b) { siguiente.push(a); continue; }
      a.hojas.forEach((k) => pruebas[k].push(b.h));
      b.hojas.forEach((k) => pruebas[k].push(a.h));
      siguiente.push({ h: par(a.h, b.h), hojas: a.hojas.concat(b.hojas) });
    }
    nivel = siguiente;
  }
  return { raiz: nivel[0].h, pruebas };
}

/** ¿La prueba lleva de la hoja a la raíz? (Lo mismo que verifyLeaf en el contrato.) */
function verificar(h, prueba, raiz) {
  if (!Array.isArray(prueba)) return false;
  let x = String(h).toLowerCase();
  for (const p of prueba) {
    if (!HEX32.test(String(p).toLowerCase())) return false;
    x = par(x, String(p).toLowerCase());
  }
  return x === String(raiz).toLowerCase();
}

module.exports = { hoja, construir, verificar };
