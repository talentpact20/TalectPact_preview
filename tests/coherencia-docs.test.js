/**
 * Coherencia entre la memoria y los datos.
 *
 * Un tribunal no necesita entender el código para encontrar un número que no
 * cuadra: le basta con leer dos apartados seguidos. Este fichero convierte esa
 * revisión manual en algo que corre en 40 ms.
 *
 * La fuente de verdad es `tfm/cifras_canonicas.json`. Si una cifra de la
 * memoria discrepa, manda ese fichero y este test lo dice.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const leer = (p) => fs.readFileSync(path.join(RAIZ, p), "utf8");
const json = (p) => JSON.parse(leer(p));

const C = json("tfm/cifras_canonicas.json");
const poc = json("poc_entrega2/evaluation_results.json");

/** Documentos que se defienden. Los de `informe_final/` son de una entrega anterior. */
const MEMORIA = [
  "tfm/business_plan/00_resumen_ejecutivo.md",
  "tfm/business_plan/01_concepto.md",
  "tfm/business_plan/02_mercado.md",
  "tfm/business_plan/03_modelo_negocio.md",
  "tfm/business_plan/04_plan_financiero.md",
  "tfm/business_plan/06_tecnologia_producto.md",
  "tfm/business_plan/08_riesgos.md",
  "tfm/business_plan/09_conclusiones.md",
  "entrega_final/INFORME_TECNICO_FINAL.md",
  "entrega_final/QA_DEFENSA.md"
];

const redondear = (x, d) => Number(x.toFixed(d));

// ─── 1. Las cifras canónicas cuadran entre sí ────────────────────────────────
test("la conversión USD→EUR del coste de IA es aritméticamente correcta", () => {
  const { medidoUsdPorEvaluacion: usd, medidoEurPorEvaluacion: eur } = C.costeIA;
  assert.equal(redondear(usd / C.tipoCambio.eurUsd, 4), eur);
});

test("el coste por reto y el coste mensual se derivan del coste por evaluación", () => {
  assert.equal(redondear(3 * C.costeIA.medidoEurPorEvaluacion, 2), C.costeIA.eurPorReto3Ejercicios);
  assert.equal(Math.round(10000 * C.costeIA.medidoEurPorEvaluacion), C.costeIA.eurMes10kEvaluaciones);
});

test("el supuesto del modelo financiero es conservador respecto a lo medido", () => {
  // Si algún día lo medido supera al supuesto, el Excel deja de ir por detrás
  // de la realidad y el margen del plan está sobrestimado.
  assert.ok(
    C.costeIA.supuestoModeloFinancieroEur > C.costeIA.medidoEurPorEvaluacion,
    "el supuesto del plan financiero ya no cubre el coste medido: hay que revisar el Excel"
  );
  assert.ok(C.costeIA.medidoEurPorEvaluacion < C.costeIA.objetivoCharterEur);
});

// ─── 2. Las cifras canónicas cuadran con el artefacto de la PoC ──────────────
test("las cifras de la PoC salen del fichero de resultados, no de la memoria", () => {
  const filas = poc.map((r) => ({
    id: r.submission_id,
    score: r.evaluation.skill_score,
    lat: r.metadata.latency_ms,
    usd: (r.metadata.input_tokens * 3 + r.metadata.output_tokens * 15) / 1e6
  }));

  assert.equal(filas.length, C.poc.n);
  for (const f of filas) assert.equal(f.score, C.poc.scores[f.id], `${f.id}: score distinto al canónico`);

  const legitimos = filas.filter((f) => f.score > 0).map((f) => f.score);
  assert.equal(Math.max(...legitimos) - Math.min(...legitimos), C.poc.discriminacionPts);

  const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.equal(redondear(media(legitimos), 1), C.poc.mediaLegitimos);
  assert.equal(redondear(media(filas.map((f) => f.lat)) / 1000, 1), C.poc.latenciaMediaSeg);
  assert.equal(redondear(Math.max(...filas.map((f) => f.lat)) / 1000, 1), C.poc.latenciaMaxSeg);
  assert.equal(redondear(media(filas.map((f) => f.usd)), 4), C.poc.costeMedioUsd);
  assert.equal(redondear(filas.reduce((a, f) => a + f.usd, 0), 4), C.poc.costeTotalUsd);
});

