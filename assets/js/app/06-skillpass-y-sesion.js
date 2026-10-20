// TalentPact · 06-skillpass-y-sesion
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// SkillPass — credencial verificable W3C (VC 2.0) firmada por TalentPact.
// Flujo: issue-credential (compone y firma) → enlace / QR / archivo para
// compartir → verify.html la comprueba (válida, caducada, revocada, alterada).
// El sello público es un extra de pago (pay-seal → anchor-credential): entra en
// el lote diario que anchor-batch publica en una red pública. En la tarjeta va
// pequeño y plegado (docs/plan_post_reunion/03 §5.1).
// ═══════════════════════════════════════════════════════════════════════════
const SkillPass={
  cred:null,   // { credentialId, vc, verifyUrl, validUntil, firmada, revocada, sello }

  _fecha(d){return d?new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}):'';},

  _status(kind,html){
    const el=document.getElementById('spChainStatus'); if(!el)return;
    const cls={info:'vf-neutro',warn:'vf-aviso',ok:'vf-ok',error:'vf-error'}[kind]||'vf-neutro';
    el.className='vf-estado '+cls+' u-mt-14';
    el.style.display='block';
    el.innerHTML=html;
  },

  // Los errores del servidor llegan como {error, details}: se muestran los dos.
  _statusError(prefix,r){
    SkillPass._status('error','<strong>'+escHtml(prefix)+'</strong>'+
      ((r&&r.error)?': '+escHtml(r.error):'')+
      ((r&&r.details)?'<br><span class="u-op-_75">'+escHtml(r.details)+'</span>':''));
  },

  _busy(on,label){
    const b=document.getElementById('spChainBtn'); if(!b)return;
    b.disabled=on; b.setAttribute('aria-busy',on?'true':'false');
    if(label)b.textContent=label;
  },

  shareUrl(){
    const c=SkillPass.cred; if(!c)return '';
    return c.verifyUrl||((location.origin||'')+'/verify.html?c='+encodeURIComponent(c.credentialId));
  },

  /** Skills de la credencial (v2: banda; v1: nota → banda). */
  _skills(c){
    const vc=c.vc||c.cvJson||{};
    if(vc.credentialSubject&&Array.isArray(vc.credentialSubject.skills))return vc.credentialSubject.skills;
    return (vc.skills||c.skills||[]).map(s=>({skill:s.skill,banda:tpBanda(s.score).txt,verificada:!!s.verified}));
  },

  _chip(s){
    const ids={'Insuficiente':'insuficiente','Aceptable':'aceptable','Bueno':'bueno','Muy bueno':'muy_bueno'};
    return '<div class="sp-pass-chip"><div class="sp-pass-chip-top"><span>'+escHtml(typeof tpSkillNombre==='function'?tpSkillNombre(s.skill):s.skill)+'</span></div>'+
      '<span class="tp-banda tp-banda-'+(ids[s.banda]||'insuficiente')+'"><span class="tp-banda-seg" aria-hidden="true">'+'<i></i>'.repeat(4)+'</span><span class="tp-banda-txt">'+escHtml(s.banda||'')+'</span></span>'+
      (s.verificada?'<div class="sp-pass-lvl">Nota verificada</div>':'')+'</div>';
  },

  // QR dibujado en el navegador. Antes se pedía a api.qrserver.com, lo que
  // enviaba el identificador de cada credencial a un tercero en cada render.
  _qrHtml(url){
    if(!url)return '';
    try{
      return '<div class="sp-pass-qr">'+TPQr.svg(url,{fg:'#06281f',bg:'#ffffff',quiet:2,label:'Código QR para verificar este SkillPass'})+'</div>';
    }catch(e){ console.warn('[TP] QR',e); return ''; }
  },

  cardHtml(c, opts){
    opts=opts||{};
    const skills=SkillPass._skills(c);
    const url=opts.url||SkillPass.shareUrl();
    const sello=(c.sello&&c.sello.estado==='sellado');
    return '<div class="sp-pass-wrap"><div class="sp-pass">'+
      '<div class="sp-pass-top"><div><div class="sp-pass-kicker">TalentPact · credencial verificable</div>'+
      '<div class="sp-pass-brand">talent<span>pact</span></div>'+
      '<h3>SkillPass</h3>'+
      '<p class="sp-pass-lead">Habilidades demostradas y verificables. Cualquier empresa lo comprueba con el enlace o el QR.</p></div>'+
      '<div class="sp-pass-seal"><i>Firmado<br>TalentPact</i></div></div>'+
      '<div class="sp-pass-chips">'+(skills.map(SkillPass._chip).join('')||'<div class="sp-pass-chip">Sin skills</div>')+'</div>'+
      '<div class="sp-pass-foot"><div class="sp-pass-meta">'+
      '<div>'+(c.revocada?'Revocado':(c.firmada===false?'Emitido por TalentPact':'Firmado por TalentPact'))+'</div>'+
      (c.validUntil?'<div>Válido hasta · '+escHtml(SkillPass._fecha(c.validUntil))+'</div>':'')+
      (sello?'<div>Sello público · '+escHtml(SkillPass._fecha(c.sello.fecha))+'</div>':'')+
      (c.credentialId?'<div>Código · '+escHtml(c.credentialId)+'</div>':'')+
      '</div>'+(c.revocada?'':SkillPass._qrHtml(url))+'</div></div></div>';
  },

  _render(){
    const c=SkillPass.cred; if(!c)return;
    const box=document.getElementById('spChainResult');
    if(box){ box.style.display='block'; box.innerHTML=SkillPass.cardHtml(c); }
    ['spChainDownload','spChainPdf','spChainShare'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=c.revocada?'none':'inline-flex';});
    SkillPass._renderSello();
  },

  _guardar(r){
    SkillPass.cred={credentialId:r.credentialId,vc:r.vc||r.cvJson,verifyUrl:r.verifyUrl,validUntil:r.validUntil,
      firmada:r.firmada!==false,revocada:!!r.revocada,sello:r.sello||{estado:'no'}};
    SkillPass._render();
  },

  // Emitir es gratis: la credencial queda firmada por TalentPact y cualquiera la
  // comprueba con el enlace o el QR. El sello público es un extra de pago.
  async generate(){
    const unlocked=Object.values(candidateProfile.skills||{}).filter(s=>s&&s.unlocked).length;
    if(!unlocked){
      SkillPass._status('info','Aún no tienes ninguna skill demostrada. Completa al menos un reto y vuelve aquí para emitir tu SkillPass.');
      return null;
    }
    let user=null;
    try{ user=await TPCloud.currentUser(); }catch(e){}
    if(!user){
      SkillPass._status('info','Necesitas iniciar sesión: la credencial se emite sobre las evaluaciones guardadas en tu cuenta, no sobre el progreso de este navegador.');
      return null;
    }
    try{
      SkillPass._busy(true,'Emitiendo…');
      const issued=await TPCloud._postAuth('issue-credential',{});
      if(issued.error){ SkillPass._statusError('No se pudo emitir el SkillPass',issued); return null; }
      SkillPass._guardar(issued);
      if(issued.aviso)SkillPass._status('warn',escHtml(issued.aviso));
      else SkillPass._status('ok',issued.reused?'Tu SkillPass sigue al día: tus skills no han cambiado desde la última vez.':'Tu SkillPass está listo. Compártelo con el enlace o el QR: cualquier empresa lo comprueba gratis.');
      return issued;
    }catch(e){
      SkillPass._status('error','Error de red al emitir el SkillPass: '+escHtml(e.message||String(e)));
      return null;
    }finally{
      SkillPass._busy(false,'Actualizar mi SkillPass');
    }
  },

  /** Con el sello pagado, pide entrar en el lote de esta noche. */
  async _anclar(credentialId){
    try{
      const res=await TPCloud._postAuth('anchor-credential',{credentialId});
      if(res.error){
        if(res.code==='sello_no_pagado')SkillPass._status('info','El sello público es un extra de '+escHtml(res.precio||'4,99 €')+'. Puedes añadirlo al final de la tarjeta.');
        else SkillPass._statusError('No se pudo pedir el sello',res);
        return res;
      }
      if(SkillPass.cred&&res.sello)SkillPass.cred.sello=res.sello;
      SkillPass._render();
      SkillPass._status('ok',res.sello&&res.sello.estado==='sellado'?'Tu SkillPass ya tiene sello público.':'Pago recibido. Tu SkillPass se publica en el lote de esta noche; no tienes que hacer nada más.');
      return res;
    }catch(e){
      SkillPass._status('error','Error de red al pedir el sello: '+escHtml(e.message||String(e)));
      return null;
    }
  },

  /** «Añadir sello»: explica qué aporta, cobra con Stripe y, pagado, lo pone en la cola. */
  async sellar(){
    if(!SkillPass.cred){ const r=await SkillPass.generate(); if(!r)return; }
    const c=SkillPass.cred;
    if(c.revocada||(c.sello&&c.sello.estado!=='no'))return;
    const si=await tpConfirmar({titulo:'Sello público',
      texto:'Tu SkillPass ya es verificable en TalentPact, gratis. El sello publica su huella con fecha en una red pública: se podrá comprobar incluso sin TalentPact y nadie podrá cambiarla después. Se publica en el lote de cada noche. En la red solo va una huella sin datos personales; si borras tu cuenta, deja de poder vincularse a ti.',
      si:'Pagar 4,99 €',no:'Ahora no'});
    if(!si)return;
    const r=await TPCloud._postAuth('pay-seal',{accion:'pagar',credentialId:c.credentialId,returnUrl:location.origin+location.pathname});
    if(!r||r.error){ SkillPass._statusError('No se pudo iniciar el pago',r||{}); return; }
    if(r.yaSellado||r.pagado){ await SkillPass._anclar(c.credentialId); return; }
    if(r.url)location.href=r.url;
  },

  /** Vuelta de Stripe: ?sello=ok&session_id=… o ?sello=cancelado. */
  async volverDePago(){
    const qs=new URLSearchParams(location.search);
    const estado=qs.get('sello');if(!estado)return;
    const sid=qs.get('session_id')||'';
    try{const u=new URL(location.href);['sello','session_id'].forEach(k=>u.searchParams.delete(k));history.replaceState({},document.title,u.pathname+(u.search||''));}catch(e){}
    if(!tpUser)return;
    if(typeof openDashCand==='function')openDashCand();
    if(typeof switchCandTab==='function')switchCandTab('profile');
    if(estado!=='ok'){ SkillPass._status('info','Pago cancelado. No se ha cobrado nada; tu SkillPass sigue siendo verificable en TalentPact.'); return; }
    const r=await TPCloud._postAuth('pay-seal',{accion:'confirmar',sessionId:sid});
    if(!r||r.error||!r.pagado){ SkillPass._status('warn','Stripe aún no confirma el pago. En cuanto lo haga, tu SkillPass entrará solo en el lote del sello.'); return; }
    const issued=await SkillPass.generate();
    if(issued)await SkillPass._anclar(SkillPass.cred.credentialId);
  },

  /** Retira el SkillPass: las empresas lo verán como revocado. No se deshace. */
  async revocar(){
    const c=SkillPass.cred;if(!c||c.revocada)return;
    const si=await tpConfirmar({titulo:'Retirar este SkillPass',
      texto:'Quien lo compruebe verá que está revocado. No se puede deshacer; podrás emitir uno nuevo cuando quieras.',si:'Retirar',no:'Cancelar'});
    if(!si)return;
    const r=await TPCloud._postAuth('revoke-credential',{credentialId:c.credentialId});
    if(!r||r.error){SkillPass._statusError('No se pudo retirar',r||{});return;}
    c.revocada=true;SkillPass._render();
    SkillPass._status('info','SkillPass retirado. Pulsa «Actualizar mi SkillPass» para emitir uno nuevo.');
  },

  /** Dos líneas pequeñas bajo la tarjeta: firma y vigencia; sello público plegado. */
  _renderSello(){
    const box=document.getElementById('spSelloLinea');if(!box)return;
    const c=SkillPass.cred;
    if(!c){box.innerHTML='';return;}
    if(c.revocada){box.innerHTML='<div class="sp-sello">Revocado. Las empresas que lo comprueben verán que lo has retirado.</div>';return;}
    const s=c.sello||{estado:'no'};
    let h='<div class="sp-sello">'+(c.firmada?'Firmado por TalentPact':'Emitido por TalentPact')+(c.validUntil?' · válido hasta '+escHtml(SkillPass._fecha(c.validUntil)):'')+
      ' · <button type="button" class="pj-enlace" onclick="SkillPass.copyLink()">Copiar enlace</button></div>';
    if(s.estado==='no')h+='<div class="sp-sello">Sello público: no · <button type="button" class="pj-enlace" onclick="SkillPass.sellar()">Añadir sello (4,99 €)</button></div>';
    else if(s.estado==='en_cola')h+='<div class="sp-sello">Sello público: pagado · se publica en el lote de esta noche</div>';
    else h+='<details class="sp-sello"><summary>Sello público: '+(s.estado==='sellado'?escHtml(SkillPass._fecha(s.fecha)||'publicado'):'enviado, pendiente de confirmar')+' · Ver detalles</summary>'+
      '<div>Red: '+escHtml(s.red||'')+(s.lote?' · Lote '+escHtml(s.lote):'')+(s.txHash?' · <a href="'+escHtml(s.explorerUrl||'#')+'" target="_blank" rel="noopener">transacción '+escHtml(s.txHash.slice(0,10))+'…</a>':'')+
      '<br><a href="'+escHtml(SkillPass.shareUrl())+'" target="_blank" rel="noopener">Cómo comprobarlo por tu cuenta</a></div></details>';
    h+='<div class="sp-sello"><button type="button" class="pj-enlace" onclick="SkillPass.revocar()">Retirar este SkillPass</button></div>';
    box.innerHTML=h;
  },

  download(){
    const c=SkillPass.cred; if(!c||!c.vc)return;
    const blob=new Blob([JSON.stringify(c.vc,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='skillpass-'+String(c.credentialId||'').slice(0,8)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },

  copyLink(){
    const url=SkillPass.shareUrl(); if(!url)return;
    const done=()=>SkillPass._status('ok','Enlace copiado. Cualquiera puede abrirlo y verificar tu SkillPass, sin cuenta en TalentPact.<br><code class="u-fs-micro u-wb-break-all">'+escHtml(url)+'</code>');
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done).catch(()=>{ prompt('Copia este enlace:',url); done(); });
    }else{ prompt('Copia este enlace:',url); done(); }
  },

  pdf(){
    const c=SkillPass.cred; if(!c||!c.vc)return;
    const w=window.open('','_blank');
    if(!w){toast('Permite las ventanas emergentes para generar el PDF.');return;}
    const card=SkillPass.cardHtml(c);
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SkillPass TalentPact</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><link rel="stylesheet" href="'+location.origin+'/assets/css/tokens.css"><link rel="stylesheet" href="'+location.origin+'/assets/css/componentes.css"><style>@page{size:A4;margin:12mm}body{margin:0;background:#f1f5f9;font-family:system-ui,sans-serif;padding:20px}'+
      '.sp-pass-wrap{margin:0 auto;max-width:720px;border-radius:20px;overflow:hidden;border:1px solid #12382c}'+
      '.sp-pass{background:radial-gradient(1200px 280px at 10% -20%,rgba(52,211,153,.28),transparent 55%),linear-gradient(165deg,#06281f 0%,#0b3d30 42%,#0f172a 100%);color:#ecfdf5;padding:28px 26px 22px;position:relative}'+
      '.sp-pass::after{content:"";position:absolute;inset:10px;border:1px solid rgba(167,243,208,.18);border-radius:14px;pointer-events:none}'+
      '.sp-pass-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:18px;position:relative;z-index:1}'+
      '.sp-pass-brand{font-family:Inter,sans-serif;font-weight:800;font-size:18px}.sp-pass-brand span{color:#34d399}'+
      '.sp-pass-seal{width:78px;height:78px;border-radius:50%;background:conic-gradient(from 210deg,#34d399,#059669,#a7f3d0,#34d399);display:flex;align-items:center;justify-content:center}'+
      '.sp-pass-seal.pending{background:conic-gradient(from 210deg,#fbbf24,#d97706,#fde68a,#fbbf24)}'+
      '.sp-pass-seal i{width:62px;height:62px;border-radius:50%;background:#06281f;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#a7f3d0;text-align:center;line-height:1.15;font-style:normal;font-family:Inter,sans-serif}'+
      '.sp-pass h3{font-family:Inter,sans-serif;font-size:28px;margin:4px 0}.sp-pass-kicker{font-size:11px;color:#a7f3d0;letter-spacing:.14em;text-transform:uppercase;font-weight:700}'+
      '.sp-pass-lead{font-size:13px;color:#cbd5e1;max-width:420px;line-height:1.5}'+
      '.sp-pass-chips{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0;position:relative;z-index:1}'+
      '.sp-pass-chip{background:rgba(255,255,255,.06);border:1px solid rgba(167,243,208,.16);border-radius:12px;padding:10px 12px}'+
      '.sp-pass-chip-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}'+
      '.sp-pass-chip .tp-banda-txt{color:#ecfdf5}'+
      '.sp-pass-bar{height:5px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden}'+
      '.sp-pass-bar i{display:block;height:100%;background:#34d399}'+
      '.sp-pass-lvl{font-size:10px;color:#94a3b8;margin-top:5px;text-transform:uppercase}'+
      '.sp-pass-foot{display:flex;gap:16px;justify-content:space-between;align-items:flex-end;position:relative;z-index:1;border-top:1px solid rgba(167,243,208,.12);padding-top:10px}'+
      '.sp-pass-meta{font-family:"JetBrains Mono",monospace;font-size:10px;color:#86efac;line-height:1.55;word-break:break-all}'+
      '.sp-pass-meta a{color:#6ee7b7}'+
      '.sp-pass-qr{width:96px;height:96px;border-radius:10px;background:#fff;padding:6px;box-sizing:border-box}'+
      '.sp-pass-qr svg{display:block;width:100%;height:100%}'+
      '.hint{text-align:center;margin-top:16px;font-size:12px;color:#64748b}'+
      '@media print{button,.hint{display:none}body{background:#fff;padding:0}}</style></head><body>'+
      card+'<p class="hint">En el diálogo elige <strong>Guardar como PDF</strong>.</p>'+
      '<div class="hint"><button onclick="window.print()" class="u-p-10-18 u-b-0 u-r-10 u-bg-emerald-600 u-c-sobre-tinta u-fw-700 u-cur-pointer">Guardar como PDF</button></div>'+
      '<script>setTimeout(function(){window.print();},500);<\/script></body></html>');
    w.document.close();
  }
};
function generateSkillPass(){return SkillPass.generate();}
function downloadSkillPass(){return SkillPass.download();}
function downloadSkillPassPdf(){return SkillPass.pdf();}
function copySkillPassLink(){return SkillPass.copyLink();}

