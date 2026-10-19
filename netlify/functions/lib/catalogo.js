/**
 * Catálogo de retos comunes del lado del servidor.
 *
 * catalogo-retos.json es la ÚNICA fuente del contenido de los retos (enunciado,
 * datos, soluciones, tiempo). Desde el 19/10/2026 el navegador solo tiene los
 * metadatos (07-retos-comunes.js) y recibe el contenido, sin soluciones, al
 * empezar un intento (handlers/retos-intento.js). Ver tools/separar_contenido_retos.js.
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

/** Nombres de skill con reto en el catálogo, sin repetir (las únicas que se pueden exigir). */
function skillsDelCatalogo() {
  return [...new Set(retos.map((r) => r.skill).filter(Boolean))];
}

module.exports = { retoComun, ejercicioComun, skillsDelCatalogo, total: retos.length };
