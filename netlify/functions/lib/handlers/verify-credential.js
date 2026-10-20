/**
 * verify-credential — comprueba un SkillPass. Público y gratis: verificar nunca
 * se cobra (docs/plan_post_reunion/03 §2).
 *
 * Entrada:  GET ?c=<id>  ·  GET ?h=<huella v1>
 *           POST { credentialId }  ·  { vc }  (la credencial pegada o subida)
 *           POST { cvJson } / { cvHash }  (formato antiguo, sigue valiendo)
 *
 * Resultado: uno de cinco estados, cada uno con su explicación:
 *   valida      firma correcta, sin revocar y dentro de plazo
 *   caducada    auténtica, pero tiene más de 12 meses
 *   revocada    TalentPact la retiró (fraude o petición del titular)
 *   alterada    el contenido no coincide con la firma o con nuestro registro
 *   no_encontrada  el código no existe (o el titular la borró)
 * + detalle (skills con banda y fecha, integridad, rúbrica, revisión humana) y
 * el sello público si lo tiene, con lo necesario para comprobarlo sin TalentPact.
 *
 * Nunca devuelve el id del perfil ni datos de contacto: solo el seudónimo.
 */
const {
  jsonResponse, sb, hashCv, canonicalJson, isHash32, isUuid, errorInterno,
  chainConfigured, getContract, sealChainConfigured, getSealContract
} = require("../tp");
const { verificarFirma, EMISOR } = require("../vc");
const { banda } = require("../bandas");
const { familiaDe } = require("../personas");
const { estadoSello, cargarLote, vigenteHasta } = require("../skillpass");
const merkle = require("../merkle");
const { limitar } = require("../limites");
const { clientIp } = require("../evaluator");

const EXPLICACION = {
  valida: "Firma de TalentPact correcta, no revocada y dentro de plazo.",
  caducada: "Es auténtica, pero las notas tienen más de 12 meses. El titular puede renovarla con retos nuevos.",
  revocada: "TalentPact la ha retirado (fraude detectado en una revisión humana o petición del titular).",
  alterada: "El contenido no coincide con la firma o con nuestro registro: alguien la ha modificado.",
  no_encontrada: "Este código no corresponde a ningún SkillPass emitido, o su titular lo ha borrado."
};

const resultado = (estado, extra) => jsonResponse(200, Object.assign({ ok: true, estado, explicacion: EXPLICACION[estado] }, extra));

/** Skills para mostrar: banda y fecha; nunca la nota exacta. Acepta v2 y v1. */
function skillsPublicas(doc) {
  if (doc && doc.credentialSubject && Array.isArray(doc.credentialSubject.skills)) {
    return doc.credentialSubject.skills.map((s) => ({
      skill: String(s.skill || ""), bloque: s.bloque || familiaDe(s.skill) || "hard", banda: s.banda, nivel: s.nivel,
      evaluadoEl: s.evaluadoEl || null, verificada: !!s.verificada, rubrica: s.rubrica || null, revisionHumana: !!s.revisionHumana
    }));
  }
  const v1 = doc && Array.isArray(doc.skills) ? doc.skills : [];
  return v1.map((s) => {
    const b = banda(s.score);
    return {
      skill: String(s.skill || ""), bloque: familiaDe(s.skill) || "hard", banda: b.txt, nivel: b.nivel,
      evaluadoEl: s.evaluatedAt ? String(s.evaluatedAt).slice(0, 10) : null, verificada: !!s.verified, rubrica: null, revisionHumana: false
    };
  });
}

async function buscarPorId(id) {
  const f = await sb.select("credentials", `id=eq.${id}&select=*&limit=1`);
  return Array.isArray(f) ? f[0] || null : null;
}
async function buscarPorHuella(h) {
  const f = await sb.select("credentials", `cv_hash=eq.${encodeURIComponent(h)}&select=*&limit=1`);
  return Array.isArray(f) ? f[0] || null : null;
}

/** ¿Está la raíz (v2) o la huella (v1) en la cadena? null si no se puede consultar ahora. */
async function enCadena(sello, cred) {
  try {
    if (sello.version === 2 && sello.comprobar && sello.comprobar.raiz && sealChainConfigured()) {
      const ts = await getSealContract().rootAnchoredAt(sello.comprobar.raiz);
      return Number(ts) > 0;
    }
    if (sello.version === 1 && chainConfigured()) {
      const [existe] = await getContract().isAnchored(cred.cv_hash);
      return !!existe;
    }
  } catch (err) {
    console.warn("[TP] verify: la red no responde:", err.message);
  }
  return null;
}

