/**
 * Verificación de empresa: ¿la cuenta pertenece de verdad a la empresa?
 *
 * Dos vías, de más a menos fuerte. Las decide el servidor con datos que el
 * usuario no puede editar (nunca con user_metadata, que cualquiera cambia):
 *
 *  1. google_workspace: entró con Google y Google certifica que la cuenta es
 *     del dominio de la empresa (claim `hd` de la identidad, que solo existe
 *     en cuentas de Google Workspace y coincide con el dominio del email).
 *  2. email_corporativo: email de un dominio propio (no Gmail, Hotmail…) y
 *     confirmado. Solo vale si Supabase exige confirmar el email; con la
 *     confirmación automática activada (`mailer_autoconfirm`), cualquiera puede
 *     registrarse con rrhh@empresa-grande.com sin ser suyo, y no se concede.
 *
 * Sin ninguna de las dos: sin_verificar, con el motivo para explicárselo.
 */

const NIVELES = ["google_workspace", "email_corporativo", "sin_verificar"];

// Correo gratuito o personal: no prueba nada sobre la empresa.
const GRATUITOS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es", "live.com", "live.es",
  "msn.com", "yahoo.com", "yahoo.es", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "gmx.com", "gmx.es",
  "gmx.net", "proton.me", "protonmail.com", "pm.me", "yandex.com", "mail.com", "zoho.com", "tutanota.com",
  "telefonica.net", "movistar.es", "orange.es", "vodafone.es", "terra.es", "ya.com", "wanadoo.es"
]);

function dominioDeEmail(email) {
  const m = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(String(email || "").trim().toLowerCase());
  return m ? m[1] : null;
}

function esGratuito(dominio) {
  return !dominio || GRATUITOS.has(dominio);
}

/** Dominio de una web (https://www.empresa.com/x → empresa.com). */
function dominioDeWeb(url) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : "https://" + url).hostname.toLowerCase().replace(/^www\./, "");
  } catch (_e) {
    return null;
  }
}

/**
 * Dominio de Google Workspace certificado por Google para este usuario.
 * Se lee de user.identities (lo escribe Supabase al iniciar sesión con Google),
 * no de user_metadata.
 */
function dominioWorkspace(user) {
  for (const id of (user && user.identities) || []) {
    if (!id || id.provider !== "google") continue;
    const d = id.identity_data || {};
    const hd = d.hd || (d.custom_claims && d.custom_claims.hd);
    if (typeof hd === "string" && hd.trim()) return hd.trim().toLowerCase();
  }
  return null;
}

/**
 * Nivel de verificación de una cuenta de empresa.
 * `autoconfirm`: valor de mailer_autoconfirm del proyecto (true, false o null si no se sabe).
 */
function verificarEmpresa(user, { autoconfirm = null, web = null } = {}) {
  const dominio = dominioDeEmail(user && user.email);
  const hd = dominioWorkspace(user);
  let nivel = "sin_verificar", motivo = null;
  if (hd && dominio && hd === dominio) {
    nivel = "google_workspace";
  } else if (esGratuito(dominio)) {
    motivo = "correo_gratuito";
  } else if (!(user && user.email_confirmed_at)) {
    motivo = "email_sin_confirmar";
  } else if (autoconfirm !== false) {
    // Con confirmación automática (o si no se ha podido comprobar) el email no prueba nada.
    motivo = "confirmacion_desactivada";
  } else {
    nivel = "email_corporativo";
  }
  const dWeb = web ? dominioDeWeb(web) : null;
  return {
    nivel,
    motivo,
    dominio: nivel === "sin_verificar" ? null : dominio,
    // La web que indica la empresa se enseña como «coincide» solo si es de su dominio.
    webCoincide: !!(dWeb && dominio && nivel !== "sin_verificar" && (dWeb === dominio || dWeb.endsWith("." + dominio)))
  };
}

/** Texto para explicar a la empresa por qué no está verificada y qué hacer. */
const AYUDA = {
  correo_gratuito: "Tu cuenta usa un correo personal. Entra con la cuenta de Google de tu empresa o regístrate con tu email corporativo.",
  email_sin_confirmar: "Confirma tu email corporativo desde el enlace que te enviamos.",
  confirmacion_desactivada: "Para verificar por email corporativo, la confirmación de email tiene que estar activada. Mientras tanto, entra con la cuenta de Google de tu empresa (Google Workspace)."
};

module.exports = { NIVELES, GRATUITOS, AYUDA, dominioDeEmail, esGratuito, dominioDeWeb, dominioWorkspace, verificarEmpresa };
