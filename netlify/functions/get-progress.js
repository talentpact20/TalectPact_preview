/**
 * get-progress — devuelve el perfil y el progreso guardado de un candidato.
 * Body: { userId }
 * Devuelve: { profile, skills:[{skill,score,challengeId,evaluatedAt}], completed:[...] }
 */
const { jsonResponse, sb, ensureProfileByUser } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (!b.userId) return jsonResponse(400, { error: "userId es obligatorio" });

    const profile = await ensureProfileByUser(b.userId);

    const evals = await sb.select(
      "evaluations",
      `profile_id=eq.${profile.id}&select=challenge_id,skill,score,criteria,reasoning,created_at&order=created_at.asc`
    );
    const list = Array.isArray(evals) ? evals : [];

    // Mejor score por skill.
    const bestBySkill = {};
    for (const e of list) {
      const cur = bestBySkill[e.skill];
      if (!cur || e.score > cur.score) {
        bestBySkill[e.skill] = {
          skill: e.skill,
          score: e.score,
          challengeId: e.challenge_id,
          evaluatedAt: e.created_at
        };
      }
    }
    const skills = Object.values(bestBySkill).sort((a, b) => b.score - a.score);

    // Un reto = una entrada (mejor intento), para no inflar el contador.
    const bestByChallenge = {};
    for (const e of list) {
      const cur = bestByChallenge[e.challenge_id];
      if (!cur || e.score > cur.score) {
        bestByChallenge[e.challenge_id] = {
          challengeId: e.challenge_id,
          skill: e.skill,
          score: e.score,
          criteria: e.criteria || null,
          reasoning: e.reasoning || null,
          evaluatedAt: e.created_at
        };
      }
    }
    const completed = Object.values(bestByChallenge);

    return jsonResponse(200, { ok: true, profile, skills, completed });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo cargar el progreso", details: err.message });
  }
};
