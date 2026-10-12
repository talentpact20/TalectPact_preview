/**
 * support-chat — asistente de soporte.
 * Body: { messages: [{ role: "user" | "assistant", content }] }
 *
 * El prompt de sistema lo pone el servidor (lib/support-prompt.js): antes lo
 * mandaba el navegador y la función era un proxy abierto a la API de Anthropic.
 * Un `systemPrompt` en el body se ignora.
 */
const { buildSupportPrompt } = require("../support-prompt");
const { rateLimited, clientIp } = require("../evaluator");

const MODELOS = ["claude-sonnet-4-6", "claude-sonnet-4-5", "claude-3-5-haiku-latest"];

/**
 * Historial limpio: solo user/assistant, como mucho 10 turnos de 2.000
 * caracteres, y empezando por el usuario (la API rechaza un historial que
 * empiece por el asistente, y un corte por la mitad lo provocaba).
 */
function limpiarHistorial(messages) {
  const lista = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  while (lista.length && lista[0].role !== "user") lista.shift();
  return lista;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Missing ANTHROPIC_API_KEY in environment variables" });
  }
  if (rateLimited("chat:" + clientIp(event), { max: 40, windowMs: 10 * 60 * 1000 })) {
    return jsonResponse(429, { error: "Demasiados mensajes seguidos. Espera unos minutos." });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = limpiarHistorial(body.messages);
    if (!messages.length) {
      return jsonResponse(400, { error: "messages es obligatorio y debe incluir un mensaje del usuario" });
    }

    const modelos = [...new Set([process.env.ANTHROPIC_MODEL, ...MODELOS].filter(Boolean))];
    let raw = null;
    let status = 0;
    for (const model of modelos) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({ model, max_tokens: 300, system: buildSupportPrompt(), messages })
      });
      status = res.status;
      const text = await res.text();
      try { raw = JSON.parse(text || "{}"); } catch (_e) { raw = { non_json_body: text.slice(0, 500) }; }
      if (res.ok) break;
      // Solo se prueba otro modelo si este no existe; ante cualquier otro error
      // (clave revocada, cuota) reintentar solo gastaría más.
      if (raw?.error?.type !== "not_found_error") break;
    }

    if (status < 200 || status >= 300) {
      console.error("Anthropic chat error:", { status, body: raw });
      return jsonResponse(502, { error: "Anthropic API request failed", details: raw?.error?.message || "Unknown Anthropic error" });
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

module.exports.limpiarHistorial = limpiarHistorial;
