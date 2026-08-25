/**
 * save-company — crea o actualiza la ficha de una empresa autenticada.
 * Body: { userId, email?, companyName?, contactName?, jobTitle?, companySize? }
 */
const { jsonResponse, ensureCompanyByUser } = require("./lib/tp");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    if (!b.userId) return jsonResponse(400, { error: "userId es obligatorio" });

    const company = await ensureCompanyByUser(b.userId, {
      email: b.email,
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
