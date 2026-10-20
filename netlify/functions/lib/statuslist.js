/**
 * Lista de revocación de los SkillPass (W3C Bitstring Status List v1.0).
 *
 * Un bit por credencial (su statusListIndex, asignado al azar al emitirla): 1 =
 * revocada. La lista entera se publica comprimida en /status/1 como credencial
 * firmada; cualquiera puede comprobar una revocación sin decirle a TalentPact
 * qué credencial está mirando (descarga la lista completa, no pregunta por una).
 */
const zlib = require("node:zlib");
const { TAM_LISTA, CONTEXTO, EMISOR, LISTA_ESTADO, firmar, iso } = require("./vc");

/** Índices revocados → encodedList (multibase base64url «u» de la lista GZIP). */
function codificar(indices, tam = TAM_LISTA) {
  const bits = Buffer.alloc(tam / 8);
  for (const i of indices) {
    const n = Number(i);
    if (!Number.isInteger(n) || n < 0 || n >= tam) continue;
    bits[n >> 3] |= 0x80 >> (n & 7);   // el bit 0 es el más significativo del primer byte
  }
  return "u" + zlib.gzipSync(bits).toString("base64url");
}

/** ¿Está activo el bit `indice` en una encodedList? */
function bitActivo(encodedList, indice) {
  const bits = zlib.gunzipSync(Buffer.from(String(encodedList).replace(/^u/, ""), "base64url"));
  const n = Number(indice);
  return !!(bits[n >> 3] & (0x80 >> (n & 7)));
}

/** La credencial de la lista, firmada por TalentPact. */
function credencialDeLista(indicesRevocados, ahora = new Date()) {
  return firmar({
    "@context": [CONTEXTO],
    id: LISTA_ESTADO(),
    type: ["VerifiableCredential", "BitstringStatusListCredential"],
    issuer: EMISOR(),
    validFrom: iso(ahora),
    credentialSubject: {
      id: LISTA_ESTADO() + "#lista",
      type: "BitstringStatusList",
      statusPurpose: "revocation",
      encodedList: codificar(indicesRevocados)
    }
  }, ahora);
}

module.exports = { codificar, bitActivo, credencialDeLista };