// ─── 3. La memoria no contradice a las cifras canónicas ──────────────────────
test("ningún documento cita la discriminación antigua de 86 puntos", () => {
  // 96 − 9 = 87. El 86 venía de una ejecución anterior que ya no está en el repo.
  for (const doc of MEMORIA) {
    assert.ok(!/86\s*puntos/i.test(leer(doc)), `${doc} cita 86 puntos de discriminación; son ${C.poc.discriminacionPts}`);
  }
});

test("ningún documento arrastra el coste mensual mal calculado", () => {
  for (const doc of MEMORIA) {
    const t = leer(doc);
    assert.ok(!/€600\s*\/?\s*mes/i.test(t), `${doc} cita ~€600/mes a 10.000 evaluaciones; son ~€${C.costeIA.eurMes10kEvaluaciones}`);
    assert.ok(!/€140\s*\/?\s*mes/i.test(t), `${doc} cita ~€140/mes: no se deriva de ningún coste canónico`);
  }
});

test("el margen bruto se cita de forma consistente", () => {
  const { grossMarginPct: g } = C.negocio;
  const min = Math.min(...Object.values(g)), max = Math.max(...Object.values(g));
  assert.ok(C.negocio.grossMarginResumenPct >= min && C.negocio.grossMarginResumenPct <= max);
  for (const doc of MEMORIA) {
    // "~94 %" quedaba fuera del rango real del modelo (93,3-93,8 %).
    assert.ok(!/margen bruto\s+\*{0,2}~?94/i.test(leer(doc)), `${doc} redondea el margen bruto a 94 %`);
  }
});

test("el coste por evaluación citado en la memoria es el medido", () => {
  const eur = C.costeIA.medidoEurPorEvaluacion.toString().replace(".", ",");   // 0,0165
  const usd = C.costeIA.medidoUsdPorEvaluacion.toFixed(4).replace(".", ",");   // 0,0180
  const docs = ["tfm/business_plan/06_tecnologia_producto.md", "entrega_final/INFORME_TECNICO_FINAL.md"];
  for (const doc of docs) {
    const t = leer(doc);
    assert.ok(t.includes(eur) || t.includes(usd), `${doc} no cita el coste medido (${usd} USD / ${eur} €)`);
  }
});

test("la tabla de la PoC del business plan coincide con el fichero de resultados", () => {
  const t = leer("tfm/business_plan/06_tecnologia_producto.md");
  for (const r of poc) {
    // Separador de miles como lo escribe la memoria: 1.882 / 776.
    const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const inTok = miles(r.metadata.input_tokens);
    const outTok = miles(r.metadata.output_tokens);
    assert.ok(t.includes(`${inTok} / ${outTok}`), `falta la fila de tokens ${inTok} / ${outTok} (${r.submission_id})`);
  }
});

// ─── 4. Lo que la memoria promete que existe, existe ─────────────────────────
test("los comandos que anuncia la memoria están en package.json", () => {
  const pkg = json("package.json");
  for (const s of ["test", "bench", "bench:offline", "doctor", "deploy:contract"]) {
    assert.ok(pkg.scripts[s], `falta el script "${s}" que la memoria dice que existe`);
  }
});

test("el número de tests que cita la memoria es el real", () => {
  // Al añadir un test hay que actualizar `tests.casos` en cifras_canonicas.json.
  // Es deliberado: obliga a que la cifra de la memoria siga siendo verdad.
  const ficheros = fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js"));
  const total = ficheros.reduce(
    (n, f) => n + (fs.readFileSync(path.join(__dirname, f), "utf8").match(/^test\(/gm) || []).length, 0
  );
  assert.equal(ficheros.length, C.tests.ficheros, `hay ${ficheros.length} ficheros de test, la memoria dice ${C.tests.ficheros}`);
  assert.equal(total, C.tests.casos, `hay ${total} casos de test, la memoria dice ${C.tests.casos}`);
  for (const doc of ["entrega_final/INFORME_TECNICO_FINAL.md", "entrega_final/QA_DEFENSA.md", "tfm/business_plan/06_tecnologia_producto.md"]) {
    assert.ok(leer(doc).includes(`${C.tests.casos} `), `${doc} no cita los ${C.tests.casos} casos de test`);
  }
});

test("la dirección del contrato es la misma en la memoria y en el despliegue", () => {
  const desp = json("tfm/tech/build/deployment-sepolia.json");
  const dir = desp.address || desp.contractAddress || desp.contract;
  assert.equal(String(dir).toLowerCase(), C.blockchain.contrato.toLowerCase());
  assert.ok(leer("tfm/README.md").includes(C.blockchain.contrato));
});
