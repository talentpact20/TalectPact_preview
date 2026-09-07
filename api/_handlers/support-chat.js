exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const configuredModel = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) {
    return jsonResponse(500, { error: "Missing ANTHROPIC_API_KEY in environment variables" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const systemPrompt = String(body.systemPrompt || "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!systemPrompt || messages.length === 0) {
      return jsonResponse(400, { error: "systemPrompt and messages are required" });
    }

    const sanitizedMessages = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: String(m.content || "").slice(0, 4000)
      }));

    const triedModels = [];
    const modelCandidates = uniqueModels([
      configuredModel,
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-sonnet-4-20250514"
    ]);
    let apiRes = null;
    let raw = null;

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
          max_tokens: 300,
          system: systemPrompt,
          messages: sanitizedMessages
        })
      });
      const bodyText = await attemptRes.text();
      let parsedBody;
      try {
        parsedBody = JSON.parse(bodyText || "{}");
      } catch (_err) {
        parsedBody = { non_json_body: bodyText?.slice(0, 1200) || "" };
      }
      if (attemptRes.ok) {
        apiRes = attemptRes;
        raw = parsedBody;
        break;
      }
      if ((parsedBody?.error?.type || null) !== "not_found_error") {
        apiRes = attemptRes;
        raw = parsedBody;
        break;
      }
    }

    if (!apiRes || !apiRes.ok) {
      console.error("Anthropic chat error:", {
        status: apiRes?.status || 0,
        body: raw,
        tried_models: triedModels
      });
      return jsonResponse(502, {
        error: "Anthropic API request failed",
        details: raw?.error?.message || "Unknown Anthropic error",
        anthropic_type: raw?.error?.type || null,
        tried_models: triedModels
      });
    }

    const reply = (raw.content || []).map((c) => c.text || "").join("").trim();
    return jsonResponse(200, {
      reply: reply || "Disculpa, no he podido procesar tu mensaje. ¿Puedes reformularlo?"
    });
  } catch (err) {
    return jsonResponse(500, { error: "Unexpected server error", details: err.message });
  }
};

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
