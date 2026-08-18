/**
 * save-evaluation — persiste una evaluación de IA en Supabase.
 * Body: { userId?, profileName?, challengeId, skill, score, criteria?, reasoning?,
 *         modelUsed?, tokensIn?, tokensOut?, costEur? }
 */
const { jsonResponse, sb, ensureProfile, ensureProfileByUser } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (!b.challengeId || !b.skill || b.score == null) {
      return jsonResponse(400, { error: "challengeId, skill y score son obligatorios" });
    }

    const profile = b.userId
      ? await ensureProfileByUser(b.userId)
      : await ensureProfile(b.profileName);
    const score = Math.max(0, Math.min(100, Math.round(Number(b.score) || 0)));

    const inserted = await sb.insert("evaluations", {
      profile_id: profile.id,
      challenge_id: String(b.challengeId),
      skill: String(b.skill),
      score,
      criteria: b.criteria || null,
      reasoning: b.reasoning || null,
      model_used: b.modelUsed || null,
      tokens_in: b.tokensIn || null,
      tokens_out: b.tokensOut || null,
      cost_eur: b.costEur != null ? Number(b.costEur) : null
    });

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    return jsonResponse(200, { ok: true, profileId: profile.id, evaluationId: row && row.id });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar la evaluación", details: err.message });
  }
};
