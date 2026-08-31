/**
 * delete-account — borra permanentemente la cuenta de quien hace la peticion.
 *
 * Body: { accessToken }   ← el JWT de la sesion, NO un userId.
 *
 * El cliente nunca dice a quien hay que borrar: manda su token y el servidor
 * pregunta a Supabase de quien es. Asi nadie puede borrar la cuenta de otro
 * cambiando un id en la peticion.
 *
 * Orden de borrado (las credenciales y evaluaciones cuelgan del perfil):
 *   credentials -> evaluations -> profiles -> companies -> unlocks -> usuario de Auth
 *
 * Se borra tanto el rastro de candidato como el de empresa porque una misma
 * cuenta de Auth puede ser cualquiera de las dos, y el aviso de privacidad
 * promete supresion completa, no parcial.
 */
const { jsonResponse, sb, supabaseEnv } = require("./lib/tp");

/** Devuelve el usuario dueño del token, o null si el token no vale. */
async function userFromToken(url, serviceKey, accessToken) {
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: serviceKey, authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  let url, key;
  try {
    ({ url, key } = supabaseEnv());
  } catch (err) {
    // Sin service key el borrado es imposible: decirlo claro, no fingir exito.
    return jsonResponse(503, {
      error: "El borrado de cuentas no esta configurado en este entorno",
      details: "Falta SUPABASE_SERVICE_KEY en las variables de entorno del servidor."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    if (!body.accessToken) return jsonResponse(400, { error: "accessToken es obligatorio" });

    const user = await userFromToken(url, key, body.accessToken);
    if (!user) return jsonResponse(401, { error: "Sesion no valida o caducada" });

    // 1. Perfil asociado (puede no existir si nunca guardo nada).
    const found = await sb.select("profiles", `user_id=eq.${user.id}&select=id&limit=1`);
    const profile = Array.isArray(found) && found.length ? found[0] : null;

    if (profile) {
      // `credentials` y `evaluations` referencian el perfil: van primero.
      try { await sb.remove("credentials", `profile_id=eq.${profile.id}`); } catch (_e) { /* tabla opcional */ }
      await sb.remove("evaluations", `profile_id=eq.${profile.id}`);
      await sb.remove("profiles", `id=eq.${profile.id}`);
    }

    // 1b. Rastro de empresa. Va en try/catch por separado: si estas tablas no
    // existen en una instalacion antigua, el borrado del candidato no debe caerse.
    let empresaBorrada = false, desbloqueosBorrados = false;
    try { await sb.remove("companies", `user_id=eq.${user.id}`); empresaBorrada = true; }
    catch (_e) { /* tabla opcional */ }
    // `unlocks` guarda a que candidatos desbloqueo esta empresa y cuando pago:
    // es historial de una persona identificada y entra en el derecho de supresion.
    try { await sb.remove("unlocks", `company_user_id=eq.${user.id}`); desbloqueosBorrados = true; }
    catch (_e) { /* tabla opcional */ }

    // 2. El usuario de Auth, con la admin API (requiere la service key).
    const res = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { apikey: key, authorization: `Bearer ${key}` }
    });
    if (!res.ok) {
      const detail = await res.text();
      return jsonResponse(502, {
        error: "Los datos se borraron, pero el usuario de Auth no",
        details: `${res.status}: ${detail}`
      });
    }

    return jsonResponse(200, {
      ok: true,
      deleted: {
        userId: user.id,
        profileId: profile ? profile.id : null,
        company: empresaBorrada,
        unlocks: desbloqueosBorrados
      }
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo eliminar la cuenta", details: err.message });
  }
};
