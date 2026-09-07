/**
 * Los retos escritos a mano: sus tres fases y su corrección.
 *
 * Se ejecuta a mano:  node --test tests/checks/retos-manuales.check.js
 *
 * Vive fuera de tests/ a propósito. La suite del TFM (npm test) tiene su
 * recuento citado en la memoria y en las diapositivas de la defensa: sumar
 * casos aquí obligaría a reescribir esa cifra en una veintena de documentos
 * ya exportados. Este fichero comprueba el catálogo sin tocar esa cuenta.
 *
 * Un reto del catálogo no es un texto suelto: es un dato que atraviesa la
 * pantalla de briefing, el render del ejercicio, el prompt del evaluador y la
 * nota de reserva. Si una fase declara un campo de menos, el candidato se
 * encuentra una pantalla rota a mitad del cronómetro, y eso no se ve leyendo
 * el HTML de 800 KB. Esto lo comprueba en milisegundos.
 *
 * Los controles de forma se aplican a cada reto de la lista MANUALES y, los
 * tres últimos, a todo el catálogo: si mañana alguien añade un reto torcido,
 * falla aquí.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadValue, loadFunctions } = require("../helpers/extract-fn.js");

const CATALOGO = loadValue("COMMON_EXERCISES");
const PERFIL = loadValue("candidateProfile");
const { fallbackScore } = loadFunctions(["detectQuality", "fallbackScore"]);

/** Los retos escritos a mano, uno a uno. Los demás son plantilla y no se cubren. */
const MANUALES = ["common_fund_management", "common_cybersecurity", "common_recruiting", "common_ecommerce"];
const RETOS = MANUALES.map((id) => {
  const r = CATALOGO.find((c) => c.id === id);
  if (!r) throw new Error(`No existe el reto ${id} en COMMON_EXERCISES`);
  return r;
});

const RETO = RETOS[0];                       // el de fondos, para los tests de datos
const [FASE1, FASE2, FASE3] = RETO.exercises;

// ─── 1. Los retos existen y tienen la forma de la casa ──────────────────────
test("los cuatro retos escritos a mano están en el catálogo", () => {
  for (const r of RETOS) {
    assert.equal(r.category, "sector", `${r.id}: categoría inesperada`);
    assert.ok(r.skill, `${r.id}: sin skill`);
    assert.ok(r.icon && r.desc && r.tags.length, `${r.id}: falta icono, descripción o etiquetas`);
  }
});

test("cada uno tiene tres fases en orden básico → intermedio → avanzado", () => {
  for (const r of RETOS) {
    assert.equal(r.exercises.length, 3, `${r.id}: no tiene tres fases`);
    assert.deepEqual(r.exercises.map((e) => e.difficulty), ["basico", "intermedio", "avanzado"], `${r.id}: dificultades fuera de orden`);
    assert.deepEqual(r.exercises.map((e) => e.num), ["01", "02", "03"], `${r.id}: numeración incorrecta`);
  }
});

test("las tres fases usan tipos de corrección distintos", () => {
  // Tres veces el mismo formato mide tres veces lo mismo. El valor del reto
  // está en que cada fase entra por un canal distinto: texto libre corregido
  // por IA, email con mínimos exigibles, y clasificación determinista.
  for (const r of RETOS) {
    assert.deepEqual(r.exercises.map((e) => e.type), ["analysis", "email", "decision"], `${r.id}: tipos inesperados`);
  }
});

test("ninguno se ha quedado con el contenido de plantilla", () => {
  // El catálogo arrastra 74 retos autogenerados con "Concepto A / Valor 1".
  // Estos cuatro son los que se pueden enseñar a un cliente.
  for (const r of RETOS) {
    const bruto = JSON.stringify(r.exercises);
    assert.ok(!bruto.includes("Concepto A"), `${r.id}: sigue teniendo la tabla de plantilla`);
    assert.ok(!bruto.includes("Opción estratégica A"), `${r.id}: sigue teniendo las opciones de plantilla`);
  }
});

test("la skill de cada reto está declarada en el perfil del candidato", () => {
  // showFinal() solo desbloquea la skill si la clave ya existe en
  // candidateProfile.skills. Sin esa línea el candidato completa el reto y no
  // se le acredita nada: falla en silencio.
  for (const r of RETOS) {
    assert.ok(PERFIL.skills[r.skill], `${r.id}: falta '${r.skill}' en candidateProfile.skills`);
  }
});

