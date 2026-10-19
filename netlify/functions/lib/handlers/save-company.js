/**
 * save-company — crea o actualiza la ficha de una empresa autenticada.
 * Body: { companyName?, contactName?, jobTitle?, companySize?, description?, sector?, website?, location? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * La empresa se deduce del token, nunca de un `userId` enviado por el cliente.
 */
const { jsonResponse, authUser, ensureCompanyByUser, verificacionDeEmpresa, faltaEnEsquema, errorInterno } = require("../tp");
const { esSector } = require("../taxonomia");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });
    // Una cuenta de candidato no se convierte en empresa por llamar aquí: tener
    // ficha en companies es lo que permite publicar ofertas y pagar contactos.
    if ((user.user_metadata || {}).role === "candidate") {
      return jsonResponse(403, { error: "Esta cuenta es de candidato", code: "not_company" });
    }

    const txt = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
    const web = txt(b.website, 200);
    const campos = {
      email: user.email,
      company_name: txt(b.companyName, 120),
      contact_name: txt(b.contactName, 120),
      job_title: txt(b.jobTitle, 120),
      company_size: txt(b.companySize, 40),
      // Ficha pública que ven los candidatos en cada oferta.
      description: txt(b.description, 1500),
      // Sector de la empresa: uno de los 22 concretos de lib/taxonomia.json (los 12 generales también valen).
      sector: esSector(b.sector) ? b.sector : undefined,
      // Solo enlaces http(s): esta URL se pinta como enlace para candidatos.
      website: web && /^https?:\/\/[^\s<>"']+$/i.test(web) ? web : undefined,
      location: txt(b.location, 80)
    };
    let company;
    try {
      company = await ensureCompanyByUser(user.id, campos);
    } catch (err) {
      // Sin la migración supabase_schema_jobs.sql esas columnas no existen.
      if (!faltaEnEsquema(err, /description|sector|website|location/i)) throw err;
      const { description: _d, sector: _s, website: _w, location: _l, ...resto } = campos;
      company = await ensureCompanyByUser(user.id, resto);
    }

    const verificacion = await verificacionDeEmpresa(user, company);
    return jsonResponse(200, { ok: true, companyId: company.id, company, verificacion });
  } catch (err) {
    return errorInterno("No se pudo guardar la empresa", err);
  }
};
