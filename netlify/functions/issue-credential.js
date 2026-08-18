/**
 * issue-credential — compone el "SkillPass CV" a partir de las evaluaciones
 * de un candidato, calcula su hash y lo guarda en Supabase (aún sin anclar).
 * Body: { profileName? }
 * Devuelve: { credentialId, cvJson, cvHash }
 */
const { jsonResponse, sb, ensureProfile, hashCv } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const profile = await ensureProfile(b.profileName);

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

    return jsonResponse(200, { ok: true, credentialId: row && row.id, cvJson, cvHash });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo emitir la credencial", details: err.message });
  }
};
