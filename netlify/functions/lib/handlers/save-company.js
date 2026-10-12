/**
 * save-company — crea o actualiza la ficha de una empresa autenticada.
 * Body: { companyName?, contactName?, jobTitle?, companySize? }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * La empresa se deduce del token, nunca de un `userId` enviado por el cliente.
 */
const { jsonResponse, authUser, ensureCompanyByUser } = require("../tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Sesión no válida o caducada" });

    const company = await ensureCompanyByUser(user.id, {
      email: user.email,
      company_name: b.companyName,
      contact_name: b.contactName,
      job_title: b.jobTitle,
      company_size: b.companySize
    });

    return jsonResponse(200, { ok: true, companyId: company.id, company });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo guardar la empresa", details: err.message });
  }
};