// ─── 2. Lo que la interfaz necesita para pintar cada fase ────────────────────
test("cada fase declara lo que la pantalla de briefing va a leer", () => {
  for (const r of RETOS) for (const ex of r.exercises) {
    const d = `${r.id}/${ex.num}`;
    assert.ok(ex.briefing && ex.briefing.length > 40, `${d}: briefing ausente o telegráfico`);
    assert.ok(ex.scenario && ex.scenario.length > 80, `${d}: escenario ausente o vacío`);
    assert.ok(Number.isInteger(ex.timeLimit) && ex.timeLimit >= 120, `${d}: timeLimit inválido`);
    assert.ok(Array.isArray(ex.skills.hard) && ex.skills.hard.length, `${d}: sin skills hard`);
    assert.ok(Array.isArray(ex.skills.soft) && ex.skills.soft.length, `${d}: sin skills soft`);
  }
});

test("el briefing no adelanta el escenario", () => {
  // La promesa del producto es que el caso se revela al pulsar Empezar. Si el
  // briefing contuviera el enunciado, el candidato lo prepararía antes.
  for (const r of RETOS) for (const ex of r.exercises) {
    assert.notEqual(ex.briefing.trim(), ex.scenario.trim());
    assert.ok(ex.briefing.length < ex.scenario.length, `${r.id}/${ex.num}: el briefing es tan largo como el caso`);
  }
});

test("el enunciado de la fase 1 pide las tres partes que la corrección espera", () => {
  for (const r of RETOS) {
    for (const parte of ["A)", "B)", "C)"]) {
      assert.ok(r.exercises[0].scenario.includes(parte), `${r.id}: el escenario no pide la parte ${parte}`);
    }
  }
});

test("las tablas de datos encajan en las cinco columnas que pinta la interfaz", () => {
  // renderExActive() pinta exactamente n, a, b, c, d. Una sexta columna en
  // headers saldría con la cabecera desalineada respecto a los datos.
  for (const r of RETOS) {
    const d = r.exercises[0].data;
    assert.equal(d.headers.length, 5, `${r.id}: ${d.headers.length} cabeceras para 5 celdas`);
    assert.ok(d.table.length >= 5, `${r.id}: una tabla de ${d.table.length} filas da poco que analizar`);
    for (const fila of d.table) {
      for (const campo of ["n", "a", "b", "c", "d"]) {
        assert.ok(fila[campo], `${r.id}: la fila "${fila.n}" no tiene el campo ${campo}`);
      }
      assert.ok(["v-good", "v-warn", "v-bad"].includes(fila.cls), `${r.id}: clase de color desconocida: ${fila.cls}`);
    }
  }
});

test("ningún texto que acaba dentro de un atributo HTML lleva comillas dobles", () => {
  // El hint se inyecta como placeholder="${hint}" y el destinatario como
  // value="${to}". Una comilla doble ahí cierra el atributo y rompe el
  // formulario del ejercicio. No es teórico: es cómo está escrito el render.
  for (const r of RETOS) for (const ex of r.exercises) {
    for (const campo of ["hint", "to", "subject", "q"]) {
      const v = ex.data && ex.data[campo];
      if (v) assert.ok(!v.includes('"'), `${r.id}/${ex.num}.${campo} contiene una comilla doble`);
    }
  }
});

test("cada fase de análisis trae palabras clave suficientes para la nota de reserva", () => {
  for (const r of RETOS) {
    const kw = r.exercises[0].data.kw || [];
    assert.ok(kw.length >= 8, `${r.id}: solo ${kw.length} palabras clave; la nota sin IA sería muy tosca`);
    assert.equal(new Set(kw).size, kw.length, `${r.id}: hay palabras clave repetidas`);
  }
});