// Escapa texto para insertarlo de forma segura en HTML (respuestas de candidatos).
function escHtml(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// Registra una evaluación en el audit trail persistente (respuesta + feedback completo).
// Coste por evaluación IA. Si la API no devolvió `usage` se usa el valor medio
// medido en la PoC (Entrega 2): $0,0180 -> ~€0,0165 al tipo declarado.
function recordEval(ex,score,aiPowered,response,feedback){
  try{
    const fb=feedback||{};
    const cost=(fb&&typeof fb.costEUR==='number')?fb.costEUR:(aiPowered?0.0165:0);
    TP.logEval({
      job:(activeJob&&activeJob.title)||'—',
      sector:(activeJob&&activeJob.sector)||'—',
      exTitle:(ex&&ex.title)||'—',
      type:(ex&&ex.type)||'—',
      score:Math.round(score||0),
      aiPowered:!!aiPowered,
      estCost:cost,
      estCostUSD:(fb&&typeof fb.costUSD==='number')?fb.costUSD:null,
      costReal:(fb&&typeof fb.costEUR==='number'),
      tokensIn:(fb&&fb.tokensIn)||null,
      tokensOut:(fb&&fb.tokensOut)||null,
      response:(response||'').toString().slice(0,4000),
      criteria:Array.isArray(fb.criteria)?fb.criteria.map(c=>({name:c.name,score:c.score,comment:c.comment})):[],
      overall:fb.overall||''
    });
  }catch(e){/* nunca bloquear la evaluación por un fallo de logging */}
}

// Upsert del perfil propio en el pool de talento anónimo visible para empresas.
// Convierte las skills desbloqueadas del candidato en una entrada real del pool.
// El pool de talento vive en Supabase (get-talent-pool): ya no hay una ficha
// local "Tu perfil" mezclada con la de las empresas. Se mantiene la función
// porque varias vistas la llaman tras guardar progreso o preferencias; solo
// limpia entradas locales de versiones anteriores.
function syncMyPoolEntry(){
  for(let k=CANDIDATES.length-1;k>=0;k--)if(CANDIDATES[k]._dynamic||CANDIDATES[k].id==='me')CANDIDATES.splice(k,1);
  try{localStorage.removeItem(TP_NS+'pool');}catch(e){}
}

// Rehidratar el estado persistido al cargar la app (perfil, pool, desbloqueos, ofertas)
TP.hydrate();

// Vuelta de Stripe Checkout. Se ejecuta despues de que la app este montada, y
// se traga cualquier error: un fallo aqui no debe impedir que cargue la web.
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    try{ handlePaymentReturn(); }catch(e){ console.warn('[TP] retorno de pago',e); }
  },400);
});

