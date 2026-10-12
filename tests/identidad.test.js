/**
 * Identidad en las funciones de datos.
 *
 * Perfil, empresa, progreso y evaluaciones aceptaban un `userId` en el body:
 * con el id de otro se leía su email y teléfono o se le inyectaban notas que
 * luego se sellaban en la blockchain. Ahora la cuenta sale solo del token.
 * Estos tests no necesitan red: sin token el rechazo ocurre antes de Supabase.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FUNCIONES = ["save-profile", "save-company", "get-company", "get-progress", "save-evaluation"];
const OTRO = "2f1c9a44-0e51-4a71-9a3f-6b2d0c8e7a15";

test("las funciones de datos rechazan una petición sin sesión aunque traiga un userId", async () => {
  for (const nombre of FUNCIONES) {
    const { handler } = require(`../netlify/functions/lib/handlers/${nombre}.js`);
    const r = await handler({
      httpMethod: "POST",
      headers: {},
      body: JSON.stringify({ userId: OTRO, challengeId: "C-01", skill: "Comunicación", score: 100 })
    });
    assert.equal(r.statusCode, 401, `${nombre} ha aceptado una petición sin token`);
  }
});

test("las funciones de datos no leen la identidad del body", () => {
  for (const nombre of FUNCIONES) {
    const src = fs.readFileSync(path.join(__dirname, "../netlify/functions/lib/handlers", nombre + ".js"), "utf8");
    assert.doesNotMatch(src, /\bb\.userId\b|body\.userId\b/, `${nombre} aún lee userId del body`);
    assert.match(src, /authUser\(/, `${nombre} no valida el token`);
  }
});

test("el cliente no manda userId a las funciones de datos", () => {
  const html = require("./helpers/extract-fn").clientSource();
  for (const nombre of FUNCIONES) {
    assert.doesNotMatch(html, new RegExp(`_post\\('${nombre}'`), `${nombre} se llama sin token`);
  }
});
