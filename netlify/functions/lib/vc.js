/**
 * SkillPass como credencial verificable W3C (VC Data Model 2.0), firmada por
 * TalentPact con Ed25519 (docs/plan_post_reunion/03_blockchain_de_pago.md §4.1).
 *
 *  · Emisor: did:web:talentpact.es. La clave pública se publica en
 *    /.well-known/did.json (función did-web), así que cualquiera comprueba la
 *    firma sin preguntar a TalentPact.
 *  · Firma: Data Integrity, cryptosuite «eddsa-jcs-2022» (JSON canónico RFC 8785
 *    + SHA-256 + Ed25519). La clave privada vive en VC_SIGNING_KEY (PEM PKCS#8),
 *    separada de la cartera de la blockchain.
 *  · Contenido: seudónimo del titular (no el email ni el id del perfil), skills
 *    con su bloque y su BANDA (no la nota exacta), fecha, verificación, versión
 *    de la rúbrica. Caduca a los 12 meses. Revocable (BitstringStatusList).
 */
const crypto = require("node:crypto");
const { canonicalJson } = require("./tp");
const { banda } = require("./bandas");
const { familiaDe } = require("./personas");

const CONTEXTO = "https://www.w3.org/ns/credentials/v2";
const SITIO = () => String(process.env.SITE_URL || "https://talentpact.es").replace(/\/+$/, "");
const EMISOR = () => process.env.VC_ISSUER_DID || "did:web:" + new URL(SITIO()).host;
const METODO = () => EMISOR() + "#clave-1";
const LISTA_ESTADO = () => SITIO() + "/status/1";
const VALIDEZ_MESES = 12;
/** Tamaño de la lista de revocación: 131.072 entradas (16 KB), el mínimo que pide la norma para no delatar a nadie. */
const TAM_LISTA = 131072;

// ── base58btc (multibase «z») ──────────────────────────────────────────────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58(buf) {
  let n = BigInt("0x" + (Buffer.from(buf).toString("hex") || "0"));
  let s = "";
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (const byte of buf) { if (byte === 0) s = "1" + s; else break; }
  return s;
}
function deB58(s) {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("base58 no válido");
    n = n * 58n + BigInt(i);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const ceros = s.length - s.replace(/^1+/, "").length;
  return Buffer.concat([Buffer.alloc(ceros), n === 0n ? Buffer.alloc(0) : Buffer.from(hex, "hex")]);
}

// ── Claves ─────────────────────────────────────────────────────────────────
let _cache = null;
function claves() {
  const pem = process.env.VC_SIGNING_KEY;
  if (!pem) return null;
  if (_cache && _cache.pem === pem) return _cache;
  const texto = pem.includes("BEGIN") ? pem.replace(/\\n/g, "\n") : `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----\n`;
  const privada = crypto.createPrivateKey(texto);
  if (privada.asymmetricKeyType !== "ed25519") throw new Error("VC_SIGNING_KEY debe ser una clave Ed25519");
  const publica = crypto.createPublicKey(privada);
  _cache = { pem, privada, publica };
  return _cache;
}
const firmaConfigurada = () => { try { return !!claves(); } catch (_e) { return false; } };

/** Clave pública en formato Multikey (z + base58btc(0xed01 ‖ 32 bytes)). */
function multibasePublica(publica) {
  const der = publica.export({ format: "der", type: "spki" });
  return "z" + b58(Buffer.concat([Buffer.from([0xed, 0x01]), der.subarray(der.length - 32)]));
}
function publicaDeMultibase(mb) {
  if (typeof mb !== "string" || mb[0] !== "z") throw new Error("Multikey no válido");
  const bytes = deB58(mb.slice(1));
  if (bytes.length !== 34 || bytes[0] !== 0xed || bytes[1] !== 0x01) throw new Error("Multikey no es Ed25519");
  const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), bytes.subarray(2)]);
  return crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
}

/** Documento DID del emisor (did:web), con la clave pública de verificación. */
function documentoDid() {
  const k = claves();
  if (!k) return null;
  const id = EMISOR();
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/multikey/v1"],
    id,
    verificationMethod: [{ id: METODO(), type: "Multikey", controller: id, publicKeyMultibase: multibasePublica(k.publica) }],
    assertionMethod: [METODO()]
  };
}

