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
 * Devuelve: { candidates: [{ ref, alias, i, sector, score, skills, cond, integ, verified, retos,
 *            interesa, postulado, etapa }], gratis }
 * interesa / postulado / etapa y gratis solo tienen sentido si pide una empresa.
 */
const { jsonResponse, sb, authUser, anonymousAlias, faltaEnEsquema, errorInterno, isUuid, companyOf } = require("../tp");
const { extraerPersonas } = require("../personas");
const { creditosGratis } = require("../gratis");

const MAX_PERFILES = 500;
const LOTE = 100;
const ORDEN_RIESGO = { bajo: 0, medio: 1, alto: 2 };

// «Open to work»: lo marca el candidato en sus preferencias de empleo.
const BUSQUEDAS = ["activa", "abierta", "no"];
const MAX_INTERES = 50;

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
    horas: Number.isFinite(horas) && horas >= 5 && horas <= 40 ? Math.round(horas) : null,
    busqueda: BUSQUEDAS.includes(e.busqueda) ? e.busqueda : "",
    // Empresas (companies.id) que le interesan. No sale nunca en el pool: cada
    // empresa solo sabe si está ella en la lista.
    interes: Array.isArray(e.interes) ? [...new Set(e.interes.filter((x) => isUuid(String(x))).map(String))].slice(0, MAX_INTERES) : []
  };
}

/** Lo que ve una empresa de las condiciones: todo menos la lista de empresas. */
function condPublica(e) {
  const { interes: _i, ...resto } = limpiarCond(e);
  return resto;
}

/**
 * Agrega perfiles + evaluaciones en fichas anónimas. Función pura: es lo que
 * prueban los tests, sin base de datos.
 */
function construirPool(perfiles, evaluaciones, { soloVerificados = false, empresaId = null, postulaciones = null } = {}) {
  const porPerfil = new Map();
  for (const e of evaluaciones || []) {
    if (!e || !e.profile_id || !e.skill) continue;
    const verificada = !!(e.integrity && e.integrity.verified);
    if (soloVerificados && !verificada) continue;
    if (!porPerfil.has(e.profile_id)) porPerfil.set(e.profile_id, new Map());
    const skills = porPerfil.get(e.profile_id);
    const actual = skills.get(e.skill);
    // Una nota verificada manda sobre cualquier no verificada, aunque sea más
    // baja: antes un 100 enviado por el navegador tapaba un 70 firmado.
    const mejor = !actual || (verificada && !actual.verified) ||
      (verificada === actual.verified && Number(e.score) > actual.score);
    if (mejor) {
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
    const cond = limpiarCond(p.empleo);
    const post = postulaciones && postulaciones.get(p.id);
    fichas.push({
      ref: p.id,
      alias,
      i: alias.replace(/^Candidato #/, "").slice(0, 2),
      sector: typeof p.sector === "string" && p.sector ? p.sector.slice(0, 40) : "Sin sector",
      score: Math.round(seis.reduce((n, s) => n + s.v, 0) / seis.length),
      skills: skillsFicha,
      // Todas, para que el buscador encuentre también las que no están en el top 6.
      todas: todas.slice(0, 40),
      personas: extraerPersonas(todas),
      cond: condPublica(p.empleo),
      integ: peor,
      verified: top.every((s) => s.verified),
      acceptsContact: p.allow_contact !== false,
      retos: top.length,
      // Señales para la empresa que pide el pool, no para todas.
      interesa: !!(empresaId && cond.interes.includes(String(empresaId))),
      postulado: post ? post.ofertas : 0,
      etapa: post ? post.etapa : ""
    });
  }
  return fichas.sort((a, b) => b.score - a.score);
}

const ORDEN_ETAPA = ["descartado", "aplicado", "retos", "preseleccionado", "entrevista", "contratado"];

/** Postulaciones de una empresa → perfil: { ofertas, etapa más avanzada }. */
function resumirPostulaciones(filas) {
  const m = new Map();
  for (const a of Array.isArray(filas) ? filas : []) {
    if (!a || !a.candidate_profile_id) continue;
    const r = m.get(a.candidate_profile_id) || { ofertas: 0, etapa: "" };
    r.ofertas++;
    if (ORDEN_ETAPA.indexOf(a.status) > ORDEN_ETAPA.indexOf(r.etapa)) r.etapa = a.status;
    m.set(a.candidate_profile_id, r);
  }
  return m;
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

    // Si quien pide es una empresa: quién se ha postulado a sus ofertas, quién
    // ha marcado que le interesa y cuántos desbloqueos gratis le quedan.
    const empresa = await companyOf(user.id).catch(() => null);
    let postulaciones = null, gratis = null;
    if (empresa) {
      try {
        const filas = await sb.select("applications", `company_user_id=eq.${user.id}&select=candidate_profile_id,status&limit=2000`);
        postulaciones = resumirPostulaciones(filas);
      } catch (err) {
        if (!faltaEnEsquema(err, "applications")) throw err;
      }
      gratis = await creditosGratis(user.id).catch(() => null);
    }

    const candidates = construirPool(lista, evaluaciones, {
      soloVerificados: !!b.soloVerificados,
      empresaId: empresa ? empresa.id : null,
      postulaciones
    });
    return jsonResponse(200, { ok: true, candidates, total: candidates.length, gratis });
  } catch (err) {
    return errorInterno("No se pudo cargar el pool de talento", err);
  }
};

module.exports.construirPool = construirPool;
module.exports.limpiarCond = limpiarCond;
module.exports.condPublica = condPublica;
module.exports.resumirPostulaciones = resumirPostulaciones;
