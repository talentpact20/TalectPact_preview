/**
 * get-contact — entrega el contacto real de un candidato a la empresa que lo
 * ha desbloqueado.
 *
 * Body: { candidateRef }   (el `ref` que devuelve get-talent-pool)
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Es la única puerta por la que sale un dato personal de un candidato, así que:
 *  · la empresa se deduce del token, nunca del body;
 *  · tiene que existir un desbloqueo de ESA empresa para ESE candidato en
 *    estado `paid` (lo pone Stripe, vía webhook o confirm-checkout);
 *  · cada entrega queda registrada en `contact_access` (trazabilidad RGPD).
 *
 * Devuelve: { contact: { name, email, phone, linkedin }, cv: {nombre, bytes, subido} | null, unlockedAt }
 */
const { jsonResponse, sb, authUser, isUuid, supabaseEnv, faltaEnEsquema, errorInterno } = require("../tp");
const { metaPublica } = require("../cv");

/** Completa con Auth lo que el perfil no tenga (email de la cuenta, metadatos). */
async function datosDeAuth(userId) {
  if (!userId) return {};
  try {
    const { url, key } = supabaseEnv();
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: key, authorization: `Bearer ${key}` }
    });
    if (!res.ok) return {};
    const u = await res.json();
    const m = (u && u.user_metadata) || {};
    return { email: u.email, name: m.full_name || m.name, phone: m.phone, linkedin: m.linkedin };
  } catch (_e) {
    return {};
  }
}

const texto = (v, n = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });

    const ref = String(b.candidateRef || "").trim();
    // Solo perfiles reales (uuid). Además impide inyectar filtros en PostgREST.
    if (!isUuid(ref)) {
      return jsonResponse(400, { error: "Ese candidato no es un perfil real", code: "not_real_candidate" });
    }

    const pagos = await sb.select(
      "unlocks",
      `company_user_id=eq.${user.id}&candidate_ref=eq.${ref}&status=eq.paid&select=id,paid_at&order=paid_at.desc&limit=1`
    );
    const unlock = Array.isArray(pagos) ? pagos[0] : null;
    if (!unlock) {
      return jsonResponse(402, { error: "Este contacto no está desbloqueado por tu cuenta", code: "not_unlocked" });
    }

    // Columnas opcionales por migración: se quitan solo si faltan de verdad.
    const opcionales = [["cv", /\bcv\b/i], ["allow_contact", /allow_contact/i]];
    let filas;
    for (;;) {
      const cols = ["id", "user_id", "full_name", "email", "phone", "linkedin"].concat(opcionales.map(([c]) => c)).join(",");
      try { filas = await sb.select("profiles", `id=eq.${ref}&select=${cols}&limit=1`); break; }
      catch (err) {
        const i = opcionales.findIndex(([, re]) => faltaEnEsquema(err, re));
        if (i < 0) throw err;
        opcionales.splice(i, 1);
      }
    }
    const perfil = Array.isArray(filas) ? filas[0] : null;
    if (!perfil) {
      // Pagó, pero el candidato ha borrado su cuenta: el dato ya no existe.
      return jsonResponse(410, { error: "El candidato ha eliminado su cuenta", code: "candidate_deleted" });
    }

    // El candidato puede retirar el consentimiento a ser contactado (art. 7.3 RGPD):
    // desde ese momento su contacto no se entrega, aunque hubiera un pago previo.
    if (perfil.allow_contact === false) {
      return jsonResponse(409, { error: "El candidato ha retirado su consentimiento a ser contactado", code: "contact_withdrawn" });
    }

    const auth = (!perfil.email || !perfil.full_name || !perfil.phone) ? await datosDeAuth(perfil.user_id) : {};
    const contact = {
      name: texto(perfil.full_name) || texto(auth.name),
      email: texto(perfil.email) || texto(auth.email),
      phone: texto(perfil.phone, 40) || texto(auth.phone, 40),
      linkedin: texto(perfil.linkedin) || texto(auth.linkedin)
    };

    // Registro de la entrega. Si la tabla aún no existe, no se bloquea al
    // cliente que ya ha pagado: se avisa en el log.
    try {
      await sb.insert("contact_access", {
        company_user_id: user.id,
        candidate_profile_id: perfil.id,
        unlock_id: unlock.id
      });
    } catch (err) {
      console.warn("get-contact: no se pudo registrar el acceso:", err.message);
    }

    // Solo si hay CV y su nombre; el archivo se pide aparte a la función cv.
    return jsonResponse(200, { ok: true, contact, cv: metaPublica(perfil.cv), unlockedAt: unlock.paid_at || null });
  } catch (err) {
    return errorInterno("No se pudo obtener el contacto", err);
  }
};
