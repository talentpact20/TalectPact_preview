/**
 * Sello público del SkillPass: de pago para el candidato.
 * (docs/plan_post_reunion/03_blockchain_de_pago.md)
 *
 *  · Emitir y compartir el SkillPass es gratis: TalentPact lo firma y cualquiera
 *    lo comprueba en verify.html («Emitida por TalentPact»).
 *  · El sello público (su huella anclada en blockchain, comprobable incluso sin
 *    TalentPact) cuesta SEAL_PRICE y se paga por credencial.
 *  · Verificar es siempre gratis para las empresas.
 * El importe lo fija el servidor; el navegador nunca lo envía.
 */
const SEAL_PRICE = {
  amountCents: Number(process.env.SEAL_PRICE_CENTS || 499),
  currency: (process.env.SEAL_CURRENCY || "eur").toLowerCase(),
  label: "Sello público del SkillPass — TalentPact"
};

/** ¿Está pagado el sello de esta credencial? null si la tabla aún no existe. */
async function selloPagado(sb, faltaEnEsquema, credentialId, userId) {
  try {
    const f = await sb.select("seal_payments", `credential_id=eq.${credentialId}&user_id=eq.${userId}&status=eq.paid&select=id&limit=1`);
    return Array.isArray(f) && f.length > 0;
  } catch (err) {
    if (faltaEnEsquema(err, /seal_payments/i)) return null;
    throw err;
  }
}

module.exports = { SEAL_PRICE, selloPagado };
