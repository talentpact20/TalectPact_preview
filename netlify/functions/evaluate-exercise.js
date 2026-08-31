exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.anthropicapikey || process.env.ANTHROPIC_KEY;
  const configuredModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
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

    const triedModels = [];
    const modelCandidates = uniqueModels([
      configuredModel,
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet-latest"
    ]);
    let apiRes = null;
    let raw = null;
    let selectedModel = null;

    for (const model of modelCandidates) {
      triedModels.push(model);
      const attemptRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          // Determinismo: mismo input -> mismo score. Sin esto la API usa su
          // valor por defecto (1.0) y el evaluador deja de ser reproducible,
          // que es justo lo que exige un sistema que decide sobre empleo.
          // El PoC ya lo fijaba; producción no, y es lo que se demuestra en vivo.
          temperature: 0,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        })
      });
      const rawText = await attemptRes.text();
      let parsedBody;
      try {
        parsedBody = JSON.parse(rawText || "{}");
      } catch (_err) {
        parsedBody = { non_json_body: rawText?.slice(0, 1200) || "" };
      }

      if (attemptRes.ok) {
        apiRes = attemptRes;
        raw = parsedBody;
        selectedModel = model;
        break;
      }

      const errType = parsedBody?.error?.type || null;
      if (errType !== "not_found_error") {
        apiRes = attemptRes;
        raw = parsedBody;
        break;
      }
    }

    if (!apiRes || !apiRes.ok) {
      console.error("Anthropic error:", {
        status: apiRes?.status || 0,
        body: raw,
        tried_models: triedModels
      });
      return jsonResponse(502, {
        error: "Anthropic API request failed",
        anthropic_status: apiRes?.status || 0,
        details: raw?.error?.message || "Unknown Anthropic error",
        anthropic_type: raw?.error?.type || null,
        tried_models: triedModels
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
    parsed.modelUsed = selectedModel;
    parsed.configuredModel = configuredModel;
    parsed.usedConfiguredModel = selectedModel === configuredModel;
    parsed.triedModels = triedModels;
    parsed.usage = raw.usage || null; // { input_tokens, output_tokens } para el cálculo de coste

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

function uniqueModels(models) {
  return [...new Set(models.filter(Boolean))];
}
