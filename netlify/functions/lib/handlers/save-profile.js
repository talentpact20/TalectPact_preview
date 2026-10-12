/**
 * save-profile — crea o actualiza el perfil de un candidato autenticado.
 * Body: { fullName?, sector?, phone?, linkedin?, empleo?, poolVisible?, allowContact? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * El candidato se deduce del token. Antes se aceptaba un `userId` en el body,
 * así que cualquiera podía sobrescribir el nombre, teléfono o LinkedIn de otro.
 */
const { jsonResponse, authUser, ensureProfileByUser } = require("../tp");
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
      full_name: b.fullName,
      sector: b.sector,
      phone: b.phone,
      linkedin: b.linkedin,
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
      if (!/empleo|pool_visible|allow_contact/i.test(err.message)) throw err;
      const { empleo: _e, pool_visible: _v, allow_contact: _a, ...resto } = campos;
      profile = await ensureProfileByUser(user.id, resto);
    }

    return jsonResponse(200, { ok: true, profileId: profile.id, profile });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar el perfil", details: err.message });
  }
};
