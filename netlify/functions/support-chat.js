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

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
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

    const raw = await apiRes.json();
    if (!apiRes.ok) {
      return jsonResponse(502, {
        error: "Anthropic API request failed",
        details: raw?.error?.message || "Unknown Anthropic error"
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
