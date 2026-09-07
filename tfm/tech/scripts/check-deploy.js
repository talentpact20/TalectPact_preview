/**
 * check-deploy — comprueba que un despliegue responde correctamente.
 *
 * Pensado para usarse justo despues de desplegar en Vercel: golpea la web y
 * cada funcion serverless y dice cual esta bien y cual no. No escribe nada en
 * la base de datos: solo usa peticiones de validacion (cuerpos incompletos que
 * deben devolver 400) y el verificador publico, que es de solo lectura.
 *
 * Uso:
 *   node tfm/tech/scripts/check-deploy.js https://tu-proyecto.vercel.app
 *   npm run check:deploy -- https://tu-proyecto.vercel.app
 *
 * Sin argumento prueba contra http://localhost:8888 (el servidor de demo).
 */

const BASE = (process.argv[2] || "http://localhost:8888").replace(/\/$/, "");

const results = [];
function record(level, name, msg) { results.push({ level, name, msg }); }

async function call(path, { method = "POST", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (_e) { /* respuesta no-JSON */ }
  return { status: res.status, data };
}

/**
 * Comprueba una funcion mandandole un cuerpo invalido: si contesta el 400 que
 * esperamos, la funcion existe, se ha desplegado y su codigo se ejecuta. Un 404
 * significaria que Vercel no la ha detectado.
 */
async function expectValidation(name, path, body, expectedStatus = 400) {
  try {
    const { status, data } = await call(path, { body });
    if (status === 404) return record("fail", name, "404 — la funcion no existe en el despliegue");
    if (status === expectedStatus) return record("ok", name, "responde (" + status + ") — " + (data && data.error ? data.error : "sin mensaje"));
    if (status === 500 && data && /variables de entorno|Faltan/i.test(JSON.stringify(data))) {
      return record("warn", name, "desplegada, pero le faltan variables de entorno: " + (data.details || data.error));
    }
    record("warn", name, "responde " + status + " (se esperaba " + expectedStatus + "): " + JSON.stringify(data).slice(0, 160));
  } catch (err) {
    record("fail", name, "no se pudo contactar — " + err.message);
  }
}

async function checkStatic() {
  for (const [name, path] of [["web principal", "/"], ["verificador publico", "/verify.html"]]) {
    try {
      const res = await fetch(BASE + path);
      const html = await res.text();
      if (!res.ok) { record("fail", name, "HTTP " + res.status); continue; }
      if (!/<html/i.test(html)) { record("fail", name, "no devuelve HTML"); continue; }
      record("ok", name, "HTTP 200 (" + Math.round(html.length / 1024) + " KB)");
    } catch (err) {
      record("fail", name, "no se pudo contactar — " + err.message);
    }
  }
}

async function checkLegacyRewrite() {
  // vercel.json redirige las rutas viejas de Netlify: si esto falla, cualquier
  // HTML cacheado con las URLs antiguas dejaria de funcionar.
  try {
    const { status } = await call("/.netlify/functions/get-company", { body: {} });
    if (status === 400) return record("ok", "compatibilidad /.netlify/*", "el rewrite hacia /api/* funciona");
    if (status === 404) return record("warn", "compatibilidad /.netlify/*", "el rewrite no esta activo (solo afecta a HTML cacheado)");
    record("warn", "compatibilidad /.netlify/*", "responde " + status);
  } catch (err) {
    record("fail", "compatibilidad /.netlify/*", err.message);
  }
}

/**
 * Un endpoint puede estar perfectamente desplegado y aun asi responder 503
 * porque le falta una pieza opcional (blockchain, Stripe). Eso es un aviso,
 * no un fallo: lo que se comprueba aqui es que la funcion existe y ejecuta.
 */
async function checkOptional(name, path, body, method) {
  try {
    const { status, data } = await call(path, { body, method });
    if (status === 404) return record("fail", name, "404 — no existe en el despliegue");
    if (status === 503) return record("warn", name, "pendiente de configurar: " + ((data && data.details) || ""));
    if (status === 401) return record("ok", name, "exige autenticacion (correcto)");
    if (status === 400 || status === 200) return record("ok", name, "responde (" + status + ")");
    record("warn", name, "responde " + status + ": " + JSON.stringify(data).slice(0, 140));
  } catch (err) {
    record("fail", name, "no se pudo contactar — " + err.message);
  }
}

/**
 * El webhook sin cabecera de firma debe responder 400 (o 503 si Stripe no esta
 * configurado). Un 200 aqui significaria que acepta eventos sin verificar, que
 * es justo el agujero que la firma existe para tapar.
 */
async function checkStripeWebhook() {
  try {
    const { status, data } = await call("/api/stripe-webhook", { body: { fake: true } });
    if (status === 400) return record("ok", "stripe-webhook", "rechaza peticiones sin firma (correcto)");
    if (status === 503) return record("warn", "stripe-webhook", "Stripe aun no configurado: " + (data && data.details));
    if (status === 404) return record("fail", "stripe-webhook", "404 — no existe en el despliegue");
    if (status === 200) return record("fail", "stripe-webhook", "ACEPTA eventos sin firma — revisar urgentemente");
    record("warn", "stripe-webhook", "responde " + status + ": " + JSON.stringify(data).slice(0, 140));
  } catch (err) {
    record("fail", "stripe-webhook", "no se pudo contactar — " + err.message);
  }
}

async function main() {
  console.log("");
  console.log("  Comprobando despliegue:  " + BASE);
  console.log("");

  await checkStatic();

  // IA
  await expectValidation("evaluate-exercise (IA)", "/api/evaluate-exercise", {});
  await expectValidation("support-chat (IA)", "/api/support-chat", {});

  // Datos
  await expectValidation("save-profile", "/api/save-profile", {});
  await expectValidation("get-progress", "/api/get-progress", {});
  await expectValidation("save-company", "/api/save-company", {});
  await expectValidation("get-company", "/api/get-company", {});
  await expectValidation("save-evaluation", "/api/save-evaluation", {});
  await expectValidation("delete-account", "/api/delete-account", {});
  // OJO: con el cuerpo vacio esta funcion usa el perfil demo y emitiria una
  // credencial de verdad. Se manda un userId con formato invalido: la peticion
  // muere en la validacion de Supabase, sin escribir nada.
  // Emitir exige sesion: un 401 confirma que la funcion vive y valida.
  await checkOptional("issue-credential", "/api/issue-credential", {});

  // Formulario de contacto (sustituto de Netlify Forms)
  await expectValidation("contact", "/api/contact", { nombre: "", email: "" });

  // Pagos (Stripe)
  await checkOptional("create-checkout-session", "/api/create-checkout-session", {});
  await checkOptional("confirm-checkout", "/api/confirm-checkout", {});
  await checkStripeWebhook();

  // Blockchain (pendiente hasta desplegar el contrato)
  await checkOptional("verify-credential", "/api/verify-credential?h=0x" + "0".repeat(64), undefined, "GET");
  await checkOptional("anchor-credential", "/api/anchor-credential", {});

  await checkLegacyRewrite();

  console.log("");
  const icon = { ok: "[ok]  ", warn: "[warn]", fail: "[FAIL]" };
  for (const r of results) {
    console.log("  " + icon[r.level] + " " + r.name.padEnd(26) + " " + r.msg);
  }

  const fails = results.filter((r) => r.level === "fail").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log("");
  if (fails) {
    console.log("  " + fails + " comprobacion(es) fallidas. Revisa los logs de la funcion en Vercel.");
  } else if (warns) {
    console.log("  Todo lo esencial responde. " + warns + " aviso(s): normalmente el blockchain, que se activa despues.");
  } else {
    console.log("  Despliegue correcto: web y funciones responden.");
  }
  console.log("");
  process.exit(fails ? 1 : 0);
}

main();
