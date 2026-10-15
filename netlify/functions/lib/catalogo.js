/**
 * Catálogo de retos comunes del lado del servidor.
 *
 * Copia generada de assets/js/app/07-retos-comunes.js (tools/generar_catalogo_servidor.js).
 * Sirve para dos cosas:
 *  · evaluate-exercise corrige con el enunciado de aquí, no con el que mande el navegador;
 *  · save-evaluation sabe qué skill mide cada reto y no acepta otra.
 *
 * Los retos de oferta (EX_DB y la plantilla genérica del cliente) aún no están
 * aquí: sus notas se guardan, pero sin marca de verificadas.
 */
const retos = require("./catalogo-retos.json");

const porId = new Map(retos.map((r) => [r.id, r]));

/** Reto común por id, o null si no es del catálogo. */
function retoComun(id) {
  return porId.get(String(id || "")) || null;
}

/** Ejercicio de un reto común, o null. */
function ejercicioComun(challengeId, exerciseId) {
  const r = retoComun(challengeId);
  if (!r) return null;
  return r.exercises.find((e) => e.id === String(exerciseId || "")) || null;
}

module.exports = { retoComun, ejercicioComun, total: retos.length };
