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
  buildUserPrompt, normalizeExercise, signReceipt, sha256, rateLimited, clientIp,
  puntuar, corregirDecision, corregirSecuencias
} = require("../evaluator");
const { retoComun, ejercicioComun } = require("../catalogo");
const { limitar } = require("../limites");
const { authUser } = require("../tp");

// La corrección tarda ~17 s; Netlify corta a los 60 s. Sin límite, una API
// lenta agotaba la función entera y el candidato perdía su respuesta sin aviso.
const MODEL_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS || 45000);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.anthropicapikey || process.env.ANTHROPIC_KEY;
  const configuredModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.exercise && body.response != null) {
      return await evaluateV2(event, body, apiKey, configuredModel);
    }
    return await evaluateRaw(body, apiKey, configuredModel);
  } catch (err) {
    if (err instanceof SyntaxError) return jsonResponse(400, { error: "Body JSON no válido" });
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return jsonResponse(504, { error: "La corrección ha tardado demasiado. Tu respuesta no se ha perdido: vuelve a enviarla." });
    }
    console.error("[TP] evaluate-exercise:", err);
    return jsonResponse(500, { error: "Error inesperado al corregir", code: "internal" });
  }
};

/**
 * Enunciado con el que se corrige. Si el reto es del catálogo, manda el
 * servidor: título, escenario, tipo y datos salen de catalogo-retos.json y lo
 * que diga el navegador se ignora. Antes, con el challengeId de un reto real y
 * un enunciado trivial, se obtenía una nota "verificada" de esa skill.
 */
function enunciadoOficial(ex) {
  if (!retoComun(ex.challengeId)) return { ex, catalogo: false };
  const oficial = ejercicioComun(ex.challengeId, ex.id);
  if (!oficial) return { error: jsonResponse(400, { error: "Ese ejercicio no pertenece a este reto", code: "unknown_exercise" }) };
  return {
    catalogo: true,
    ejercicio: oficial,
    ex: Object.assign({}, ex, {
      title: oficial.title,
      scenario: oficial.scenario,
      type: oficial.type,
      data: oficial.data || {},
      // La rúbrica la fija el catálogo (p. ej. «tecnico_ia»); el navegador no la elige.
      rubrica: oficial.rubrica || null,
      jobTitle: retoComun(ex.challengeId).title,
      sector: "Universal"
    })
  };
}

// ─── Modo crudo (banco de pruebas) ───────────────────────────────────────────
const sinClave = () => jsonResponse(500, { error: "Missing ANTHROPIC_API_KEY in environment variables" });

async function evaluateRaw(body, apiKey, configuredModel) {
  if (!apiKey) return sinClave();
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
  // Cada corrección cuesta una llamada a la IA. Con sesión, el límite va por
  // cuenta; sin ella, por IP y más estricto. Persistente (lib/limites.js).
  let user = null;
  try { user = await authUser(event, body); } catch (_e) { user = null; }
  const clave = user ? "eval:u:" + user.id : "eval:ip:" + clientIp(event);
  if (await limitar(clave, user ? { max: 60, ventanaS: 600 } : { max: 12, ventanaS: 600 })) {
    return jsonResponse(429, { error: "Demasiadas evaluaciones seguidas. Espera unos minutos." });
  }
  const oficial = enunciadoOficial(normalizeExercise(body.exercise));
  if (oficial.error) return oficial.error;
  const ex = oficial.ex;
  const response = String(body.response || "").trim();
  if (!ex.title || !ex.scenario) return jsonResponse(400, { error: "El ejercicio necesita título y escenario" });
  if (!response) return jsonResponse(400, { error: "La respuesta está vacía" });
  if (response.length > MAX_RESPONSE_CHARS) {
    return jsonResponse(413, { error: `La respuesta supera ${MAX_RESPONSE_CHARS} caracteres` });
  }

  const integrityRisk = body.integrity && typeof body.integrity.risk === "string"
    ? body.integrity.risk.slice(0, 10) : null;
  // Clasificaciones del catálogo: las corrige el servidor con la solución
  // oficial, sin IA (lo que mande el navegador como «correcta» se ignora).
  if (oficial.catalogo && ex.type === "decision") {
    const sinIA = detectInjection("");
    return jsonResponse(200, finishV2(corregirDecision(oficial.ejercicio, response), ex, response, sinIA, integrityRisk, null, true));
  }
  if (oficial.catalogo && ex.type === "cognitive") {
    const sinIA = detectInjection("");
    return jsonResponse(200, finishV2(corregirSecuencias(oficial.ejercicio, response), ex, response, sinIA, integrityRisk, null, true));
  }

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
    return jsonResponse(200, finishV2(result, ex, response, injection, integrityRisk, null, oficial.catalogo));
  }

  // Las clasificaciones no la necesitan: la clave solo se exige al llamar al modelo.
  if (!apiKey) return sinClave();

  const nonce = sha256(Math.random() + ":" + Date.now()).slice(0, 12);
  // La salida v2.1 lleva evidencia e indicadores por criterio: necesita más
  // tokens de salida que la de la v2.0 (1.000).
  const call = await callModel(SYSTEM_PROMPT, buildUserPrompt(ex, response, nonce, injection), apiKey, configuredModel, 1800);
  if (call.error) return call.error;
  // La nota la calcula el servidor con los pesos de la rúbrica; si el modelo
  // devuelve el formato antiguo ({score, criteria}) se mantiene su nota.
  const calculada = puntuar(ex, call.parsed, response);
  if (calculada) {
    for (const k of ["criterios", "banderas", "resumen", "siguiente_paso"]) delete call.parsed[k];
    Object.assign(call.parsed, calculada);
  }
  // Una señal leve no bloquea, pero tampoco deja que la nota pase de aprobado
  // raspado sin que una persona lo revise.
  if (injection.suspicious && call.parsed.score > 60) {
    call.parsed.score = 60;
    call.parsed.capped = "señal de manipulación: nota limitada a 60 hasta revisión humana";
  }
  return jsonResponse(200, finishV2(call.parsed, ex, response, injection, integrityRisk, call.selectedModel, oficial.catalogo));
}

function finishV2(result, ex, response, injection, integrityRisk, model, catalogo) {
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
    // 1 = corregido con el enunciado del catálogo del servidor. save-evaluation
    // solo da por verificada una nota de reto común si todos sus recibos lo traen.
    cat: catalogo ? 1 : 0,
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
async function callModel(systemPrompt, userPrompt, apiKey, configuredModel, maxTokens = 1000) {
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
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
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
  const parsed = extraerJson(text);
  if (!parsed || typeof parsed !== "object") {
    console.error("[TP] respuesta del modelo sin JSON:", text.slice(0, 500));
    return {
      error: jsonResponse(502, { error: "La corrección no ha devuelto un resultado válido. Vuelve a enviar la respuesta." })
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

/**
 * JSON del modelo aunque venga con ```json o con una frase delante. Antes
 * cualquier texto fuera del objeto tumbaba la corrección con un 502.
 */
function extraerJson(texto) {
  const limpio = String(texto || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(limpio); } catch (_e) { /* sigue */ }
  const i = limpio.indexOf("{"), j = limpio.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(limpio.slice(i, j + 1)); } catch (_e) { return null; }
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" },
    body: JSON.stringify(payload)
  };
}

function uniqueModels(models) {
  return [...new Set(models.filter(Boolean))];
}

module.exports.extraerJson = extraerJson;
module.exports.enunciadoOficial = enunciadoOficial;
