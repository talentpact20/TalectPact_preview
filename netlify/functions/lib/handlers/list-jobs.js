/**
 * list-jobs — ofertas de empleo.
 *
 * Body: {}                → ofertas abiertas (público, sin sesión: es un tablón de empleo)
 * Body: { mine: true }    → todas las ofertas de la empresa del token (abiertas y cerradas)
 *
 * Nunca devuelve `company_user_id`: el id de la cuenta que publica no es público.
 */
const { jsonResponse, sb, authUser } = require("../tp");

const CAMPOS = "id,title,sector,description,required_skills,tags,required_level,exercise_config," +
  "jornada,modalidad,contrato,ubicacion,sal_min,sal_max,status,created_at,closed_at";

/** Fila de Supabase → oferta con la forma que usa la web. */
function aOferta(f) {
  const c = f.companies || {};
  return {
    id: f.id,
    title: f.title,
    sector: f.sector,
    desc: f.description,
    requiredSkills: f.required_skills || [],
    tags: f.tags || [],
    requiredLevel: f.required_level,
    exerciseConfig: f.exercise_config,
    jornada: f.jornada,
    modalidad: f.modalidad,
    contrato: f.contrato,
    ubicacion: f.ubicacion || "",
    salMin: f.sal_min,
    salMax: f.sal_max,
    status: f.status,
    createdAt: f.created_at,
    closedAt: f.closed_at,
    company: {
      name: c.company_name || "Empresa",
      size: c.company_size || null,
      description: c.description || null,
      sector: c.sector || null,
      website: c.website || null,
      location: c.location || null
    }
  };
}

async function seleccionar(filtro) {
  try {
    return await sb.select("jobs", `select=${CAMPOS},companies(company_name,company_size,description,sector,website,location)&${filtro}`);
  } catch (err) {
    // Sin la migración de la ficha de empresa, se sirve la oferta con el nombre.
    if (!/description|sector|website|location/i.test(err.message)) throw err;
    return sb.select("jobs", `select=${CAMPOS},companies(company_name,company_size)&${filtro}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    let filas;
    if (b.mine) {
      const user = await authUser(event, b);
      if (!user) return jsonResponse(401, { error: "Inicia sesión con tu cuenta de empresa" });
      filas = await seleccionar(`company_user_id=eq.${user.id}&order=created_at.desc&limit=200`);
    } else {
      filas = await seleccionar("status=eq.open&order=created_at.desc&limit=200");
    }
    const jobs = (Array.isArray(filas) ? filas : []).map(aOferta);
    return jsonResponse(200, { ok: true, jobs });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudieron cargar las ofertas", details: err.message });
  }
};

module.exports.aOferta = aOferta;