// ── Seudónimo del titular ──────────────────────────────────────────────────
/** Estable para el mismo perfil, imposible de invertir sin el secreto del servidor. */
function seudonimo(profileId) {
  const secreto = process.env.VC_SUBJECT_SECRET || process.env.EVAL_SIGNING_SECRET || process.env.VC_SIGNING_KEY || "";
  const h = secreto
    ? crypto.createHmac("sha256", secreto).update(String(profileId)).digest("hex")
    : crypto.createHash("sha256").update("tp-cand:" + profileId).digest("hex");
  return "urn:tp:cand:" + h.slice(0, 24);
}

function masMeses(fecha, meses) {
  const d = new Date(fecha);
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d;
}
const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, "Z");

/**
 * Compone la credencial (sin firmar).
 * skills: [{ skill, score, evaluatedAt, verified, rubricVersion? }]
 */
function construirVC({ id, profileId, skills, ahora = new Date(), statusIndex }) {
  const desde = new Date(ahora);
  return {
    "@context": [CONTEXTO],
    id: "urn:uuid:" + id,
    type: ["VerifiableCredential", "TalentPactSkillPass"],
    issuer: EMISOR(),
    name: "SkillPass TalentPact",
    validFrom: iso(desde),
    validUntil: iso(masMeses(desde, VALIDEZ_MESES)),
    credentialSubject: {
      id: seudonimo(profileId),
      skills: (skills || []).map((s) => {
        const b = banda(s.score);
        return {
          skill: String(s.skill),
          bloque: familiaDe(s.skill) || "hard",
          banda: b.txt,
          nivel: b.nivel,
          evaluadoEl: s.evaluatedAt ? String(s.evaluatedAt).slice(0, 10) : null,
          verificada: !!s.verified,
          rubrica: s.rubricVersion || null,
          revisionHumana: false
        };
      })
    },
    credentialStatus: {
      id: LISTA_ESTADO() + "#" + statusIndex,
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: String(statusIndex),
      statusListCredential: LISTA_ESTADO()
    }
  };
}

// ── Firma Data Integrity (eddsa-jcs-2022) ──────────────────────────────────
function datosAFirmar(documento, config) {
  const sinPrueba = Object.assign({}, documento);
  delete sinPrueba.proof;
  return Buffer.concat([
    crypto.createHash("sha256").update(canonicalJson(config)).digest(),
    crypto.createHash("sha256").update(canonicalJson(sinPrueba)).digest()
  ]);
}

/** Añade la prueba de firma. Sin VC_SIGNING_KEY devuelve el documento tal cual. */
function firmar(documento, ahora = new Date()) {
  const k = claves();
  if (!k) return documento;
  const config = {
    "@context": documento["@context"],
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created: iso(ahora),
    verificationMethod: METODO(),
    proofPurpose: "assertionMethod"
  };
  const firma = crypto.sign(null, datosAFirmar(documento, config), k.privada);
  const proof = Object.assign({}, config, { proofValue: "z" + b58(firma) });
  delete proof["@context"];
  return Object.assign({}, documento, { proof });
}

/**
 * Comprueba la firma con la clave de TalentPact (o la que se pase).
 * Devuelve { firmada, ok, motivo }.
 */
function verificarFirma(documento, publica) {
  const p = documento && documento.proof;
  if (!p) return { firmada: false, ok: false, motivo: "sin_firma" };
  if (p.type !== "DataIntegrityProof" || p.cryptosuite !== "eddsa-jcs-2022") return { firmada: true, ok: false, motivo: "formato_desconocido" };
  if (p.verificationMethod !== METODO()) return { firmada: true, ok: false, motivo: "otro_emisor" };
  let clave = publica;
  if (!clave) {
    const k = claves();
    if (!k) return { firmada: true, ok: false, motivo: "sin_clave" };
    clave = k.publica;
  }
  try {
    const config = Object.assign({ "@context": documento["@context"] }, p);
    delete config.proofValue;
    const firma = deB58(String(p.proofValue || "").replace(/^z/, ""));
    const ok = crypto.verify(null, datosAFirmar(documento, config), clave, firma);
    return { firmada: true, ok, motivo: ok ? null : "firma_no_coincide" };
  } catch (_e) {
    return { firmada: true, ok: false, motivo: "firma_no_coincide" };
  }
}

module.exports = {
  CONTEXTO, TAM_LISTA, VALIDEZ_MESES, EMISOR, METODO, LISTA_ESTADO, SITIO,
  construirVC, firmar, verificarFirma, firmaConfigurada, documentoDid, seudonimo,
  multibasePublica, publicaDeMultibase, b58, deB58, iso
};
