/**
 * Intento oficial de un reto: uno por persona y reto, con reloj del servidor.
 * (docs/plan_post_reunion/08_seguridad_antitrampas.md, §2)
 *
 *  · El contenido (enunciado y datos) solo sale del servidor al empezar el
 *    intento, y SIN soluciones ni pistas de corrección.
 *  · Abrir el reto consume el intento. Cerrar y volver dentro del plazo retoma
 *    el mismo intento con el tiempo que quede; pasado el plazo, ya está usado.
 *  · Para repetir hay que pedirlo explicando el motivo; lo revisa una persona.
 *
 * Lógica pura (sin red): el handler retos-intento la usa con Supabase.
 */
const { retoComun } = require("./catalogo");

const ESTADOS = ["abierto", "entregado", "caducado", "anulado"];
const MARGEN_POR_EJERCICIO_S = 120;   // leer el briefing y la cuenta atrás
const MARGEN_FINAL_S = 300;           // corrección y guardado del último ejercicio
const GRACIA_GUARDADO_S = 15 * 60;    // la nota se puede guardar un rato después del plazo
const MIN_MOTIVO = 30;

/** Segundos que dura un intento del reto. */
function duracionIntento(reto) {
  const ej = (reto && reto.exercises) || [];
  return ej.reduce((s, e) => s + (Number(e.timeLimit) || 300) + MARGEN_POR_EJERCICIO_S, 0) + MARGEN_FINAL_S;
}

/** Datos del ejercicio sin soluciones ni pistas para el corrector. */
function sanear(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  delete d.kw;   // conceptos que busca el corrector
  if (Array.isArray(d.options)) d.options = d.options.map(({ correct: _c, ...o }) => o);
  if (Array.isArray(d.puzzles)) d.puzzles = d.puzzles.map(({ correct: _c, hint: _h, ...p }) => p);
  return d;
}

/** Contenido que recibe el navegador al empezar: enunciado y datos, sin soluciones. */
function contenidoDelIntento(challengeId) {
  const reto = retoComun(challengeId);
  if (!reto) return null;
  return reto.exercises.map((e) => ({ id: e.id, type: e.type, scenario: e.scenario, data: sanear(e.data) }));
}

/** Estado real de un intento guardado (un «abierto» con el plazo vencido está caducado). */
function estadoIntento(intento, ahora = Date.now()) {
  if (!intento || !ESTADOS.includes(intento.estado)) return null;
  if (intento.estado === "abierto" && Date.parse(intento.expira_en) < ahora) return "caducado";
  return intento.estado;
}

/** ¿Se puede guardar la nota de este intento ahora? Devuelve { ok } o { motivo }. */
function puedeGuardar(intento, { userId, challengeId }, ahora = Date.now()) {
  if (!intento) return { motivo: "Este reto necesita un intento oficial. Empiézalo desde la plataforma." };
  if (intento.user_id !== userId || String(intento.challenge_id) !== String(challengeId)) return { motivo: "El intento no corresponde a este reto." };
  if (intento.estado === "entregado") return { motivo: "Este intento ya se entregó." };
  if (intento.estado === "anulado") return { motivo: "Este intento se anuló." };
  if (Date.parse(intento.expira_en) + GRACIA_GUARDADO_S * 1000 < ahora) return { motivo: "El plazo del intento terminó." };
  return { ok: true };
}

/** Valida una solicitud de reapertura o de alternativa a la cámara. */
function validarSolicitud(b) {
  const tipo = b && b.tipo;
  if (!["reapertura", "sin_camara"].includes(tipo)) return { error: "Tipo de solicitud no válido" };
  const motivo = typeof b.motivo === "string" ? b.motivo.trim().slice(0, 1500) : "";
  if (motivo.length < MIN_MOTIVO) return { error: `Explica el motivo con al menos ${MIN_MOTIVO} caracteres: lo lee una persona.` };
  if (tipo === "reapertura" && !retoComun(b.challengeId)) return { error: "Reto no válido" };
  return { solicitud: { tipo, motivo, challenge_id: tipo === "reapertura" ? String(b.challengeId) : null } };
}

module.exports = {
  ESTADOS, GRACIA_GUARDADO_S, MIN_MOTIVO,
  duracionIntento, sanear, contenidoDelIntento, estadoIntento, puedeGuardar, validarSolicitud
};
