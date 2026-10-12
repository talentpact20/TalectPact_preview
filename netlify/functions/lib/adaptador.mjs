/**
 * Adaptador al API moderno de Netlify Functions.
 *
 * Netlify ha declarado obsoleto el modo Lambda (`exports.handler(event)`): a
 * partir del 1 de julio de 2027 no acepta despliegues que lo usen. El API
 * moderno recibe un `Request` y devuelve un `Response` estándar, y tiene un
 * límite síncrono de 60 s (frente a los 10 s del modo Lambda), que es lo que
 * necesita una corrección con IA de ~17 s.
 *
 * La lógica de cada función no cambia: sigue en lib/handlers/*.js con la forma
 * `handler(event)`, que es la que prueban los tests. Este adaptador traduce en
 * la frontera, en un único sitio.
 */

/** Request (+ context de Netlify) → evento con la forma del modo Lambda. */
export async function aEvento(req, context = {}) {
  const url = new URL(req.url);
  const headers = {};
  req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  if (!headers.host) headers.host = url.host;
  // La IP real del cliente la da Netlify en el context; los límites de
  // frecuencia la leen de esta cabecera.
  if (context.ip && !headers["x-nf-client-connection-ip"]) headers["x-nf-client-connection-ip"] = context.ip;
  const queryStringParameters = {};
  url.searchParams.forEach((v, k) => { queryStringParameters[k] = v; });
  const sinCuerpo = req.method === "GET" || req.method === "HEAD";
  return {
    httpMethod: req.method,
    path: url.pathname,
    rawUrl: req.url,
    headers,
    queryStringParameters,
    // El cuerpo se pasa como texto exacto: el webhook de Stripe firma esos bytes.
    body: sinCuerpo ? "" : await req.text(),
    isBase64Encoded: false
  };
}

/** Resultado { statusCode, headers, body } → Response. */
export function aRespuesta(r) {
  const res = r || {};
  return new Response(res.body == null ? "" : String(res.body), {
    status: res.statusCode || 200,
    headers: res.headers || { "content-type": "application/json" }
  });
}

/** Envuelve un handler de estilo Lambda como función del API moderno. */
export function adaptar(handler) {
  return async (req, context) => aRespuesta(await handler(await aEvento(req, context), context));
}
