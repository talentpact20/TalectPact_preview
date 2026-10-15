/**
 * get-talent-pool — pool de talento real y anónimo para las empresas.
 *
 * Body: { soloVerificados?: boolean }
 * Cabecera: Authorization: Bearer <access token de Supabase>
 *
 * Exige sesión (cualquier cuenta): el pool no es público, para que nadie lo
 * descargue entero de forma anónima. Devuelve solo lo que una empresa puede ver
 * antes de pagar: alias, sector, mejores notas por skill, condiciones de empleo
 * e integridad. Nunca nombre, email, teléfono ni LinkedIn: eso solo sale por
 * get-contact y solo tras un desbloqueo pagado.
 *
 * Devuelve: { candidates: [{ ref, alias, i, sector, score, skills, cond, integ, verified, retos }] }
 */
const { jsonResponse, sb, authUser, anonymousAlias, faltaEnEsquema } = require("../tp");
const { extraerPersonas } = require("../personas");

const MAX_PERFILES = 500;
const LOTE = 100;
const ORDEN_RIESGO = { bajo: 0, medio: 1, alto: 2 };

/** Condiciones de empleo, saneadas: es dato que escribe el candidato. */
function limpiarCond(e) {
  if (!e || typeof e !== "object") return {};
  const lista = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6).map((x) => x.slice(0, 20)) : []);
  const texto = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
  const sal = Number(e.salMin);
  const horas = Number(e.horas);
  return {
    jornadas: lista(e.jornadas),
    modalidades: lista(e.modalidades),
    contratos: lista(e.contratos),
    ciudad: texto(e.ciudad, 80),
    reubicacion: !!e.reubicacion,
    disponibilidad: texto(e.disponibilidad, 20),
    salMin: Number.isFinite(sal) && sal > 0 ? Math.round(sal) : null,
    horas: Number.isFinite(horas) && horas >= 5 && horas <= 40 ? Math.round(horas) : null
  };
}

/**
 * Agrega perfiles + evaluaciones en fichas anónimas. Función pura: es lo que
 * prueban los tests, sin base de datos.
 */
function construirPool(perfiles, evaluaciones, { soloVerificados = false } = {}) {
  const porPerfil = new Map();
  for (const e of evaluaciones || []) {
    if (!e || !e.profile_id || !e.skill) continue;
    const verificada = !!(e.integrity && e.integrity.verified);
    if (soloVerificados && !verificada) continue;
    if (!porPerfil.has(e.profile_id)) porPerfil.set(e.profile_id, new Map());
    const skills = porPerfil.get(e.profile_id);
    const actual = skills.get(e.skill);
    if (!actual || e.score > actual.score) {
      skills.set(e.skill, {
        score: Number(e.score) || 0,
        verified: verificada,
        risk: e.integrity && ORDEN_RIESGO[e.integrity.risk] !== undefined ? e.integrity.risk : null
      });
    }
  }

  const fichas = [];
  for (const p of perfiles || []) {
    if (!p || p.pool_visible === false) continue;
    const skills = porPerfil.get(p.id);
    if (!skills || !skills.size) continue;
    const top = [...skills.entries()]
      .map(([n, d]) => ({ n, v: d.score, verified: d.verified, risk: d.risk }))
      .sort((a, b) => b.v - a.v);
    const seis = top.slice(0, 6);
    const alias = anonymousAlias(p.user_id || p.id);
    const peor = top.reduce((r, s) => (s.risk && (r === null || ORDEN_RIESGO[s.risk] > ORDEN_RIESGO[r]) ? s.risk : r), null);
    const skillsFicha = seis.map(({ n, v, verified }) => ({ n, v, verified }));
    // Todas las skills del candidato (no solo top 6) para el bloque Personas.
    const todas = top.map(({ n, v, verified }) => ({ n, v, verified }));
    fichas.push({
      ref: p.id,
      alias,
      i: alias.replace(/^Candidato #/, "").slice(0, 2),
      sector: typeof p.sector === "string" && p.sector ? p.sector.slice(0, 40) : "Sin sector",
      score: Math.round(seis.reduce((n, s) => n + s.v, 0) / seis.length),
      skills: skillsFicha,
      personas: extraerPersonas(todas),
      cond: limpiarCond(p.empleo),
      integ: peor,
      verified: top.every((s) => s.verified),
      acceptsContact: p.allow_contact !== false,
      retos: top.length
    });
  }
  return fichas.sort((a, b) => b.score - a.score);
}

/**
 * Select tolerante: si la migración aún no está aplicada, repite sin esas columnas.
 * Solo ante una columna ausente: con cualquier otro fallo, la consulta sin
 * pool_visible=is.true enseñaría a las empresas candidatos que se han ocultado.
 */
async function selectTolerante(tabla, conColumnas, sinColumnas, patron) {
  try {
    return await sb.select(tabla, conColumnas);
  } catch (err) {
    if (!faltaEnEsquema(err, patron)) throw err;
    return sb.select(tabla, sinColumnas);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const b = JSON.parse(event.body || "{}");
    const user = await authUser(event, b);
    if (!user) return jsonResponse(401, { error: "Inicia sesión para ver el pool de talento" });

    const perfiles = await selectTolerante(
      "profiles",
      `select=id,user_id,sector,empleo,pool_visible,allow_contact&pool_visible=is.true&order=created_at.desc&limit=${MAX_PERFILES}`,
      `select=id,user_id,sector&order=created_at.desc&limit=${MAX_PERFILES}`,
      /empleo|pool_visible|allow_contact/i
    );
    const lista = Array.isArray(perfiles) ? perfiles : [];

    // Evaluaciones por lotes de ids: una URL con 500 uuids sería demasiado larga.
    const evaluaciones = [];
    for (let k = 0; k < lista.length; k += LOTE) {
      const ids = lista.slice(k, k + LOTE).map((p) => p.id).join(",");
      if (!ids) continue;
      const filas = await selectTolerante(
        "evaluations",
        `select=profile_id,skill,score,integrity&profile_id=in.(${ids})&limit=5000`,
        `select=profile_id,skill,score&profile_id=in.(${ids})&limit=5000`,
        /integrity/i
      );
      if (Array.isArray(filas)) evaluaciones.push(...filas);
    }

    const candidates = construirPool(lista, evaluaciones, { soloVerificados: !!b.soloVerificados });
    return jsonResponse(200, { ok: true, candidates, total: candidates.length });
  } catch (err) {
    return jsonResponse(500, { error: "No se pudo cargar el pool de talento", details: err.message });
  }
};

module.exports.construirPool = construirPool;
module.exports.limpiarCond = limpiarCond;
