/**
 * Límite de frecuencia que sobrevive a los arranques en frío.
 *
 * El de memoria (evaluator.rateLimited) vive dentro de cada instancia de la
 * función: con varias instancias, o tras un arranque en frío, cada una empieza
 * de cero y no frena a quien reparte sus peticiones. Este cuenta además en
 * Supabase (tabla rate_events, tfm/tech/supabase_schema_seguridad.sql).
 *
 *  · La clave se guarda como hash: no hay IPs ni ids en claro en la tabla.
 *  · Si la tabla no existe todavía o la base de datos falla, se queda solo el
 *    límite de memoria: un fallo pasajero no deja a nadie sin servicio.
 *  · Las filas de más de un día se borran de vez en cuando desde aquí mismo.
 */
const crypto = require("node:crypto");
const { sb } = require("./tp");
const { rateLimited } = require("./evaluator");

const huella = (clave) => crypto.createHash("sha256").update("tp-limite:" + clave).digest("hex").slice(0, 40);

/** true si `clave` ha superado `max` peticiones en los últimos `ventanaS` segundos. */
async function limitar(clave, { max, ventanaS }) {
  if (rateLimited(clave, { max, windowMs: ventanaS * 1000 })) return true;
  const k = huella(clave);
  try {
    const desde = new Date(Date.now() - ventanaS * 1000).toISOString();
    const n = await sb.count("rate_events", `key=eq.${k}&created_at=gte.${desde}`);
    if (n >= max) return true;
    await sb.insert("rate_events", { key: k });
    if (Math.random() < 0.01) {
      const ayer = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      sb.remove("rate_events", `created_at=lt.${ayer}`).catch(() => {});
    }
  } catch (err) {
    if (!/rate_events|Faltan SUPABASE/.test(String(err && err.message))) console.warn("[TP] límite de frecuencia:", err.message);
  }
  return false;
}

module.exports = { limitar, huella };
