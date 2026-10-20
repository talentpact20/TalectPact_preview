/**
 * issue-credential — emite el SkillPass del candidato: una credencial W3C VC 2.0
 * firmada por TalentPact (lib/vc.js), con sus skills en bandas, caducidad a
 * 12 meses y entrada en la lista de revocación. Emitir es gratis; el sello
 * público en blockchain es un extra (anchor-credential + anchor-batch).
 *
 * Body: {}  — el candidato se deduce del token.
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El `userId` no se acepta desde el cliente: se lee del token. Antes se podía
 * emitir la credencial de cualquier candidato pasando su id o su alias.
 *
 * Devuelve: { credentialId, vc, verifyUrl, validUntil, firmada, sello, reused }
 * (cvJson y cvHash se mantienen por compatibilidad con la interfaz).
 */
const crypto = require("node:crypto");
const {
  jsonResponse, sb, authUser, ensureProfileByUser, canonicalJson, hashCv,
  faltaEnEsquema, esDuplicado, errorInterno
} = require("../tp");
const { construirVC, firmar, firmaConfigurada, TAM_LISTA, SITIO } = require("../vc");
const { estadoSello, cargarLote, vigenteHasta } = require("../skillpass");
const { limitar } = require("../limites");

/**
 * Mejor nota por skill, prefiriendo siempre las verificadas (firmadas por el
 * corrector con el enunciado oficial). Cada skill dice si lo está: antes el
 * SkillPass sellaba en la cadena notas que había enviado el navegador como si
 * fueran tan fiables como las corregidas.
 */
function mejoresSkills(evals) {
  const best = {};
  for (const e of evals) {
    const verified = !!(e.integrity && e.integrity.verified);
    const cur = best[e.skill];
    if (!cur || (verified && !cur.verified) || (verified === cur.verified && e.score > cur.score)) {
      best[e.skill] = {
        skill: e.skill, score: e.score, challengeId: e.challenge_id, evaluatedAt: e.created_at, verified,
        rubricVersion: verified && e.integrity && e.integrity.evaluatorVersion ? String(e.integrity.evaluatorVersion).slice(0, 20) : null
      };
    }
  }
  return Object.values(best).sort((a, b) => (b.verified - a.verified) || (b.score - a.score));
}

/** Huella de las skills (para no emitir otra credencial si no han cambiado). */
function huellaSkills(vcOrCv) {
  const sk = (vcOrCv && vcOrCv.credentialSubject && vcOrCv.credentialSubject.skills) || [];
  return canonicalJson(sk.map((s) => [s.skill, s.banda, s.verificada, s.evaluadoEl]));
}

/** Respuesta común para una fila de credentials. */
async function respuesta(cred, reused) {
  const vc = cred.cv_json;
  const hasta = vigenteHasta(cred);
  return jsonResponse(200, {
    ok: true,
    reused,
    credentialId: cred.id,
    vc,
    cvJson: vc,
    cvHash: cred.cv_hash,
    verifyUrl: SITIO() + "/verify.html?c=" + cred.id,
    validUntil: hasta ? hasta.toISOString() : null,
    firmada: !!(vc && vc.proof),
    revocada: !!cred.revoked_at,
    sello: estadoSello(cred, await cargarLote(cred.batch_id))
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  let user;
  try { user = await authUser(event, b); }
  catch (err) { return errorInterno("No se pudo validar la sesión", err); }
  if (!user) {
    return jsonResponse(401, {
      error: "Necesitas iniciar sesión para emitir tu SkillPass",
      details: "Falta la cabecera Authorization: Bearer <access token> o el token ha caducado."
    });
  }

  if (await limitar("issue:" + user.id, { max: 20, ventanaS: 3600 })) {
    return jsonResponse(429, { error: "Has emitido muchos SkillPass seguidos. Prueba dentro de un rato." });
  }

  try {
    const profile = await ensureProfileByUser(user.id, { email: user.email });

    let evals;
    try {
      evals = await sb.select(
        "evaluations",
        `profile_id=eq.${profile.id}&select=skill,score,challenge_id,created_at,integrity&order=created_at.asc`
      );
    } catch (err) {
      if (!faltaEnEsquema(err, /integrity/i)) throw err;
      evals = await sb.select(
        "evaluations",
        `profile_id=eq.${profile.id}&select=skill,score,challenge_id,created_at&order=created_at.asc`
      );
    }
    if (!Array.isArray(evals) || !evals.length) {
      return jsonResponse(400, { error: "Este candidato no tiene evaluaciones que certificar" });
    }

    const skills = mejoresSkills(evals);
    const ahora = new Date();

    // Si ya hay una credencial v2 vigente y sin revocar con las mismas skills,
    // se reutiliza: su firma, su enlace y su sello siguen valiendo.
    const previas = await sb.select("credentials", `profile_id=eq.${profile.id}&select=*&order=created_at.desc&limit=20`);
    const borrador = construirVC({ id: "x", profileId: profile.id, skills, ahora, statusIndex: 0 });
    const huella = huellaSkills(borrador);
    const igual = (Array.isArray(previas) ? previas : []).find((c) =>
      c.cv_json && c.cv_json.credentialSubject && !c.revoked_at &&
      huellaSkills(c.cv_json) === huella && (vigenteHasta(c) || 0) > ahora
    );
    if (igual) return respuesta(igual, true);

    // Índice de revocación al azar (la norma lo recomienda: no delata el orden
    // de emisión). Si choca con otro (índice único), se reintenta.
    for (let intento = 0; intento < 5; intento++) {
      const id = crypto.randomUUID();
      const statusIndex = crypto.randomInt(0, TAM_LISTA);
      const vc = firmar(construirVC({ id, profileId: profile.id, skills, ahora, statusIndex }), ahora);
      const fila = {
        id,
        profile_id: profile.id,
        cv_json: vc,
        cv_hash: hashCv(vc),
        chain: "talentpact",
        format: "vc2",
        status_index: statusIndex,
        valid_until: vc.validUntil,
        salt: "0x" + crypto.randomBytes(32).toString("hex")
      };
      let inserted;
      try {
        inserted = await sb.insert("credentials", fila);
      } catch (err) {
        if (esDuplicado(err)) continue;
        // Sin supabase_schema_vc.sql la credencial se emite igual (firmada y con
        // caducidad dentro del propio documento); revocar y sellar esperan a la migración.
        if (!faltaEnEsquema(err, /format|status_index|valid_until|salt/i)) throw err;
        const { format: _f, status_index: _s, valid_until: _v, salt: _sa, ...basica } = fila;
        inserted = await sb.insert("credentials", basica);
      }
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      const res = await respuesta(Object.assign({}, fila, row || {}), false);
      if (!firmaConfigurada()) {
        const body = JSON.parse(res.body);
        body.aviso = "Falta VC_SIGNING_KEY en el servidor: la credencial se ha emitido sin firma digital y solo se puede comprobar en TalentPact.";
        res.body = JSON.stringify(body);
      }
      return res;
    }
    throw new Error("No se pudo asignar un índice de revocación libre");
  } catch (err) {
    return errorInterno("No se pudo emitir la credencial", err);
  }
};

module.exports.mejoresSkills = mejoresSkills;
