/**
 * issue-credential — compone el "SkillPass CV" a partir de las evaluaciones
 * de un candidato, calcula su hash y lo guarda en Supabase (aún sin anclar).
 *
 * Body: {}  — no hace falta nada; el candidato se deduce del token.
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El `userId` ya no se acepta desde el cliente: se lee del token. Antes se
 * podía emitir la credencial de cualquier candidato pasando su id, o incluso
 * su alias público (`Candidato #A1B2`), que es adivinable.
 *
 * Devuelve: { credentialId, cvJson, cvHash, reused, anchored, txHash? }
 */
const {
  jsonResponse, sb, authUser, ensureProfileByUser, canonicalJson, hashCv,
  CHAIN, explorerTx
} = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (_e) { return jsonResponse(400, { error: "Body JSON no válido" }); }

  let user;
  try { user = await authUser(event, b); }
  catch (err) { return jsonResponse(500, { error: "No se pudo validar la sesión", details: err.message }); }
  if (!user) {
    return jsonResponse(401, {
      error: "Necesitas iniciar sesión para emitir tu SkillPass",
      details: "Falta la cabecera Authorization: Bearer <access token> o el token ha caducado."
    });
  }

  try {
    const profile = await ensureProfileByUser(user.id, { email: user.email });

    const evals = await sb.select(
      "evaluations",
      `profile_id=eq.${profile.id}&select=skill,score,challenge_id,created_at&order=created_at.asc`
    );
    if (!Array.isArray(evals) || !evals.length) {
      return jsonResponse(400, { error: "Este candidato no tiene evaluaciones que certificar" });
    }

    // Mejor score por skill.
    const bestBySkill = {};
    for (const e of evals) {
      const cur = bestBySkill[e.skill];
      if (!cur || e.score > cur.score) {
        bestBySkill[e.skill] = { skill: e.skill, score: e.score, challengeId: e.challenge_id, evaluatedAt: e.created_at };
      }
    }
    const skills = Object.values(bestBySkill).sort((a, b) => b.score - a.score);

    // Si ya existe una credencial con exactamente estas mismas skills, se
    // reutiliza en vez de emitir otra: el CV no ha cambiado, así que su hash
    // (y su anclaje, si lo tiene) siguen siendo válidos.
    const previous = await sb.select(
      "credentials",
      `profile_id=eq.${profile.id}&select=*&order=created_at.desc&limit=20`
    );
    const fingerprint = canonicalJson(skills);
    const match = (Array.isArray(previous) ? previous : []).find(
      (c) => c.cv_json && canonicalJson(c.cv_json.skills || []) === fingerprint
    );
    if (match) {
      return jsonResponse(200, {
        ok: true,
        reused: true,
        credentialId: match.id,
        cvJson: match.cv_json,
        cvHash: match.cv_hash,
        chain: match.chain || CHAIN.slug,
        // `anchored` solo es cierto cuando la transacción está confirmada; con
        // tx difundida pero sin bloque el sellado sigue en curso.
        anchored: !!(match.tx_hash && match.block_number != null),
        pending: !!(match.tx_hash && match.block_number == null),
        txHash: match.tx_hash || null,
        blockNumber: match.block_number != null ? Number(match.block_number) : null,
        anchoredAt: match.anchored_at || null,
        explorerUrl: match.tx_hash ? explorerTx(match.tx_hash) : null
      });
    }

    const cvJson = {
      type: "TalentPactSkillPass",
      version: "1.0",
      subject: `did:talentpact:candidate:${profile.id}`,
      issuer: "did:talentpact:issuer",
      issuedAt: new Date().toISOString(),
      skills,
      evaluator: {
        engine: "TalentPact AI Evaluator",
        method: "Dynamic Prompting + Chain of Thought"
      }
    };

    const cvHash = hashCv(cvJson);

    const inserted = await sb.insert("credentials", {
      profile_id: profile.id,
      cv_json: cvJson,
      cv_hash: cvHash,
      chain: CHAIN.slug
    });
    const row = Array.isArray(inserted) ? inserted[0] : inserted;

    return jsonResponse(200, {
      ok: true,
      reused: false,
      credentialId: row && row.id,
      cvJson,
      cvHash,
      chain: CHAIN.slug,
      anchored: false,
      pending: false
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo emitir la credencial", details: err.message });
  }
};
