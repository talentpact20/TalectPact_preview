/**
 * evaluate-exercise — el motor de corrección.
 *
 * Dos modos:
 *
 *  · Corrector v2 (el que usa la web): Body { exercise, response, integrity? }.
 *    El servidor monta las reglas y la rúbrica, filtra el prompt injection
 *    antes de llamar al modelo y devuelve la nota con un recibo firmado.
 *
 *  · Modo crudo (solo banco de pruebas): Body { systemPrompt, userPrompt }.
 *    Deja al llamante escribir las reglas, así que en producción está apagado:
 *    hace falta EVAL_ALLOW_RAW_PROMPTS=1. Antes era el único modo, y convertía
 *    la función en un proxy abierto a la API de Anthropic en el que el propio
 *    candidato podía reescribir su examen.
 */
const {
  EVALUATOR_VERSION, MAX_RESPONSE_CHARS, SYSTEM_PROMPT, detectInjection,
  buildUserPrompt, normalizeExercise, signReceipt, sha256, rateLimited, clientIp
} = require("../evaluator");

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
    if (body.exercise && body.response != null) {
      return await evaluateV2(event, body, apiKey, configuredModel);
    }
    return await evaluateRaw(body, apiKey, configuredModel);
  } catch (err) {
    return jsonResponse(500, { error: "Unexpected server error", details: err.message });
  }
};

// ─── Modo crudo (banco de pruebas) ───────────────────────────────────────────
async function evaluateRaw(body, apiKey, configuredModel) {
  if (process.env.EVAL_ALLOW_RAW_PROMPTS !== "1") {
    return jsonResponse(403, {
      error: "El modo de prompts crudos está desactivado",
      details: "Usa el Corrector v2: { exercise, response }. El banco de pruebas activa el modo crudo con EVAL_ALLOW_RAW_PROMPTS=1."
    });
  }
  const systemPrompt = String(body.systemPrompt || "").trim();
  const userPrompt = String(body.userPrompt || "").trim();
  if (!systemPrompt || !userPrompt) {
    return jsonResponse(400, { error: "systemPrompt and userPrompt are required" });
  }
  const call = await callModel(systemPrompt, userPrompt, apiKey, configuredModel);
  if (call.error) return call.error;
  return jsonResponse(200, call.parsed);
}

// ─── Corrector v2 ────────────────────────────────────────────────────────────
async function evaluateV2(event, body, apiKey, configuredModel) {
  if (rateLimited("eval:" + clientIp(event))) {
    return jsonResponse(429, { error: "Demasiadas evaluaciones seguidas. Espera unos minutos." });
  }
  const ex = normalizeExercise(body.exercise);
  const response = String(body.response || "").trim();
  if (!ex.title || !ex.scenario) return jsonResponse(400, { error: "El ejercicio necesita título y escenario" });
  if (!response) return jsonResponse(400, { error: "La respuesta está vacía" });
  if (response.length > MAX_RESPONSE_CHARS) {
    return jsonResponse(413, { error: `La respuesta supera ${MAX_RESPONSE_CHARS} caracteres` });
  }

  const integrityRisk = body.integrity && typeof body.integrity.risk === "string"
    ? body.integrity.risk.slice(0, 10) : null;
  const injection = detectInjection(response);

  // Ataque claro: no se gasta una llamada al modelo y la nota es 0.
  if (injection.blocked) {
    const result = {
      score: 0,
      criteria: [{
        name: "Integridad de la respuesta",
        score: 0,
        comment: "La respuesta contiene instrucciones dirigidas al corrector (" + injection.signals.join(", ") + ")."
      }],
      overall: "La respuesta intenta manipular al sistema de evaluación en lugar de resolver el ejercicio. Se puntúa con 0 y queda registrado.",
      aiPowered: false,
      blockedByFilter: true
    };
    return jsonResponse(200, finishV2(result, ex, response, injection, integrityRisk, null));
  }

  const nonce = sha256(Math.random() + ":" + Date.now()).slice(0, 12);
  const call = await callModel(SYSTEM_PROMPT, buildUserPrompt(ex, response, nonce, injection), apiKey, configuredModel);
  if (call.error) return call.error;
  // Una señal leve no bloquea, pero tampoco deja que la nota pase de aprobado
  // raspado sin que una persona lo revise.
  if (injection.suspicious && call.parsed.score > 60) {
    call.parsed.score = 60;
    call.parsed.capped = "señal de manipulación: nota limitada a 60 hasta revisión humana";
  }
  return jsonResponse(200, finishV2(call.parsed, ex, response, injection, integrityRisk, call.selectedModel));
}

function finishV2(result, ex, response, injection, integrityRisk, model) {
  const { receipt, signed } = signReceipt({
    v: 2,
    ev: EVALUATOR_VERSION,
    cid: ex.challengeId,
    ex: sha256(ex.id + "|" + ex.title).slice(0, 16),
    s: result.score,
    rh: sha256(response).slice(0, 16),
    inj: injection.signals,
    ir: integrityRisk,
    m: model,
    iat: Math.floor(Date.now() / 1000)
  });
  return Object.assign(result, {
    evaluatorVersion: EVALUATOR_VERSION,
    injection: { blocked: injection.blocked, suspicious: injection.suspicious, signals: injection.signals },
    receipt,
    receiptSigned: signed
  });
}

// ─── Llamada al modelo (común a los dos modos) ───────────────────────────────
async function callModel(systemPrompt, userPrompt, apiKey, configuredModel) {
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
    return {
      error: jsonResponse(502, {
        error: "Anthropic API request failed",
        anthropic_status: apiRes?.status || 0,
        details: raw?.error?.message || "Unknown Anthropic error",
        anthropic_type: raw?.error?.type || null,
        tried_models: triedModels
      })
    };
  }

  const text = (raw.content || []).map((c) => c.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (_err) {
    return {
      error: jsonResponse(502, {
        error: "AI response is not valid JSON",
        details: clean.slice(0, 500)
      })
    };
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

  return { parsed, selectedModel };
}

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