// ─── 3. Fase 1: los datos sostienen la respuesta que se espera ───────────────
test("los datos de los fondos contienen las trampas que el ejercicio evalúa", () => {
  const porNombre = Object.fromEntries(FASE1.data.table.map((f) => [f.n, f]));
  const num = (s) => parseFloat(String(s).replace(/[^0-9,.-]/g, "").replace(",", "."));

  const absoluto = porNombre["Delta Alfa Retorno Absoluto"];
  const monetario = porNombre["Horizonte Monetario Euro"];
  assert.ok(absoluto && monetario);
  // Trampa 1: el fondo caro de retorno absoluto rinde MENOS que el monetario
  // cobrando trece veces más. Descartarlo es la decisión que se puntúa.
  assert.ok(num(absoluto.a) < num(monetario.a), "el retorno absoluto ya no rinde menos que el monetario");
  assert.ok(num(absoluto.c) > num(monetario.c) * 5, "la comisión del retorno absoluto ya no es desproporcionada");

  // Trampa 2: el fondo más rentable supera con mucho la caída que la clienta
  // dijo que aguantaba (15 %). Meterlo es el error que separa a los candidatos.
  const estrella = porNombre["Vector Tecnología Momentum"];
  const caidaVector = Math.abs(num(estrella.b.split("/")[1]));
  assert.ok(caidaVector > 15, "el fondo estrella ya no incumple el límite de caída del enunciado");
  assert.ok(num(estrella.a) === Math.max(...FASE1.data.table.map((f) => num(f.a))), "el fondo estrella debe ser el más rentable: sin eso no hay tentación");
});

test("la nota de reserva de la fase 1 discrimina sin la IA", () => {
  // Si Anthropic no responde, el candidato sigue recibiendo una nota. Esa nota
  // tiene que distinguir a quien razona con los datos de quien escribe humo.
  const buena = "Pondría un 45 % en Atlas Bolsa Global por su comisión baja y 20 años de historia, un 30 % en Iberia Renta Fija Corto Plazo y un 25 % en Horizonte Monetario para la liquidez de los doce meses. Descarto Vector por su volatilidad y su caída del 47 %, incompatible con el perfil de la clienta, y Delta por su comisión. Meridiano no aporta nada a ese plazo.";
  const humo = "Yo intentaría hacer una cartera equilibrada y adaptada a lo que necesita, buscando siempre lo mejor para ella y revisándolo con frecuencia para que todo salga bien.";
  const nb = fallbackScore(FASE1, buena).score;
  const nh = fallbackScore(FASE1, humo).score;
  assert.ok(nb > nh, `la respuesta razonada (${nb}) no supera al humo (${nh})`);
  assert.ok(nb >= 50, `una respuesta correcta se queda en ${nb}: las keywords no cubren el caso`);
});

// ─── 4. Fase 2: el email exige respuesta real, no un saludo ─────────────────
test("cada email fija mínimos coherentes entre caracteres y palabras", () => {
  for (const r of RETOS) {
    const d = r.exercises[1].data;
    assert.ok(d.minChars >= 200, `${r.id}: sin mínimo real, un saludo de dos líneas pasaría por respuesta`);
    assert.ok(d.minWords >= 40, `${r.id}: mínimo de palabras demasiado bajo`);
    // Un texto en castellano ronda los 5-6 caracteres por palabra. Si los dos
    // mínimos no son compatibles, uno es inalcanzable y el candidato se queda
    // atascado con el cronómetro corriendo.
    const ratio = d.minChars / d.minWords;
    assert.ok(ratio >= 4 && ratio <= 8, `${r.id}: mínimos incompatibles (${d.minChars} caracteres para ${d.minWords} palabras)`);
  }
});

test("cada email da tiempo suficiente para el mínimo que exige", () => {
  // A 25 palabras por minuto escribiendo y pensando a la vez.
  for (const r of RETOS) {
    const ex = r.exercises[1];
    assert.ok(ex.timeLimit / 60 * 25 > ex.data.minWords,
      `${r.id}: el mínimo de palabras no cabe en los ${ex.timeLimit / 60} minutos del ejercicio`);
  }
});

test("cada email dice a quién se escribe y con qué asunto", () => {
  // Sin destinatario ni asunto el ejercicio se corrige a ciegas: la rúbrica de
  // COMUNICACIÓN ESCRITA los mete literalmente en el prompt del evaluador.
  for (const r of RETOS) {
    const d = r.exercises[1].data;
    assert.ok(d.to && d.to.length > 5, `${r.id}: falta el destinatario`);
    assert.ok(d.subject && d.subject.length > 5, `${r.id}: falta el asunto`);
    assert.ok(d.hint && d.hint.length > 200, `${r.id}: la guía del email es demasiado escueta`);
  }
});

