/**
 * list-jobs — ofertas de empleo.
 *
 * Body: {}                → ofertas abiertas (público, sin sesión: es un tablón de empleo)
 * Body: { mine: true }    → todas las ofertas de la empresa del token (abiertas y cerradas)
 *
 * Nunca devuelve `company_user_id`: el id de la cuenta que publica no es público.
 */
const { jsonResponse, sb, authUser, faltaEnEsquema, errorInterno } = require("../tp");
const { limpiarRequisitos } = require("../requisitos");

const CAMPOS_BASE = "id,title,sector,description,required_skills,tags,required_level,exercise_config," +
  "jornada,modalidad,contrato,ubicacion,sal_min,sal_max,status,created_at,closed_at";
const CAMPOS_QS = CAMPOS_BASE + ",culture_questions";
const CAMPOS_DIL = CAMPOS_QS + ",dilemmas";
const CAMPOS = CAMPOS_DIL + ",skill_requirements";

function textosJson(v, max, len) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string").map((x) => x.slice(0, len)).filter(Boolean).slice(0, max);
}

/** Fila de Supabase → oferta con la forma que usa la web. */
function aOferta(f) {
  const c = f.companies || {};
  return {
    id: f.id,
    title: f.title,
    sector: f.sector,
    desc: f.description,
    requiredSkills: f.required_skills || [],
    skillRequirements: limpiarRequisitos(f.skill_requirements).requisitos || [],
    tags: f.tags || [],
    requiredLevel: f.required_level,
    exerciseConfig: f.exercise_config,
    jornada: f.jornada,
    modalidad: f.modalidad,
    contrato: f.contrato,
    ubicacion: f.ubicacion || "",
    salMin: f.sal_min,
    salMax: f.sal_max,
    cultureQuestions: textosJson(f.culture_questions, 3, 200),
    dilemmas: textosJson(f.dilemmas, 3, 600),
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
  const join = "companies(company_name,company_size,description,sector,website,location)";
  const joinMin = "companies(company_name,company_size)";
  const intentos = [
    `select=${CAMPOS},${join}&${filtro}`,
    `select=${CAMPOS_DIL},${join}&${filtro}`,
    `select=${CAMPOS_QS},${join}&${filtro}`,
    `select=${CAMPOS_BASE},${join}&${filtro}`,
    `select=${CAMPOS_BASE},${joinMin}&${filtro}`
  ];
  let ultimo = null;
  for (const q of intentos) {
    try {
      return await sb.select("jobs", q);
    } catch (err) {
      ultimo = err;
      if (!faltaEnEsquema(err, /skill_requirements|culture_questions|dilemmas|description|sector|website|location/i)) throw err;
    }
  }
  throw ultimo || new Error("No se pudieron cargar las ofertas");
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
    return errorInterno("No se pudieron cargar las ofertas", err);
  }
};

module.exports.aOferta = aOferta;
