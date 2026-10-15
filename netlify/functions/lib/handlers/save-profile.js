/**
 * save-profile — crea o actualiza el perfil de un candidato autenticado.
 * Body: { fullName?, sector?, phone?, linkedin?, empleo?, poolVisible?, allowContact? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El candidato se deduce del token. Antes se aceptaba un `userId` en el body,
 * así que cualquiera podía sobrescribir el nombre, teléfono o LinkedIn de otro.
 */
const { jsonResponse, authUser, ensureProfileByUser, faltaEnEsquema, errorInterno, textoCorto } = require("../tp");

/** LinkedIn solo como enlace http(s): lo abre la empresa tras desbloquear. */
function enlaceSeguro(v) {
  let t = textoCorto(v, 200);
  if (!t) return undefined;
  // «linkedin.com/in/ana» sin esquema es lo habitual al escribirlo a mano.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t) && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(t)) t = "https://" + t;
  return /^https?:\/\/[^\s<>"']+$/i.test(t) ? t : undefined;
}
const { limpiarCond } = require("./get-talent-pool");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });

    const campos = {
      // El email es el de la cuenta, no uno que proponga el cliente.
      email: user.email,
      // Antes se guardaba cualquier cosa (objetos, textos de megas): ahora
      // solo texto y con tope, como el resto de campos.
      full_name: textoCorto(b.fullName, 120),
      sector: textoCorto(b.sector, 80),
      phone: textoCorto(b.phone, 40),
      linkedin: enlaceSeguro(b.linkedin),
      // Condiciones de empleo y visibilidad: las lee get-talent-pool.
      empleo: b.empleo && typeof b.empleo === "object" ? limpiarCond(b.empleo) : undefined,
      pool_visible: typeof b.poolVisible === "boolean" ? b.poolVisible : undefined,
      allow_contact: typeof b.allowContact === "boolean" ? b.allowContact : undefined
    };
    let profile;
    try {
      profile = await ensureProfileByUser(user.id, campos);
    } catch (err) {
      // Sin la migración supabase_schema_pool.sql esas columnas no existen:
      // se guarda el resto antes que perderlo todo.
      if (!faltaEnEsquema(err, /empleo|pool_visible|allow_contact/i)) throw err;
      const { empleo: _e, pool_visible: _v, allow_contact: _a, ...resto } = campos;
      profile = await ensureProfileByUser(user.id, resto);
    }

    return jsonResponse(200, { ok: true, profileId: profile.id, profile });
  } catch (err) {
    return errorInterno("No se pudo guardar el perfil", err);
  }
};

module.exports.enlaceSeguro = enlaceSeguro;
