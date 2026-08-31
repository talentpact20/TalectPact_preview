/**
 * Controles del flujo de pago.
 *
 * El desbloqueo de contacto es la única operación que mueve dinero, así que sus
 * dos garantías —el importe lo pone el servidor y la vuelta de Stripe cae en
 * nuestro dominio— merecen estar cubiertas.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { returnUrlSegura, origenesPermitidos } = require("../netlify/functions/create-checkout-session.js");
const { UNLOCK_PRICE } = require("../netlify/functions/lib/tp");

const evento = (headers) => ({ headers });

test("acepta volver al mismo origen desde el que se pide el pago", () => {
  const e = evento({ origin: "https://talentpact.es" });
  assert.equal(returnUrlSegura(e, "https://talentpact.es/?vista=empresa"), "https://talentpact.es/?vista=empresa");
});

test("rechaza volver a un dominio ajeno", () => {
  // Sin esto, pedir la sesión con returnUrl de otro sitio mandaba a la persona
  // recién pagada a una página que no es nuestra.
  const e = evento({ origin: "https://talentpact.es" });
  for (const malo of [
    "https://evil.example/cobro",
    "https://talentpact.es.evil.example/",
    "http://evil.example",
    "//evil.example",
    "javascript:alert(1)",
    "data:text/html,<h1>hola",
    ""
  ]) {
    const r = returnUrlSegura(e, malo);
    assert.notEqual(r && new URL(r).origin, "https://evil.example", `se ha colado: ${malo}`);
    assert.ok(r === null || new URL(r).origin === "https://talentpact.es", `origen no permitido para ${malo}: ${r}`);
  }
});

test("cae al origen de la petición cuando el cliente propone algo inválido", () => {
  const e = evento({ origin: "https://talentpact.es" });
  assert.equal(new URL(returnUrlSegura(e, "https://evil.example")).origin, "https://talentpact.es");
});

test("sin ningún origen fiable devuelve null en vez de improvisar", () => {
  assert.equal(returnUrlSegura(evento({}), "https://evil.example"), null);
  assert.equal(returnUrlSegura(evento({}), ""), null);
});

test("acepta el dominio declarado en el entorno aunque la petición venga sin origin", () => {
  const previo = process.env.SITE_URL;
  process.env.SITE_URL = "https://talentpact.es";
  try {
    assert.equal(new URL(returnUrlSegura(evento({}), "https://talentpact.es/panel")).origin, "https://talentpact.es");
  } finally {
    if (previo === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previo;
  }
});

test("en local admite http, en un dominio real no", () => {
  assert.ok(origenesPermitidos(evento({ host: "localhost:8888" })).has("http://localhost:8888"));
  const prod = origenesPermitidos(evento({ host: "talentpact.es" }));
  assert.ok(prod.has("https://talentpact.es"));
  assert.ok(!prod.has("http://talentpact.es"));
});

test("el importe del desbloqueo no llega del cliente", () => {
  // El precio vive en el servidor: manipular el navegador no cambia lo que se cobra.
  assert.equal(UNLOCK_PRICE.amountCents, 4900);
  assert.equal(UNLOCK_PRICE.currency, "eur");
});
