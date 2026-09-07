/**
 * Router unico de las funciones serverless (Vercel).
 *
 * Vercel publica un endpoint por archivo dentro de api/, y el plan Hobby admite
 * como maximo 12. El proyecto tiene 15 endpoints, asi que en lugar de un archivo
 * por funcion hay UNO solo: este. `[fn]` captura el ultimo segmento de la ruta,
 * de modo que /api/save-profile sigue siendo /api/save-profile — las URLs no
 * cambian respecto a Netlify, solo cambia quien las atiende.
 *
 * Los handlers viven en api/_handlers/ con la firma de Netlify
 * (`exports.handler = async (event) => ({ statusCode, headers, body })`) y su
 * codigo no se ha tocado al migrar: este archivo traduce en ambos sentidos.
 * Vercel ignora los directorios que empiezan por guion bajo, asi que _handlers/
 * y _lib/ viajan en el bundle sin publicarse como endpoints.
 *
 * ── Sobre el cuerpo de la peticion ──────────────────────────────────────────
 * `bodyParser: false` desactiva el parseo automatico de Vercel para leer los
 * bytes exactos. No es un capricho: stripe-webhook verifica la firma sobre el
 * cuerpo literal, y `JSON.stringify(objetoYaParseado)` produce bytes distintos
 * (orden de claves, espaciado, unicode). Con el parseo activado la firma
 * fallaria siempre y los pagos se quedarian sin confirmar. Ademas asi `event.body`
 * es una cadena cruda, que es exactamente lo que era en Netlify.
 */

// Mapa estatico: cada `require` es literal para que el analisis de dependencias
// de Vercel los incluya en el bundle, pero envuelto en una funcion para no
// cargar ethers ni stripe en peticiones que no los usan.
const HANDLERS = {
  "anchor-credential": () => require("./_handlers/anchor-credential.js"),
  "confirm-checkout": () => require("./_handlers/confirm-checkout.js"),
  "contact": () => require("./_handlers/contact.js"),
  "create-checkout-session": () => require("./_handlers/create-checkout-session.js"),
  "delete-account": () => require("./_handlers/delete-account.js"),
  "evaluate-exercise": () => require("./_handlers/evaluate-exercise.js"),
  "get-company": () => require("./_handlers/get-company.js"),
  "get-progress": () => require("./_handlers/get-progress.js"),
  "issue-credential": () => require("./_handlers/issue-credential.js"),
  "save-company": () => require("./_handlers/save-company.js"),
  "save-evaluation": () => require("./_handlers/save-evaluation.js"),
  "save-profile": () => require("./_handlers/save-profile.js"),
  "stripe-webhook": () => require("./_handlers/stripe-webhook.js"),
  "support-chat": () => require("./_handlers/support-chat.js"),
  "verify-credential": () => require("./_handlers/verify-credential.js")
};

/** Lee el cuerpo tal cual llega, sin interpretarlo. */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Devuelve el cuerpo como cadena. Si por lo que sea el parseo automatico
 * siguiera activo el stream llegaria vacio, asi que se reconstruye desde
 * `req.body` como ultimo recurso. Sirve para los endpoints normales; la firma
 * de Stripe si notaria la diferencia, y por eso ese caso se marca aparte.
 */
async function getBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return { body: "", exact: true };

  const raw = await readRawBody(req);
  if (raw.length) return { body: raw.toString("utf8"), exact: true };

  if (req.body == null) return { body: "", exact: true };
  if (typeof req.body === "string") return { body: req.body, exact: true };
  if (Buffer.isBuffer(req.body)) return { body: req.body.toString("utf8"), exact: true };
  return { body: JSON.stringify(req.body), exact: false };
}

function sendJson(res, statusCode, payload) {
  res.setHeader("content-type", "application/json");
  res.status(statusCode).send(JSON.stringify(payload));
}

module.exports = async function router(req, res) {
  // `[fn]` llega en req.query; si faltara, se deduce de la URL.
  let name = req.query && req.query.fn;
  if (Array.isArray(name)) name = name[0];
  if (!name) {
    const m = String(req.url || "").match(/\/api\/([\w-]+)/);
    name = m ? m[1] : "";
  }

  const load = Object.prototype.hasOwnProperty.call(HANDLERS, name) ? HANDLERS[name] : null;
  if (!load) return sendJson(res, 404, { error: "Función no encontrada: " + name });

  let handler;
  try {
    const mod = load();
    handler = mod && mod.handler;
    if (typeof handler !== "function") throw new Error("el módulo no expone `handler`");
  } catch (err) {
    return sendJson(res, 500, { error: "No se pudo cargar la función " + name, details: err.message });
  }

  let result;
  try {
    const { body, exact } = await getBody(req);

    // La firma de Stripe se calcula sobre los bytes exactos: si no los tenemos,
    // es mejor fallar diciendolo que rechazar el webhook sin explicar por que.
    if (!exact && name === "stripe-webhook") {
      return sendJson(res, 500, {
        error: "No se pudo leer el cuerpo original de la petición",
        details: "La firma de Stripe requiere el cuerpo sin parsear. Revisa que `config.api.bodyParser` siga desactivado en api/[fn].js."
      });
    }

    result = await handler(
      {
        httpMethod: req.method,
        body,
        headers: req.headers || {},
        queryStringParameters: flattenQuery(req.query),
        isBase64Encoded: false,
        path: req.url
      },
      {}
    );
  } catch (err) {
    return sendJson(res, 500, {
      error: "Error interno en la función",
      details: err && err.message ? err.message : String(err)
    });
  }

  if (!result || typeof result !== "object") {
    return sendJson(res, 500, { error: "La función no devolvió una respuesta válida" });
  }

  for (const [k, v] of Object.entries(result.headers || { "content-type": "application/json" })) {
    res.setHeader(k, v);
  }
  res.status(result.statusCode || 200).send(result.body != null ? result.body : "");
};

/** Netlify entrega los query params planos; Vercel puede repetir una clave. */
function flattenQuery(query) {
  const out = {};
  for (const [k, v] of Object.entries(query || {})) {
    if (k === "fn") continue; // segmento de la ruta, no un parametro real
    out[k] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

module.exports.config = { api: { bodyParser: false } };
