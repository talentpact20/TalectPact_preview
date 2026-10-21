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
 *   PDF del currículum (Storage) -> credentials -> evaluations -> profiles -> companies (y en cascada sus
 *   ofertas y postulaciones) -> unlocks -> notifications -> usuario de Auth
 *
 * Una tabla que no existe (migración sin aplicar) se salta. Cualquier otro
 * error para el borrado ANTES de tocar el usuario de Auth: así la persona
 * puede reintentar. Antes esos errores se tragaban y se respondía «borrado»
 * con datos todavía en la base.
 *
 * Se borra tanto el rastro de candidato como el de empresa porque una misma
 * cuenta de Auth puede ser cualquiera de las dos, y el aviso de privacidad
 * promete supresion completa, no parcial.
 */
const { jsonResponse, sb, supabaseEnv, errorInterno, tokenFromEvent, faltaEnEsquema } = require("../tp");
const { borrarCv } = require("../cv");

/** Borra si la tabla existe; si no existe, devuelve false. Otros errores se propagan. */
async function borrarSiExiste(tabla, filtro) {
  try { await sb.remove(tabla, filtro); return true; }
  catch (err) { if (faltaEnEsquema(err, tabla)) return false; throw err; }
}

/** Devuelve el usuario dueño del token, o null si el token no vale. */
async function userFromToken(url, serviceKey, accessToken) {
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: serviceKey, authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000)
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
    // Cabecera Authorization o, por compatibilidad, accessToken en el cuerpo.
    const token = tokenFromEvent(event, body);
    if (!token) return jsonResponse(400, { error: "Falta el token de sesión" });

    const user = await userFromToken(url, key, token);
    if (!user) return jsonResponse(401, { error: "Sesion no valida o caducada" });

    // 1. Perfil asociado (puede no existir si nunca guardo nada).
    const found = await sb.select("profiles", `user_id=eq.${user.id}&select=id&limit=1`);
    const profile = Array.isArray(found) && found.length ? found[0] : null;

    if (profile) {
      // El PDF del currículum vive en Storage, fuera de las tablas.
      await borrarCv(profile.id);
      // `credentials` y `evaluations` referencian el perfil: van primero.
      await borrarSiExiste("credentials", `profile_id=eq.${profile.id}`);
      await sb.remove("evaluations", `profile_id=eq.${profile.id}`);
      await sb.remove("profiles", `id=eq.${profile.id}`);
    }

    // 1b. Rastro de empresa. Va en try/catch por separado: si estas tablas no
    // existen en una instalacion antigua, el borrado del candidato no debe caerse.
    // Las ofertas (jobs) y sus postulaciones cuelgan de companies en cascada.
    const empresaBorrada = await borrarSiExiste("companies", `user_id=eq.${user.id}`);
    // `unlocks` guarda a que candidatos desbloqueo esta empresa y cuando pago:
    // es historial de una persona identificada y entra en el derecho de supresion.
    const desbloqueosBorrados = await borrarSiExiste("unlocks", `company_user_id=eq.${user.id}`);
    // Los avisos de la bandeja no tienen clave foránea: antes se quedaban.
    const avisosBorrados = await borrarSiExiste("notifications", `user_id=eq.${user.id}`);

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
        unlocks: desbloqueosBorrados,
        notifications: avisosBorrados
      }
    });
  } catch (err) {
    return errorInterno("No se pudo eliminar la cuenta", err);
  }
};