// Proveedores sociales soportados: etiqueta visible e id del botón en cada portal.
const OAUTH_LABEL={google:'Google',linkedin_oidc:'LinkedIn'};
const OAUTH_BTN={
  candidate:{google:'btnGoogleAuth',linkedin_oidc:'btnLinkedinAuth'},
  empresa:{google:'btnGoogleEmp',linkedin_oidc:'btnLinkedinEmp'}
};
// Cajas de mensaje inline (una por formulario) que sustituyen a los alert().
const AUTH_MSG_BOX={candidate:'candAuthMsg',empresa:'empAuthMsg',candReg:'candRegMsg',empReg:'empRegMsg',candRec:'candRecMsg',empRec:'empRecMsg',rec:'recMsg'};

// Arranque de sesión. Cubre dos casos:
//  a) vuelta de un login social: la URL trae ?code=… (PKCE) o #access_token y
//     supabase-js ya ha canjeado la sesión → limpiamos la URL y abrimos el panel.
//  b) sesión previa guardada: restauramos usuario y progreso desde la nube.
// Se invoca desde 99-arranque.js, cuando ya están cargados todos los
// ficheros: el arranque llama a funciones de acceso y de paneles.
async function tpArrancarSesion(){
  const qs=new URLSearchParams(window.location.search);
  const hs=new URLSearchParams((window.location.hash||'').replace(/^#/,''));
  const oauthErr=qs.get('error_description')||qs.get('error')||hs.get('error_description')||hs.get('error');
  const backFromOAuth=!!(qs.get('code')||hs.get('access_token')||oauthErr);

  // Vuelta del enlace de recuperación. Supabase ya ha canjeado una sesión
  // temporal, pero NO se abre ningún panel: primero hay que fijar la contraseña
  // nueva. El marcador va en la URL (?tp=recovery) y no en sessionStorage,
  // porque el enlace se abre desde el correo, a menudo en otro navegador.
  if(!oauthErr&&(qs.get('tp')==='recovery'||hs.get('type')==='recovery')){
    await openRecoveryScreen();
    return;
  }
  let pending=null;
  try{ pending=sessionStorage.getItem('tp_oauth_pending'); sessionStorage.removeItem('tp_oauth_pending'); }catch(e){}

  if(oauthErr){
    cleanAuthUrl();
    const portal=pending==='empresa'?'empresa':'candidate';
    openAuth(portal);
    authMsg('err','No se pudo completar el acceso: '+oauthErr,portal);
    return;
  }
  try{
    const u=await TPCloud.currentUser();
    if(!u)return;
    if(backFromOAuth)cleanAuthUrl();
    // El rol puede venir del registro o, en un login social, de la intención
    // guardada antes de salir a Google (sessionStorage 'tp_oauth_pending').
    let role=(u.user_metadata||{}).role;
    if(!role&&pending){ role=pending; await TPCloud.setRole(role); }
    // Entró por el portal que no es el suyo: se abre su panel, pero diciéndolo.
    else if(pending&&role&&role!==pending&&typeof toast==='function'){
      toast(role==='empresa'?'Esa cuenta es de empresa: te llevamos a tu panel de empresa.':'Esa cuenta es de candidato: te llevamos a tu panel de candidato.');
    }

    if(role==='empresa'){
      tpCompany=u;
      if(backFromOAuth||pending){ closeAuth('authEmpresa'); openDashEmp(); }
      return;
    }
    tpUser=u;
    if(backFromOAuth||pending)await TPCloud.syncOAuthProfile(u);
    await TPCloud.loadProgressIntoProfile(u);
    if(backFromOAuth||pending){ closeAuth('authCandidate'); openDashCand(); }
  }catch(e){ console.warn('[TP] restaurar sesión',e); }
}

