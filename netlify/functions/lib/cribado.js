/**
 * Preguntas de cribado de una oferta: de sí o no, en dos grupos.
 *
 *  · contrato: condiciones del puesto (tipo de contrato, jornada, modalidad,
 *    salario, incorporación).
 *  · requisito: requisitos de descarte (permiso de trabajo, carné, idioma…).
 *
 * Una pregunta eliminatoria tiene respuesta esperada. Si el candidato no la da,
 * se le avisa antes de enviar y la empresa lo ve marcado, pero nadie queda
 * descartado de forma automática: descartar sigue siendo una decisión de una
 * persona, con motivo (RGPD art. 22 y AI Act).
 */
const GRUPOS = ["contrato", "requisito"];
const RESPUESTAS = ["si", "no"];
const MAX_PREGUNTAS = 6;
// Lo que no se puede preguntar para cribar (igual que en el lector de documentos).
// El navegador lleva la misma expresión para avisar antes de publicar.
const PROHIBIDO = /\b(edad|cu[aá]ntos a[nñ]os tienes|naciste|sexo|g[eé]nero|nacionalidad|origen [eé]tnico|raza|embaraz|hijos|casad[oa]|estado civil|religi[oó]n|discapacidad|enfermedad|sindica|ideolog|pol[ií]tic)/i;

/** Normaliza lo que manda la empresa al publicar. */
function limpiarCribado(v) {
  if (!Array.isArray(v)) return [];
  const vistos = new Set();
  const out = [];
  for (const q of v) {
    if (!q || typeof q !== "object") continue;
    const texto = typeof q.texto === "string" ? q.texto.trim().replace(/\s+/g, " ").slice(0, 200) : "";
    if (texto.length < 5 || vistos.has(texto.toLowerCase()) || PROHIBIDO.test(texto)) continue;
    vistos.add(texto.toLowerCase());
    const esperada = RESPUESTAS.includes(q.esperada) ? q.esperada : "";
    out.push({
      id: "q" + (out.length + 1),
      grupo: GRUPOS.includes(q.grupo) ? q.grupo : "requisito",
      texto,
      esperada,
      eliminatoria: !!q.eliminatoria && !!esperada
    });
    if (out.length >= MAX_PREGUNTAS) break;
  }
  return out;
}

/**
 * Cruza las preguntas de la oferta con las respuestas del candidato (array de
 * "si"/"no" en el mismo orden). Devuelve { error } si falta alguna, o
 * { respuestas, cumple, noCumple }.
 */
function evaluarCribado(preguntas, respuestas) {
  const qs = limpiarCribado(preguntas);
  if (!qs.length) return { respuestas: [], cumple: true, noCumple: [] };
  const rs = Array.isArray(respuestas) ? respuestas : [];
  const filas = [];
  for (let i = 0; i < qs.length; i++) {
    const r = RESPUESTAS.includes(rs[i]) ? rs[i] : "";
    if (!r) return { error: "Responde las " + qs.length + " preguntas de la empresa antes de postularte" };
    const q = qs[i];
    filas.push(Object.assign({}, q, { respuesta: r, cumple: !q.esperada || q.esperada === r }));
  }
  const noCumple = filas.filter((f) => f.eliminatoria && !f.cumple).map((f) => f.texto);
  return { respuestas: filas, cumple: noCumple.length === 0, noCumple };
}

/** Lo que se guardó en la postulación, saneado para enseñarlo a la empresa. */
function leerRespuestas(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x === "object").slice(0, MAX_PREGUNTAS).map((x) => ({
    texto: String(x.texto || "").slice(0, 200),
    grupo: GRUPOS.includes(x.grupo) ? x.grupo : "requisito",
    esperada: RESPUESTAS.includes(x.esperada) ? x.esperada : "",
    eliminatoria: !!x.eliminatoria,
    respuesta: RESPUESTAS.includes(x.respuesta) ? x.respuesta : "",
    cumple: x.cumple !== false
  }));
}

module.exports = { GRUPOS, MAX_PREGUNTAS, PROHIBIDO, limpiarCribado, evaluarCribado, leerRespuestas };
