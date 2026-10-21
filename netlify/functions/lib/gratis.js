/**
 * Desbloqueos gratis para empresas que empiezan.
 *
 * Las 3 primeras ofertas que publica una empresa incluyen 1 desbloqueo de
 * contacto cada una: así prueba el proceso de selección completo sin pagar.
 * Un desbloqueo gratis es una fila de `unlocks` en estado `paid` con importe 0:
 * get-contact y confirm-checkout no distinguen, solo miran que esté pagado.
 * Cuentan las ofertas cerradas: cerrar y volver a publicar no da más.
 */
const { sb } = require("./tp");

const OFERTAS_CON_REGALO = 3;
const DESBLOQUEOS_POR_OFERTA = 1;

/** Función pura: cuántos desbloqueos gratis tiene y le quedan. */
function calcularCreditos(ofertas, usados) {
  const conRegalo = Math.min(Math.max(0, Number(ofertas) || 0), OFERTAS_CON_REGALO);
  const incluidos = conRegalo * DESBLOQUEOS_POR_OFERTA;
  const gastados = Math.max(0, Number(usados) || 0);
  return {
    ofertasConRegalo: OFERTAS_CON_REGALO,
    ofertasPublicadas: conRegalo,
    ofertasGratisPendientes: OFERTAS_CON_REGALO - conRegalo,
    incluidos,
    usados: gastados,
    restantes: Math.max(0, incluidos - gastados)
  };
}

/** Cuenta en Supabase las ofertas y los desbloqueos gratis de una empresa. */
async function creditosGratis(userId) {
  const ofertas = await sb.select("jobs", `company_user_id=eq.${userId}&select=id&limit=${OFERTAS_CON_REGALO}`);
  const usados = await sb.select("unlocks", `company_user_id=eq.${userId}&status=eq.paid&amount_cents=eq.0&select=id&limit=100`);
  return calcularCreditos(Array.isArray(ofertas) ? ofertas.length : 0, Array.isArray(usados) ? usados.length : 0);
}

module.exports = { OFERTAS_CON_REGALO, DESBLOQUEOS_POR_OFERTA, calcularCreditos, creditosGratis };
