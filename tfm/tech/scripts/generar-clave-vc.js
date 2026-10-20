/**
 * generar-clave-vc — crea la clave Ed25519 con la que TalentPact firma los SkillPass.
 *
 * Uso: npm run vc:clave
 *
 * Imprime la clave privada en formato PEM (una línea, con \n) para pegarla en
 * la variable VC_SIGNING_KEY de Netlify, y la clave pública en formato Multikey
 * tal como aparecerá en /.well-known/did.json. No guarda nada en disco.
 * Guárdala en un gestor de secretos: si se pierde, los SkillPass ya emitidos
 * dejan de poder verificarse con la firma (habría que reemitirlos).
 */
const crypto = require("node:crypto");
const { privateKey } = crypto.generateKeyPairSync("ed25519");
const pem = privateKey.export({ format: "pem", type: "pkcs8" });
process.env.VC_SIGNING_KEY = pem;
const { documentoDid } = require("../../../netlify/functions/lib/vc.js");

console.log("\n  Clave de firma de los SkillPass (Ed25519)\n");
console.log("  VC_SIGNING_KEY=" + JSON.stringify(pem).slice(1, -1) + "\n");
console.log("  Clave pública (did.json): " + documentoDid().verificationMethod[0].publicKeyMultibase + "\n");
console.log("  Pégala en Netlify → Site configuration → Environment variables, marcada como secreta.");
console.log("  Es distinta de ISSUER_PRIVATE_KEY (la cartera de la blockchain).\n");
