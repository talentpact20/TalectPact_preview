exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) {
    return jsonResponse(500, { error: "Missing ANTHROPIC_API_KEY in environment variables" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const systemPrompt = String(body.systemPrompt || "").trim();
    const userPrompt = String(body.userPrompt || "").trim();

    if (!systemPrompt || !userPrompt) {
      return jsonResponse(400, { error: "systemPrompt and userPrompt are required" });
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const raw = await apiRes.json();
    if (!apiRes.ok) {
      return jsonResponse(502, {
        error: "Anthropic API request failed",
        anthropic_status: apiRes.status,
        details: raw?.error?.message || "Unknown Anthropic error"
      });
    }

    const text = (raw.content || []).map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (_err) {
      return jsonResponse(502, {
        error: "AI response is not valid JSON",
        details: clean.slice(0, 500)
      });
    }

    parsed.score = clampScore(parsed.score);
    if (Array.isArray(parsed.criteria)) {
      parsed.criteria = parsed.criteria.map((c) => ({
        ...c,
        score: clampScore(c?.score)
      }));
    } else {
      parsed.criteria = [];
    }
    parsed.overall = String(parsed.overall || "");
    parsed.aiPowered = true;

    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, { error: "Unexpected server error", details: err.message });
  }
};

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}