test("el escenario del email arrastra los datos de la fase 1", () => {
  // Las tres fases son el mismo caso, no tres ejercicios sueltos: la clienta y
  // el fondo que la tienta se llaman igual que en la tabla anterior.
  assert.ok(FASE2.scenario.includes("Elena Prats"));
  assert.ok(FASE2.scenario.includes("Vector"));
  assert.ok(FASE2.data.hint.includes("47"), "el hint debe recordar el dato de caída que sostiene el argumento");
});

// ─── 5. Fase 3: la clasificación se corrige sola y se corrige bien ──────────
test("cada opción se puede clasificar en una categoría existente", () => {
  for (const r of RETOS) {
    const d = r.exercises[2].data;
    assert.equal(d.cats.length, d.keys.length, `${r.id}: hay más etiquetas visibles que claves de corrección`);
    assert.ok(d.options.length >= 6, `${r.id}: ${d.options.length} opciones dan poco margen para medir criterio`);
    for (const o of d.options) {
      assert.ok(d.keys.includes(o.correct), `${r.id}: la opción ${o.id} espera "${o.correct}", que no está en keys`);
    }
  }
});

test("todas las categorías están representadas y equilibradas", () => {
  // Si un cajón quedara vacío, el candidato lo deduciría por descarte y el
  // ejercicio mediría memoria de formato en vez de criterio.
  for (const r of RETOS) {
    const d = r.exercises[2].data;
    const reparto = {};
    d.options.forEach((o) => { reparto[o.correct] = (reparto[o.correct] || 0) + 1; });
    for (const k of d.keys) {
      assert.ok(reparto[k] >= 2, `${r.id}: la categoría "${k}" solo aparece ${reparto[k] || 0} vez/veces`);
    }
  }
});

test("la corrección determinista da 100 al que acierta y 0 al que falla todo", () => {
  for (const r of RETOS) {
    const d = r.exercises[2].data;
    const otra = (k) => d.keys.find((x) => x !== k);
    const todoBien = JSON.stringify(d.options.map((o) => ({ text: o.text, chosen: o.correct, correct: o.correct })));
    const todoMal = JSON.stringify(d.options.map((o) => ({ text: o.text, chosen: otra(o.correct), correct: o.correct })));
    assert.equal(fallbackScore(r.exercises[2], todoBien).score, 100, `${r.id}: acertarlo todo no da 100`);
    assert.equal(fallbackScore(r.exercises[2], todoMal).score, 0, `${r.id}: fallarlo todo no da 0`);
  }
});

test("acertar más puntúa más: la nota es proporcional, no un aprobado general", () => {
  for (const r of RETOS) {
    const ex = r.exercises[2], d = ex.data;
    const otra = (k) => d.keys.find((x) => x !== k);
    const conAciertos = (n) => JSON.stringify(d.options.map((o, i) => ({
      text: o.text, chosen: i < n ? o.correct : otra(o.correct), correct: o.correct
    })));
    const notas = [0, 3, 6, d.options.length].map((n) => fallbackScore(ex, conAciertos(n)).score);
    for (let i = 1; i < notas.length; i++) {
      assert.ok(notas[i] > notas[i - 1], `${r.id}: la nota no sube al acertar más (${notas.join(" → ")})`);
    }
  }
});

// ─── 6. Lo que se le exige al reto nuevo, se le exige a todo el catálogo ─────
test("ningún reto del catálogo mezcla claves de corrección inexistentes", () => {
  for (const reto of CATALOGO) {
    for (const ex of reto.exercises || []) {
      if (ex.type !== "decision" || !ex.data) continue;
      for (const o of ex.data.options) {
        assert.ok(ex.data.keys.includes(o.correct),
          `${reto.id}/${ex.id}: la opción ${o.id} espera "${o.correct}", fuera de keys`);
      }
    }
  }
});

test("ninguna tabla de análisis del catálogo se sale de las cinco columnas", () => {
  for (const reto of CATALOGO) {
    for (const ex of reto.exercises || []) {
      if (ex.type !== "analysis" || !ex.data || !ex.data.headers) continue;
      assert.equal(ex.data.headers.length, 5, `${reto.id}/${ex.id}: ${ex.data.headers.length} cabeceras para 5 celdas`);
    }
  }
});

test("cada reto del catálogo apunta a una skill que el perfil sabe desbloquear", () => {
  for (const reto of CATALOGO) {
    if (!reto.exercises || !reto.exercises.length) continue;
    assert.ok(PERFIL.skills[reto.skill], `${reto.id} acredita '${reto.skill}', que no existe en candidateProfile.skills`);
  }
});
