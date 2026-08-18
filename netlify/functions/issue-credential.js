/**
 * issue-credential — compone el "SkillPass CV" a partir de las evaluaciones
 * de un candidato, calcula su hash y lo guarda en Supabase (aún sin anclar).
 * Body: { userId? , profileName? }   — userId es el camino real (Supabase Auth);
 *                                      profileName es el modo demo/anónimo.
 * Devuelve: { credentialId, cvJson, cvHash, reused, anchored, txHash? }
 */
const { jsonResponse, sb, ensureProfile, ensureProfileByUser, canonicalJson, hashCv } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const profile = b.userId
      ? await ensureProfileByUser(b.userId, b)
      : await ensureProfile(b.profileName);

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
        anchored: !!match.tx_hash,
        txHash: match.tx_hash || null,
        anchoredAt: match.anchored_at || null
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
      chain: "polygon-amoy"
    });
    const row = Array.isArray(inserted) ? inserted[0] : inserted;

    return jsonResponse(200, {
      ok: true,
      reused: false,
      credentialId: row && row.id,
      cvJson,
      cvHash,
      anchored: false
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo emitir la credencial", details: err.message });
  }
};
