// TalentPact · 06-skillpass-y-sesion
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// SkillPass — credencial verificable anclada en blockchain (Ethereum Sepolia)
// Flujo: issue-credential (compone el CV + hash) → anchor-credential (tx on-chain)
// On-chain solo viaja el hash; el CV completo vive off-chain en Supabase (RGPD).
//
// El sellado no es instantáneo: un bloque de Sepolia tarda ~12 s y Netlify corta
// las funciones síncronas, así que el servidor responde `pending` en cuanto difunde
// la transacción y aquí se consulta hasta que la red la confirma. El txHash es
// válido y enlazable desde el primer segundo.
// ═══════════════════════════════════════════════════════════════════════════
const SkillPass={
  cred:null,   // { credentialId, cvJson, cvHash, txHash, blockNumber, anchoredAt, pending }
  chain:{name:'Ethereum Sepolia',explorer:'https://sepolia.etherscan.io',contractUrl:null},
  POLL_MS:5000,
  POLL_TRIES:18,   // ~90 s: margen de sobra para uno o dos bloques de Sepolia

  txUrl(h){ return h?(SkillPass.chain.explorer+'/tx/'+encodeURIComponent(h)):''; },

  // El servidor es la fuente de verdad sobre la red: si mañana se cambia de
  // cadena, la interfaz lo refleja sin tocar este archivo.
  _learnChain(r){
    if(!r)return;
    if(r.chainName)SkillPass.chain.name=r.chainName;
    if(r.contractUrl)SkillPass.chain.contractUrl=r.contractUrl;
    if(r.explorerUrl){ const m=/^(https?:\/\/[^/]+)/.exec(r.explorerUrl); if(m)SkillPass.chain.explorer=m[1]; }
  },

  _status(kind,html){
    const el=document.getElementById('spChainStatus'); if(!el)return;
    const styles={
      info:{bg:'var(--slate-50)',fg:'var(--slate-700)',bd:'var(--slate-200)'},
      warn:{bg:'#fffbeb',fg:'#b45309',bd:'#fde68a'},
      ok:{bg:'var(--emerald-50)',fg:'var(--emerald-600)',bd:'var(--emerald-100)'},
      error:{bg:'#fef2f2',fg:'#b91c1c',bd:'#fecaca'}
    };
    const st=styles[kind]||styles.info;
    el.style.display='block';
    el.style.background=st.bg; el.style.color=st.fg; el.style.border='1px solid '+st.bd;
    el.innerHTML=html;
  },

  // Los errores del servidor llegan como {error, details}: se muestran los dos,
  // porque el `details` es justo lo que dice qué variable falta o qué revirtió.
  _statusError(prefix,r){
    SkillPass._status('error','<strong>'+escHtml(prefix)+'</strong>'+
      ((r&&r.error)?': '+escHtml(r.error):'')+
      ((r&&r.details)?'<br><span class="u-op-_75">'+escHtml(r.details)+'</span>':''));
  },

  _busy(on,label){
    const b=document.getElementById('spChainBtn'); if(!b)return;
    b.disabled=on; b.style.opacity=on?'.6':''; b.style.cursor=on?'wait':'';
    if(label)b.textContent=label;
  },

  shareUrl(){
    const c=SkillPass.cred; if(!c||!c.cvHash)return '';
    return (location.origin||'')+'/verify.html?h='+encodeURIComponent(c.cvHash);
  },

  _txLine(){
    const c=SkillPass.cred;
    if(!c||!c.txHash)return '';
    return ' (<a href="'+SkillPass.txUrl(c.txHash)+'" target="_blank" rel="noopener">ver la transacción</a>)';
  },

  _chip(s){
    const n=Number(s.score)||0;
    const cls=n>=75?'high':n>=50?'mid':'low';
    const lvl=n>=75?'Avanzado':n>=50?'Intermedio':'En progreso';
    return '<div class="sp-pass-chip"><div class="sp-pass-chip-top"><span>'+escHtml(s.skill||'')+'</span><strong class="'+cls+'">'+n+'</strong></div><div class="sp-pass-bar"><i class="'+cls+'" style="width:'+Math.max(6,Math.min(100,n))+'%"></i></div><div class="sp-pass-lvl">'+lvl+'</div></div>';
  },

  // QR dibujado en el navegador. Antes se pedía a api.qrserver.com, lo que
  // enviaba el hash de cada credencial a un tercero en cada render.
  _qrHtml(url){
    if(!url)return '';
    try{
      return '<div class="sp-pass-qr">'+TPQr.svg(url,{fg:'#06281f',bg:'#ffffff',quiet:2,label:'Código QR para verificar este SkillPass'})+'</div>';
    }catch(e){ console.warn('[TP] QR',e); return ''; }
  },

  cardHtml(c, opts){
    opts=opts||{};
    const skills=(c.cvJson&&c.cvJson.skills)||c.skills||[];
    const url=opts.url||(c.cvHash?((location.origin||'')+'/verify.html?h='+encodeURIComponent(c.cvHash)):'');
    const fecha=c.anchoredAt?new Date(c.anchoredAt).toLocaleString('es-ES'):'';
    const pending=!!c.pending&&!c.anchoredAt;
    // Solo se declara sellado cuando la cadena lo confirma: tener txHash
    // difundido todavía no es una garantía.
    const sealed=!pending&&!!(c.anchoredAt||opts.verified);
    const sealTxt=sealed?'Sellado<br>blockchain':(pending?'Sellado<br>en curso':'Firmado<br>TalentPact');
    const lead=sealed
      ? 'Habilidades demostradas y selladas en blockchain. Comprobable incluso sin TalentPact.'
      : (pending?'Transacción enviada a la red. El sello queda firme en cuanto se confirme el bloque.'
               :'Habilidades demostradas en retos reales. Cualquier empresa lo comprueba con el enlace o el QR.');
    return '<div class="sp-pass-wrap"><div class="sp-pass">'+
      '<div class="sp-pass-top"><div><div class="sp-pass-kicker">TalentPact · verifiable credential</div>'+
      '<div class="sp-pass-brand">talent<span>pact</span></div>'+
      '<h3>SkillPass</h3>'+
      '<p class="sp-pass-lead">'+lead+'</p></div>'+
      '<div class="sp-pass-seal'+(pending?' pending':'')+'"><i>'+sealTxt+'</i></div></div>'+
      '<div class="sp-pass-chips">'+(skills.map(SkillPass._chip).join('')||'<div class="sp-pass-chip">Sin skills</div>')+'</div>'+
      '<div class="sp-pass-foot"><div class="sp-pass-meta">'+
      (sealed||pending?'<div>Red · '+escHtml(SkillPass.chain.name)+'</div>':'<div>Emitido por TalentPact</div>')+
      (fecha?'<div>Anclado · '+escHtml(fecha)+'</div>':'')+
      (c.blockNumber?'<div>Bloque · '+escHtml(String(c.blockNumber))+'</div>':'')+
      (c.cvHash?'<div>Hash · '+escHtml(c.cvHash)+'</div>':'')+
      (c.txHash?'<div>Tx · <a href="'+SkillPass.txUrl(c.txHash)+'" target="_blank" rel="noopener">'+escHtml(c.txHash.slice(0,20))+'…</a></div>':'')+
      '</div>'+SkillPass._qrHtml(url)+'</div></div></div>';
  },

  _render(){
    const c=SkillPass.cred; if(!c)return;
    const box=document.getElementById('spChainResult');
    if(box){ box.style.display='block'; box.innerHTML=SkillPass.cardHtml(c,{url:SkillPass.shareUrl()}); }
    const dl=document.getElementById('spChainDownload'); if(dl)dl.style.display='inline-flex';
    const pdf=document.getElementById('spChainPdf'); if(pdf)pdf.style.display='inline-flex';
    const sh=document.getElementById('spChainShare'); if(sh)sh.style.display='inline-flex';
    SkillPass._renderSello();
  },

  /** Vuelca en la credencial lo que acaba de decir el servidor y repinta. */
  _apply(r){
    const c=SkillPass.cred; if(!c||!r)return;
    if(r.txHash)c.txHash=r.txHash;
    if(r.blockNumber!=null)c.blockNumber=r.blockNumber;
    if(r.anchoredAt)c.anchoredAt=r.anchoredAt;
    c.pending=!!r.pending;
    SkillPass._learnChain(r);
    SkillPass._render();
  },

  /**
   * Consulta hasta que la red confirme. Cada llamada a anchor-credential con la
   * misma credencial es idempotente: si ya hay transacción difundida, recoge su
   * recibo en vez de enviar otra (y de gastar gas otra vez).
   */
  async _awaitConfirmation(credentialId){
    for(let i=0;i<SkillPass.POLL_TRIES;i++){
      await new Promise(r=>setTimeout(r,SkillPass.POLL_MS));
      const r=await TPCloud._postAuth('anchor-credential',{credentialId});
      if(r&&r.error)return r;
      SkillPass._apply(r);
      if(r&&!r.pending)return r;
      SkillPass._status('warn','② Transacción en la red'+SkillPass._txLine()+
        '. Esperando confirmación… ('+((i+1)*SkillPass.POLL_MS/1000)+' s)');
    }
    return null;
  },

  // Emitir es gratis: la credencial queda firmada por TalentPact y cualquiera la
  // comprueba con el enlace o el QR. El sello en blockchain es un extra de pago
  // (sellar()), que se ofrece pequeño al final de la tarjeta.
  async generate(){
    const unlocked=Object.values(candidateProfile.skills||{}).filter(s=>s&&s.unlocked).length;
    if(!unlocked){
      SkillPass._status('info','Aún no tienes ninguna skill validada. Completa al menos un reto y vuelve aquí para emitir tu SkillPass.');
      return null;
    }
    let user=null;
    try{ user=await TPCloud.currentUser(); }catch(e){}
    if(!user){
      SkillPass._status('info','Necesitas iniciar sesión: la credencial se emite sobre las evaluaciones guardadas en tu cuenta, no sobre el progreso local de este navegador.');
      return null;
    }
    try{
      SkillPass._busy(true,'Emitiendo…');
      // Sin userId: el servidor lo deduce del token de sesión.
      const issued=await TPCloud._postAuth('issue-credential',{});
      if(issued.error){ SkillPass._statusError('No se pudo emitir la credencial',issued); return null; }
      SkillPass._learnChain(issued);
      SkillPass.cred={credentialId:issued.credentialId,cvJson:issued.cvJson,cvHash:issued.cvHash,
                      txHash:issued.txHash||null,blockNumber:issued.blockNumber||null,
                      anchoredAt:issued.anchoredAt||null,pending:!!issued.pending};
      SkillPass._render();
      if(issued.pending){ await SkillPass._anclar(issued.credentialId,true); return issued; }
      SkillPass._status('ok','Tu SkillPass está listo. Compártelo con el enlace o el QR: cualquier empresa lo comprueba en TalentPact, gratis.');
      return issued;
    }catch(e){
      SkillPass._status('error','Error de red al emitir la credencial: '+escHtml(e.message||String(e)));
      return null;
    }finally{
      SkillPass._busy(false,'Actualizar mi SkillPass');
    }
  },

  /** Ancla la credencial ya pagada (o recoge el recibo de un anclaje en curso). */
  async _anclar(credentialId,yaEnCurso){
    try{
      let res;
      if(yaEnCurso){
        SkillPass._status('warn','Ya había un sellado en curso'+SkillPass._txLine()+'. Esperando a que la red lo confirme…');
        res={pending:true};
      }else{
        SkillPass._status('info','Sellando en '+escHtml(SkillPass.chain.name)+'…');
        res=await TPCloud._postAuth('anchor-credential',{credentialId});
        if(res.error){
          if(res.code==='sello_no_pagado')SkillPass._status('info','El sello público es un extra de '+escHtml(res.precio||'4,99 €')+'. Puedes añadirlo al final de la tarjeta.');
          else SkillPass._statusError('No se pudo sellar',res);
          return res;
        }
        SkillPass._apply(res);
      }
      if(res.pending){
        const done=await SkillPass._awaitConfirmation(credentialId);
        if(done&&done.error){ SkillPass._statusError('La transacción se envió, pero la confirmación falló',done); return done; }
        if(!done){ SkillPass._status('warn','Sello enviado'+SkillPass._txLine()+'. La red aún no lo ha confirmado: vuelve en un minuto, no se cobra de nuevo.'); return null; }
        res=done;
      }
      SkillPass._status('ok','SkillPass sellado en blockchain'+SkillPass._txLine()+'. Ya se puede comprobar incluso sin TalentPact.');
      return res;
    }catch(e){
      SkillPass._status('error','Error de red al sellar: '+escHtml(e.message||String(e)));
      return null;
    }finally{ SkillPass._renderSello(); }
  },

  /** «Añadir sello»: explica qué aporta, cobra con Stripe y, pagado, sella. */
  async sellar(){
    const c=SkillPass.cred;
    if(!c){ const r=await SkillPass.generate(); if(!r)return; }
    if(SkillPass.cred.anchoredAt)return;
    const si=await tpConfirmar({titulo:'Sello público en blockchain',
      texto:'Tu SkillPass ya es verificable en TalentPact, gratis. El sello publica su huella en una blockchain pública con fecha: cualquiera puede comprobarlo incluso sin TalentPact y nadie puede cambiarlo después. Pago único por esta versión de tu SkillPass. Tus datos personales no salen de TalentPact: en la cadena solo va una huella.',
      si:'Pagar 4,99 € y sellar',no:'Ahora no'});
    if(!si)return;
    const r=await TPCloud._postAuth('pay-seal',{accion:'pagar',credentialId:SkillPass.cred.credentialId,returnUrl:location.origin+location.pathname});
    if(!r||r.error){ SkillPass._statusError('No se pudo iniciar el pago',r||{}); return; }
    if(r.yaSellado||r.pagado){ await SkillPass._anclar(SkillPass.cred.credentialId); return; }
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
    if(typeof switchCandTab==='function'){const t=[...document.querySelectorAll('#candDashTabs .dash-tab')].find(b=>/perfil|skills/i.test(b.textContent));if(t)switchCandTab('profile',t);}
    if(estado!=='ok'){ SkillPass._status('info','Pago cancelado. No se ha cobrado nada; tu SkillPass sigue siendo verificable en TalentPact.'); return; }
    const r=await TPCloud._postAuth('pay-seal',{accion:'confirmar',sessionId:sid});
    if(!r||r.error||!r.pagado){ SkillPass._status('warn','Stripe aún no confirma el pago. En cuanto lo haga, podrás sellar desde aquí sin pagar de nuevo.'); return; }
    const issued=await SkillPass.generate();
    if(issued&&!SkillPass.cred.anchoredAt)await SkillPass._anclar(SkillPass.cred.credentialId);
  },

  /** Línea pequeña al final de la tarjeta: el sello es un extra, no lo principal. */
  _renderSello(){
    const box=document.getElementById('spSelloLinea');if(!box)return;
    const c=SkillPass.cred;
    if(!c){box.innerHTML='';return;}
    if(c.anchoredAt){
      box.innerHTML='<details class="sp-sello"><summary>Sello público en blockchain · '+escHtml(new Date(c.anchoredAt).toLocaleDateString('es-ES'))+'</summary>'+
        '<div>Red: '+escHtml(SkillPass.chain.name)+(c.blockNumber?' · bloque '+escHtml(String(c.blockNumber)):'')+(c.txHash?' · <a href="'+SkillPass.txUrl(c.txHash)+'" target="_blank" rel="noopener">ver la transacción</a>':'')+'<br>Huella: <code>'+escHtml(c.cvHash||'')+'</code></div></details>';
      return;
    }
    box.innerHTML='<div class="sp-sello">Sello público en blockchain, opcional · 4,99 € · <button type="button" class="pj-enlace" onclick="SkillPass.sellar()">Añadir sello</button></div>';
  },

  download(){
    const c=SkillPass.cred; if(!c||!c.cvJson)return;
    const blob=new Blob([JSON.stringify(c.cvJson,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='skillpass-'+c.cvHash.slice(2,10)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },

  copyLink(){
    const url=SkillPass.shareUrl(); if(!url)return;
    const done=()=>SkillPass._status('ok','Enlace copiado. Cualquiera puede abrirlo y verificar el SkillPass en blockchain, sin cuenta TalentPact.<br><code class="u-fs-micro u-wb-break-all">'+escHtml(url)+'</code>');
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done).catch(()=>{ prompt('Copia este enlace:',url); done(); });
    }else{ prompt('Copia este enlace:',url); done(); }
  },

  pdf(){
    const c=SkillPass.cred; if(!c||!c.cvJson)return;
    const w=window.open('','_blank');
    if(!w){toast('Permite las ventanas emergentes para generar el PDF.');return;}
    const card=SkillPass.cardHtml(c,{url:SkillPass.shareUrl()});
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SkillPass TalentPact</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>@page{size:A4;margin:12mm}body{margin:0;background:#f1f5f9;font-family:system-ui,sans-serif;padding:20px}'+
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
      '.sp-pass-chip-top strong{font-family:Inter,sans-serif;font-size:18px;color:#6ee7b7}'+
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