async function evaluar(cred, pegado) {
  const doc = cred.cv_json;
  const v2 = !!(doc && doc.credentialSubject);
  // Lo pegado tiene que ser exactamente lo que emitimos.
  if (pegado && canonicalJson(pegado) !== canonicalJson(doc)) {
    return resultado("alterada", { motivo: "El documento no coincide con el que emitió TalentPact." });
  }
  let firma = { firmada: false, ok: false, motivo: "v1" };
  if (v2) {
    firma = verificarFirma(doc);
    // Firmado y la firma no cuadra: el registro o el documento se han tocado.
    if (firma.firmada && !firma.ok && firma.motivo !== "sin_clave") {
      return resultado("alterada", { motivo: "La firma digital no coincide con el contenido." });
    }
  }
  const lote = await cargarLote(cred.batch_id);
  const sello = estadoSello(cred, lote);
  if (sello.estado === "sellado" && sello.version === 2 && sello.comprobar && sello.comprobar.hoja) {
    // La prueba guardada tiene que llevar de esta credencial a la raíz publicada.
    const hojaOk = cred.salt && merkle.hoja(cred.salt, doc) === String(sello.comprobar.hoja).toLowerCase();
    if (!hojaOk || !merkle.verificar(sello.comprobar.hoja, sello.comprobar.prueba, sello.comprobar.raiz)) {
      return resultado("alterada", { motivo: "La credencial no coincide con la huella sellada en la cadena." });
    }
  }
  if (sello.estado === "sellado" || sello.estado === "enviado") sello.confirmadoEnRed = await enCadena(sello, cred);

  const hasta = vigenteHasta(cred);
  const detalle = {
    credentialId: cred.id,
    formato: v2 ? "W3C VC 2.0" : "SkillPass v1",
    emisor: v2 ? doc.issuer : EMISOR(),
    titular: v2 ? doc.credentialSubject.id : "urn:tp:cand:(v1)",
    emitidaEl: (v2 ? doc.validFrom : doc && doc.issuedAt) || null,
    validaHasta: hasta ? hasta.toISOString() : null,
    firma: v2 ? (firma.ok ? "Ed25519 · eddsa-jcs-2022 · correcta" : "Sin firma digital (emitida antes de activar la firma)") : "Registro de TalentPact (formato anterior a la firma)",
    skills: skillsPublicas(doc),
    sello,
    vc: v2 ? doc : null
  };
  if (cred.revoked_at) return resultado("revocada", Object.assign(detalle, { revocadaEl: cred.revoked_at }));
  if (hasta && hasta.getTime() < Date.now()) return resultado("caducada", detalle);
  return resultado("valida", detalle);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return publica(jsonResponse(200, { ok: true }));
  // Público y sin cuenta: se limita por IP para que nadie recorra el registro a ciegas.
  if (await limitar("verify:" + clientIp(event), { max: 120, ventanaS: 600 })) {
    return publica(jsonResponse(429, { error: "Demasiadas comprobaciones seguidas. Espera unos minutos." }));
  }
  return publica(await atender(event));
};

/** Verificar es público por diseño: cualquier web puede consultarlo. */
function publica(res) {
  res.headers = Object.assign({}, res.headers, { "access-control-allow-origin": "*" });
  return res;
}

async function atender(event) {
  try {
    let b = {};
    if (event.httpMethod === "GET") {
      const q = event.queryStringParameters || {};
      b = { credentialId: q.c || q.id, cvHash: q.h || q.hash };
    } else if (event.httpMethod === "POST") {
      try { b = JSON.parse(event.body || "{}"); }
      catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }
    } else {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    // Credencial pegada o subida (v2 o v1).
    let pegado = b.vc || b.cvJson || null;
    if (typeof pegado === "string") {
      if (pegado.length > 200000) return jsonResponse(413, { error: "El documento es demasiado grande" });
      try { pegado = JSON.parse(pegado); }
      catch (_e) { return jsonResponse(400, { error: "Lo que has pegado no es un SkillPass (JSON no válido)" }); }
    }
    if (pegado && typeof pegado === "object") {
      const m = /^urn:uuid:([0-9a-f-]{36})$/i.exec(String(pegado.id || ""));
      const cred = m && isUuid(m[1]) ? await buscarPorId(m[1]) : await buscarPorHuella(hashCv(pegado));
      if (!cred) {
        // No está en nuestro registro: si la firma es nuestra, alguien la ha
        // modificado o su titular la borró; en ningún caso es válida.
        const f = verificarFirma(pegado);
        return f.firmada && !f.ok && f.motivo === "firma_no_coincide"
          ? resultado("alterada", { motivo: "La firma digital no coincide con el contenido." })
          : resultado("no_encontrada");
      }
      return evaluar(cred, pegado);
    }

    const id = String(b.credentialId || "").trim();
    if (id) {
      if (!isUuid(id)) return resultado("no_encontrada");
      const cred = await buscarPorId(id);
      return cred ? evaluar(cred, null) : resultado("no_encontrada");
    }
    const h = String(b.cvHash || "").trim();
    if (h) {
      if (!isHash32(h)) return jsonResponse(400, { error: "Código no válido", details: "Pega el enlace del SkillPass, su código o el archivo .json." });
      const cred = await buscarPorHuella(h);
      return cred ? evaluar(cred, null) : resultado("no_encontrada");
    }
    return jsonResponse(400, { error: "Pega el enlace del SkillPass, su código o el archivo .json." });
  } catch (err) {
    return errorInterno("No se pudo verificar la credencial", err);
  }
}

module.exports.skillsPublicas = skillsPublicas;
module.exports.EXPLICACION = EXPLICACION;
