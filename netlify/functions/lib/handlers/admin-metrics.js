/**
 * admin-metrics — datos reales del backoffice.
 *
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Solo para cuentas con `app_metadata.role = 'admin'`. app_metadata únicamente
 * lo escribe el servidor con la service key (en Supabase: Authentication →
 * Users → editar usuario, o la admin API); user_metadata, en cambio, lo puede
 * cambiar el propio usuario, así que no sirve para dar privilegios.
 *
 * Minimización: el backoffice ve agregados, alias y nombres de empresa. Nunca
 * email, teléfono ni nombre de candidatos (eso solo sale por get-contact).
 */
const { jsonResponse, sb, authUser, anonymousAlias } = require("../tp");

function esAdmin(user) {
  return !!(user && user.app_metadata && user.app_metadata.role === "admin");
}

/** count tolerante: una tabla aún no migrada cuenta como "sin datos", no tumba el panel. */
async function contar(tabla, filtro = "") {
  try { return await sb.count(tabla, filtro); } catch (_e) { return null; }
}
async function leer(tabla, consulta) {
  try { const r = await sb.select(tabla, consulta); return Array.isArray(r) ? r : []; } catch (_e) { return []; }
}

/** Agregados de evaluaciones. Función pura para los tests. */
function resumirEvaluaciones(evals) {
  const n = evals.length;
  const porModelo = {};
  const riesgo = { bajo: 0, medio: 0, alto: 0, sin: 0 };
  let suma = 0, coste = 0, conCoste = 0, verificadas = 0, bloqueadas = 0;
  for (const e of evals) {
    suma += Number(e.score) || 0;
    if (e.cost_eur != null) { coste += Number(e.cost_eur) || 0; conCoste++; }
    const m = e.model_used || "sin IA (reserva)";
    porModelo[m] = (porModelo[m] || 0) + 1;
    const i = e.integrity || {};
    if (i.verified) verificadas++;
    if (Array.isArray(i.injectionSignals) && i.injectionSignals.length) bloqueadas++;
    riesgo[["bajo", "medio", "alto"].includes(i.risk) ? i.risk : "sin"]++;
  }
  return {
    muestra: n,
    notaMedia: n ? Math.round(suma / n) : null,
    costeTotalEur: Math.round(coste * 10000) / 10000,
    costeMedioEur: conCoste ? Math.round((coste / conCoste) * 10000) / 10000 : null,
    porModelo,
    verificadasPct: n ? Math.round((verificadas / n) * 100) : null,
    conSenalesInyeccion: bloqueadas,
    riesgo
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión" });
    if (!esAdmin(user)) return jsonResponse(403, { error: "Tu cuenta no tiene rol de administrador" });

    const [candidatos, empresas, evaluacionesTotal, ofertasAbiertas, ofertasTotal, desbloqueos, accesos] = await Promise.all([
      contar("profiles"), contar("companies"), contar("evaluations"),
      contar("jobs", "status=eq.open"), contar("jobs"),
      contar("unlocks", "status=eq.paid"), contar("contact_access")
    ]);

    const evals = await leer("evaluations",
      "select=profile_id,skill,score,model_used,cost_eur,integrity,created_at&order=created_at.desc&limit=1000");
    const pagos = await leer("unlocks",
      "select=amount_cents,currency,paid_at,candidate_label,livemode&status=eq.paid&order=paid_at.desc&limit=500");
    const ofertas = await leer("jobs",
      "select=id,title,sector,status,created_at,companies(company_name)&order=created_at.desc&limit=50");
    const ultimasEmpresas = await leer("companies",
      "select=company_name,company_size,sector,created_at&order=created_at.desc&limit=20");

    // Alias de los candidatos de las últimas evaluaciones (nunca su nombre).
    const ultimas = evals.slice(0, 25);
    const ids = [...new Set(ultimas.map((e) => e.profile_id).filter(Boolean))];
    const perfiles = ids.length ? await leer("profiles", `select=id,user_id&id=in.(${ids.join(",")})`) : [];
    const aliasDe = Object.fromEntries(perfiles.map((p) => [p.id, anonymousAlias(p.user_id || p.id)]));

    const ingresosCents = pagos.reduce((n, p) => n + (Number(p.amount_cents) || 0), 0);
    return jsonResponse(200, {
      ok: true,
      generadoEn: new Date().toISOString(),
      totales: { candidatos, empresas, evaluaciones: evaluacionesTotal, ofertasAbiertas, ofertasTotal, desbloqueos, accesosContacto: accesos },
      ingresos: {
        totalEur: Math.round(ingresosCents) / 100,
        pagos: pagos.length,
        enModoPrueba: pagos.filter((p) => !p.livemode).length,
        ultimos: pagos.slice(0, 15).map((p) => ({ importeEur: (Number(p.amount_cents) || 0) / 100, fecha: p.paid_at, concepto: p.candidate_label || "Desbloqueo", prueba: !p.livemode }))
      },
      evaluaciones: Object.assign(resumirEvaluaciones(evals), {
        ultimas: ultimas.map((e) => ({
          alias: aliasDe[e.profile_id] || "—", skill: e.skill, nota: e.score, modelo: e.model_used || null,
          verificada: !!(e.integrity && e.integrity.verified), riesgo: (e.integrity && e.integrity.risk) || null, fecha: e.created_at
        }))
      }),
      ofertas: ofertas.map((o) => ({ titulo: o.title, sector: o.sector, estado: o.status, empresa: (o.companies && o.companies.company_name) || "—", fecha: o.created_at })),
      empresasRecientes: ultimasEmpresas.map((c) => ({ nombre: c.company_name || "—", tamano: c.company_size || "—", sector: c.sector || "—", alta: c.created_at }))
    });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudieron cargar las métricas", details: err.message });
  }
};

module.exports.resumirEvaluaciones = resumirEvaluaciones;
module.exports.esAdmin = esAdmin;
