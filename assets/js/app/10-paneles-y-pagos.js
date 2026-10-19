// TalentPact · 10-paneles-y-pagos
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// Ofertas y empresas en el panel del candidato (también se repinta al llegar
// las ofertas del servidor).
function renderCandOfertas(){
  let h='';
  JOBS.forEach(j=>{const co=COMPANIES.find(c=>c.id===j.company);
    const reqSkills=j.requiredSkills||[];
    const hasCount=reqSkills.filter(s=>candidateProfile.skills[s]?.unlocked).length;
    const allMet=hasCount===reqSkills.length&&reqSkills.length>0;
    const pie=`<span class="tp-oferta-req ${allMet?'ok':''}">${allMet?tpIcon('check')+' Cumples los skills requeridos':hasCount+' de '+reqSkills.length+' skills requeridos'}</span>`;
    const et=typeof TPPostulaciones!=='undefined'?TPPostulaciones.etapa(j.id):'';
    const pieFinal=et?`${tpChip(TP_ETAPA_CANDIDATO[et]||et,et==='descartado'?'error':et==='aplicado'?'info':'ok')}`:pie;
    h+=tpTarjetaOferta(j,co,{click:`openJob('${escHtml(j.id)}')`,tiene:x=>candidateProfile.skills[x]?.unlocked,pie:pieFinal,prefs:undefined});
  });
  // Sin ofertas no siempre es "no hay": puede que no se hayan podido cargar.
  const est=typeof TPOfertas!=='undefined'?TPOfertas.estado:'ok';
  document.getElementById('candJobsList').innerHTML=JOBS.length?`<div class="jobs-grid">${h}</div>`
    :est==='error'?tpVacio({error:true,icono:'alert',titulo:'No se han podido cargar las ofertas',texto:'Es un problema nuestro, no de tu cuenta. Vuelve a intentarlo en unos minutos.',acciones:[{txt:'Reintentar',accion:'TPOfertas.cargar()'}]})
    :(est==='cargando'||est==='sin cargar')?tpEsqueleto(4)
    :tpVacio({icono:'building',titulo:'Todavía no hay ofertas publicadas',texto:'Mientras tanto, completa retos: las empresas buscan en el pool por skills y verán tu nota en cuanto publiquen.'});
  const emp=COMPANIES.map(c=>`<div class="tp-company-card"><div class="tp-company-head">${companyMonogramHTML(c.name)}<div><strong>${escHtml(c.name)}</strong><div class="tp-company-meta">${[c.sector,c.size&&c.size!=='—'?c.size+' empleados':'',c.location].filter(Boolean).map(escHtml).join(' · ')}</div></div></div>${c.desc?`<p>${escHtml(c.desc)}</p>`:''}${c.website?`<a href="${escHtml(c.website)}" target="_blank" rel="noopener nofollow">${escHtml(c.website.replace(/^https?:\/\//,''))}</a>`:''}</div>`).join('');
  document.getElementById('candCompaniesList').innerHTML=COMPANIES.length?`<div class="companies-grid">${emp}</div>`:'<div class="tp-empty">Aún no hay empresas con ofertas abiertas.</div>';
}
function companyMonogramHTML(nombre){const m=companyMonogram(nombre);return `<span class="tp-mono tp-tinte-${m.tinte}">${escHtml(m.iniciales)}</span>`;}

// ═══ DASHBOARDS ═══
function openDashCand(){document.getElementById('dashCandidate').classList.add('open');document.body.style.overflow='hidden';
  applyCandidateIdentity();
  updateCandProfile();renderCommonExercises();renderJobMatches();renderOnboarding();renderRanking('all');renderFAQ();
  renderCandOfertas();
  // Reset to profile tab
  document.querySelectorAll('#candDashTabs .dash-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('[id^="candTab-"]').forEach((c,i)=>c.classList.toggle('active',i===0));
}
function openDashEmp(){
  document.getElementById('dashEmpresa').classList.add('open');
  document.body.style.overflow='hidden';
  applyCompanyIdentity();renderEmpJobs();renderEmpPool();tpActividadEmpresa();
  // Los desbloqueos los manda el servidor, no localStorage: si esta cuenta pago
  // desde otro dispositivo, el contacto tiene que seguir estando desbloqueado.
  Pay.sync().then(function(r){ if(r&&r.unlocks)renderEmpPool(); tpActividadEmpresa(); }).catch(function(){});
}
function myPostedJobs(){ const k=companyKey(); return empPostedJobs.filter(j=>!j.owner||j.owner===k); }
function renderEmpJobs(){ /* lo sustituye 17-ofertas-reales.js (ofertas reales) */ }

// Candidatos para una oferta, ordenados por encaje real: skills requeridas que
// el candidato ha demostrado y condiciones (jornada, modalidad) compatibles.
// Antes se listaban todos, con un "#1000+posición" inventado como alias y
// reordenando el array global.
function encajeOferta(job,c){
  const req=(job.requiredSkills||[]).map(x=>String(x).toLowerCase());
  const tiene=new Set((c.skills||[]).map(s=>String(s.n).toLowerCase()));
  const skills=req.length?req.filter(x=>tiene.has(x)).length/req.length:0;
  const cd=c.cond||{};
  const ok=(lista,v)=>!v||!(lista&&lista.length)?null:lista.includes(v);
  const jor=ok(cd.jornadas,job.jornada),mod=ok(cd.modalidades,job.modalidad);
  const cond=[jor,mod].filter(x=>x!==null);
  const pctCond=cond.length?cond.filter(Boolean).length/cond.length:1;
  // Sin ninguna skill de las pedidas no hay encaje: las condiciones solas no bastan.
  return {pct:skills?Math.round((skills*0.7+pctCond*0.3)*100):0,skills,jor,mod};
}
function showOfferCandidates(jobId){
  const job=JOBS.concat(empPostedJobs).find(j=>j.id===jobId);
  if(!job)return;
  document.getElementById('empOfferCandidatesSection').style.display='block';
  document.getElementById('empOfferCandTitle').textContent='Candidatos para: '+job.title;
  // Encajan por skills, o se han postulado ellos (aunque aún no tengan las skills).
  const enProceso=c=>typeof TPApps!=='undefined'&&!!TPApps.estadoDe(jobId,c.id);
  // Orden por grupos (cumple las imprescindibles → pendientes → por debajo);
  // dentro de cada grupo, por encaje. Nadie desaparece por una sola skill.
  const lista=CANDIDATES.map(c=>({c,e:encajeOferta(job,c)}))
    .filter(x=>x.e.pct>0||x.e.demostradas||enProceso(x.c))
    .sort((x,y)=>(x.e.grupo||9)-(y.e.grupo||9)||y.e.pct-x.e.pct||y.c.score-x.c.score);
  const chip=(ok,txt)=>ok===null?'':`<span class="tp-cond-chip ${ok?'ok':'ko'}">${ok?'✓':'✕'} ${escHtml(txt)}</span>`;
  let h='';
  lista.forEach(({c:ca,e})=>{
    const scoreCls=ca.score>=80?'score-high':'score-mid';
    const verif=(ca.skills||[]).filter(s=>s.verified).length;
    h+=`<div class="offer-cand-card" data-ref="${escHtml(ca.id)}">
      <div class="oc-avatar">${escHtml(ca.i)}</div>
      <div class="oc-score-pill"><div class="score-circle ${scoreCls}">${ca.score}</div></div>
      <div class="oc-info">
        <h4>${escHtml(TPPool.alias(ca))}</h4>
        ${e.req&&typeof tpReqResumen==='function'?tpReqResumen(e.req):tpEncaje(e.pct)}
        <div class="oc-meta">${escHtml(ca.sector)} · ${(ca.skills||[]).length} skills${ca._real?' · '+verif+' verificadas':''}</div>
        <div class="oc-skills">${(ca.skills||[]).map(s=>`<span class="job-tag">${escHtml(s.n)}: <strong>${s.v}</strong></span>`).join('')}</div>
        <div class="tp-cond">${chip(e.jor,TP_COND.jornadas[job.jornada]||'')}${chip(e.mod,TP_COND.modalidades[job.modalidad]||'')}</div>
      </div>
      <div class="oc-actions">
        ${ca._unlocked
          ?`<button class="btn-unlock unlocked" onclick="showContactCard(CANDIDATES.find(x=>String(x.id)==='${escHtml(ca.id)}'))">✓ Ver contacto</button>`
          :(candidateAcceptsContact(ca)
            ?`<button class="btn-unlock" onclick="unlockContact('${escHtml(ca.id)}')">${tpIcon('unlock')} Desbloquear · 49 €</button>`
            :`<button class="btn-unlock" disabled>No acepta contactos</button>`)
        }
      </div>
    </div>`;
  });
  if(!lista.length)h='<div class="tp-empty">'+tpIcon('search')+'<p>Ningún candidato del pool tiene todavía las skills que pide esta oferta.</p></div>';
  document.getElementById('empOfferCandList').innerHTML=h;
  document.getElementById('empOfferCandidatesSection').scrollIntoView({behavior:'smooth',block:'start'});
}

function hideOfferCandidates(){
  document.getElementById('empOfferCandidatesSection').style.display='none';
}

let _payingForCand=null;
let _payingForJob=null;

// Un candidato puede cerrar la puerta desde Ajustes -> Privacidad; cuando lo
// hace, su ficha sigue visible pero no se puede comprar su contacto.
// Lo decide el candidato en sus ajustes y lo comprueba también el servidor
// (create-checkout-session no cobra, get-contact no entrega).
function candidateAcceptsContact(c){
  return !!c&&c.acceptsContact!==false;
}
function unlockContact(candId){
  const c=CANDIDATES.find(p=>p.id===candId);
  if(!c)return;
  if(!candidateAcceptsContact(c)){
    toast('Este candidato no acepta solicitudes de contacto ahora mismo.');
    return;
  }
  _payingForCand=c;
  document.getElementById('payAvatar').textContent=c.i;
  document.getElementById('payName').textContent='Candidato #'+(1000+Math.floor(Date.now()/1000)%900);
  document.getElementById('payMeta').textContent='Score: '+c.score+' · '+c.sector;
  Pay._status('');
  Pay.applyGateway();          // pinta el importe y el aviso de modo pruebas
  document.getElementById('payModal').classList.add('open');
}

let _lastContact=null;
// Solo hay contactos reales: 16-pool-real.js sustituye esta función y los pide
// a get-contact. Esta versión base cubre el caso de una referencia desconocida.
function showContactCard(c){
  _lastContact=null;
  document.getElementById('contactFields').innerHTML='<div class="tp-integrity-note warn">Este candidato no está disponible.</div>';
  document.getElementById('contactModal').classList.add('open');
}
function closeContactModal(){ document.getElementById('contactModal').classList.remove('open'); }
function copyContact(){
  if(!_lastContact)return;
  const d=_lastContact;
  const txt=d.name+'\n'+d.email+'\n'+d.phone+'\n'+d.linkedin;
  const b=document.getElementById('contactCopyBtn');
  const done=function(){ if(b){ b.textContent='✓ Copiado'; setTimeout(function(){b.textContent='Copiar datos de contacto';},1600); } };
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done).catch(done);
  else done();
}

function closePayModal(){
  document.getElementById('payModal').classList.remove('open');
  _payingForCand=null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGOS — Stripe Checkout (pagina alojada)
//
// TalentPact no toca datos de tarjeta en ningún momento: se crea una sesión de
// Checkout en el servidor y se redirige a Stripe. El importe lo fija el
// servidor, no el navegador.
//
// El desbloqueo NO se concede aquí. Esta función solo lleva al pago; quien
// marca el contacto como desbloqueado es el webhook de Stripe (o la
// verificación contra su API al volver). Antes bastaba con `c._unlocked=true`
// desde la consola.
// ═══════════════════════════════════════════════════════════════════════════
const Pay={
  gateway:null,        // {configured,testMode,amount} según lo dice el servidor
  paidRefs:new Set(),  // desbloqueos confirmados, tal y como los da el servidor

  _status(kind,html){
    const el=document.getElementById('payStatus'); if(!el)return;
    if(!kind){ el.className='pay-status'; el.innerHTML=''; return; }
    el.className='pay-status show '+kind;
    el.innerHTML=html;
  },

  _busy(on,label){
    const b=document.getElementById('payBtn'); if(!b)return;
    b.disabled=on;
    if(label)b.textContent=label;
  },

  /** Refleja en el modal lo que el servidor dice de la pasarela. */
  applyGateway(g){
    if(g)Pay.gateway=g;
    const tm=document.getElementById('payTestMode');
    const total=document.getElementById('payTotalAmount');
    if(total&&Pay.gateway&&Pay.gateway.amount)total.textContent=Pay.gateway.amount;
    if(!tm)return;
    // Solo se anuncia el modo de pruebas cuando el servidor confirma que lo es.
    tm.style.display=(Pay.gateway&&Pay.gateway.testMode===true)?'block':'none';
  },

  /** Trae del servidor los desbloqueos ya pagados y los aplica al pool. */
  async sync(sessionId){
    let user=null;
    try{ user=await TPCloud.currentUser(); }catch(e){}
    if(!user)return null;
    let r=null;
    try{ r=await TPCloud._postAuth('confirm-checkout',sessionId?{sessionId}:{}); }
    catch(e){ console.warn('[TP] confirm-checkout',e); return null; }
    if(r&&r.error)console.warn('[TP] confirm-checkout:',r.error,r.details||'');
    if(r&&r.stripe)Pay.applyGateway(r.stripe);
    if(r&&Array.isArray(r.unlocks)){
      Pay.paidRefs=new Set(r.unlocks.map(u=>String(u.candidate_ref)));
      // La verdad es la del servidor: se reconstruye el estado local a partir de ella.
      CANDIDATES.forEach(c=>{ c._unlocked=Pay.paidRefs.has(String(c.id)); });
      if(typeof TP!=='undefined'&&TP.saveUnlocks)TP.saveUnlocks();
    }
    return r;
  }
};

async function processPayment(){
  if(!_payingForCand)return;
  const c=_payingForCand;
  Pay._status('');

  let user=null;
  try{ user=await TPCloud.currentUser(); }catch(e){}
  if(!user){
    Pay._status('warn','Necesitas una cuenta de empresa para pagar: el desbloqueo queda ligado a ella. '+
      'En modo invitado no hay a quién asociar la compra.');
    return;
  }

  Pay._busy(true,'Abriendo Stripe…');
  try{
    const r=await TPCloud._postAuth('create-checkout-session',{
      candidateRef:String(c.id),
      candidateLabel:'Candidato '+(c.i||c.id)+' · score '+(c.score||'—'),
      returnUrl:location.origin+location.pathname
    });

    if(r&&r.code==='stripe_not_configured'){
      Pay._status('warn','<strong>Pasarela de pago no configurada.</strong> Este entorno no tiene claves de Stripe, '+
        'así que no se puede cobrar ni desbloquear nada. Configura <code>STRIPE_SECRET_KEY</code> en el servidor.');
      return;
    }
    if(r&&r.error){
      // Se muestra tambien `details`: durante la puesta en marcha es justo lo
      // que dice si falta la tabla `unlocks` o si la clave de Stripe no vale.
      Pay._status('err','<strong>No se pudo iniciar el pago.</strong> '+escHtml(r.error)+
        (r.details?'<br><span class="u-op-_8 u-fs-micro">'+escHtml(r.details)+'</span>':''));
      return;
    }

    if(r&&r.alreadyUnlocked){
      // Ya pagado antes: se abre la ficha sin cobrar de nuevo.
      Pay.paidRefs.add(String(c.id));
      c._unlocked=true; TP.saveUnlocks();
      closePayModal();
      showContactCard(c);
      return;
    }

    if(r&&r.url){
      Pay._status('info','Redirigiendo a Stripe…');
      location.href=r.url;      // salimos de la página: no restauramos el botón
      return;
    }
    Pay._status('err','Stripe no devolvió una URL de pago. Vuelve a intentarlo.');
  }catch(e){
    Pay._status('err','Error de red al contactar con la pasarela: '+escHtml(e.message||String(e)));
  }finally{
    Pay._busy(false,'Pagar con Stripe →');
  }
}

// Vuelta de Stripe: ?pay=success&session_id=… o ?pay=cancel
async function handlePaymentReturn(){
  const qs=new URLSearchParams(location.search);
  const state=qs.get('pay');
  if(!state)return;
  const sessionId=qs.get('session_id')||'';
  // La URL se limpia siempre: recargar no debe repetir el flujo.
  try{
    const u=new URL(location.href);
    ['pay','session_id'].forEach(k=>u.searchParams.delete(k));
    history.replaceState({},document.title,u.pathname+(u.search||''));
  }catch(e){}

  if(state==='cancel'){
    openDashEmp();
    Pay._status('warn','Pago cancelado. No se ha cobrado nada.');
    return;
  }
  if(state!=='success')return;

  openDashEmp();
  const r=await Pay.sync(sessionId);
  if(r&&r.paid){
    const ref=String(r.candidateRef||'');
    const c=CANDIDATES.find(x=>String(x.id)===ref);
    if(c){ c._unlocked=true; TP.saveUnlocks(); showContactCard(c); }
    if(typeof renderEmpPool==='function')renderEmpPool();
  }else if(r&&r.sessionStatus&&r.sessionStatus!=='paid'){
    // Métodos diferidos (SEPA) pueden tardar en confirmar.
    toast('Stripe aún no confirma el pago (estado: '+r.sessionStatus+'). En cuanto lo haga, el contacto aparecerá desbloqueado.');
  }
}

// ═══ RETOS PANEL LAYOUT (landing) ═══
let _exCategoryLanding='all';
let _exLevelLanding='all';
let _selectedLandingRetoId=null;
let _selectedLandingExIdx=0;

function renderLandingCommon(filter='',cat='all',level='all'){
  const el=document.getElementById('landingCommonGrid');
  if(!el)return;
  let list=COMMON_EXERCISES.filter(ce=>Array.isArray(ce.exercises)&&ce.exercises.length);
  if(cat==='soft')list=list.filter(ce=>ce.category==='soft');
  else if(cat==='sector')list=list.filter(ce=>ce.category==='sector');
  if(level!=='all')list=list.filter(ce=>ce.exercises.some(e=>e.difficulty===level));
  if(filter){const q=filter.toLowerCase();list=list.filter(ce=>(ce.title+' '+ce.desc+' '+(ce.searchTerms||'')+' '+(ce.skill||'')).toLowerCase().includes(q));}
  const countEl=document.getElementById('exResultsCount');
  if(countEl)countEl.textContent=`${list.length} reto${list.length!==1?'s':''}`;
  if(!list.length){
    el.innerHTML='<div class="u-p-20 u-ta-center u-c-slate-400 u-fs-micro">No hay retos que coincidan.</div>';
    const prev=document.getElementById('rplPreview');
    if(prev)prev.innerHTML='<div class="rpl-preview-empty"><span>'+tpIcon('search')+'</span><p>Sin resultados para tu búsqueda.</p></div>';
    return;
  }
  const dotColor=l=>l==='basico'?'var(--emerald-500)':l==='intermedio'?'var(--amber-500)':'var(--red-500)';
  const dotName=l=>l==='basico'?'básico':l==='intermedio'?'intermedio':'avanzado';
  const ORDEN_NIVEL={basico:0,intermedio:1,avanzado:2};
  const buildRow=ce=>{
    const levels=[...new Set(ce.exercises.map(e=>e.difficulty))].sort((a,b)=>(ORDEN_NIVEL[a]??9)-(ORDEN_NIVEL[b]??9));
    const dots=levels.map(l=>`<span class="rpl-dot" style="background:${dotColor(l)}"></span>`).join('');
    const nivelesTxt='Niveles disponibles: '+levels.map(dotName).join(', ');
    const etiquetas=ce.tags.filter(t=>t!=='Universal'&&t!=='Sector').slice(0,2).join(' · ');
    const sub=etiquetas||(ce.category==='sector'?'Por sector':'Soft skill universal');
    return`<div class="rpl-item" id="rplItem_${ce.id}" onclick="selectLandingReto('${ce.id}')"><div class="rpl-item-icon">${tpMonograma(ce.title,ce.category)}</div><div class="rpl-item-info"><div class="rpl-item-title">${ce.title}</div><div class="rpl-item-sub">${sub}</div></div><div class="rpl-dots" title="${nivelesTxt}" aria-label="${nivelesTxt}">${dots}</div></div>`;
  };
  const softList=list.filter(ce=>ce.category==='soft');
  const sectorList=list.filter(ce=>ce.category==='sector');
  let h='';
  if(cat!=='sector'&&softList.length){h+=`<div class="rpl-group-label">Soft Skills Universales</div>`;softList.forEach(ce=>{h+=buildRow(ce);});}
  if(cat!=='soft'&&sectorList.length){h+=`<div class="rpl-group-label u-mt-6">Por Sector</div>`;sectorList.forEach(ce=>{h+=buildRow(ce);});}
  el.innerHTML=h;
  // Auto-select: keep current selection if still visible, otherwise first item
  const stillVisible=_selectedLandingRetoId&&list.find(c=>c.id===_selectedLandingRetoId);
  selectLandingReto(stillVisible?_selectedLandingRetoId:list[0].id);
}

function buildLandingExBody(ce,idx){
  const ex=ce.exercises[idx];if(!ex)return'';
  const hardSkills=(ex.skills?.hard||[]).slice(0,3);
  const softSkills=(ex.skills?.soft||[]).slice(0,2);
  const allSkills=[...hardSkills,...softSkills];
  const timerMins=ex.timeLimit?Math.floor(ex.timeLimit/60):8;
  const timerStr=timerMins+':00';
  return`<div class="rpl-pv-warn"><span>${tpIcon('alert')}</span> El escenario se revelará cuando pulses "Empezar". El timer empieza al instante.</div><div class="rpl-pv-center"><span class="rpl-pv-big-icon">${tpMonograma(ce.title,ce.category)}</span><div class="rpl-pv-ex-title">${ex.title}</div><p class="rpl-pv-ex-desc">${ex.briefing}</p><div class="rpl-pv-skills">${allSkills.map(s=>`<span class="rpl-pv-skill-tag">${s.toUpperCase()}</span>`).join('')}</div><div class="rpl-pv-cta"><button class="rpl-pv-cta-btn" onclick="openAuth('candidate')">Únete para empezar →</button></div></div>`;
}

function selectLandingReto(id){
  const ce=COMMON_EXERCISES.find(c=>c.id===id);if(!ce)return;
  _selectedLandingRetoId=id;_selectedLandingExIdx=0;
  document.querySelectorAll('.rpl-item').forEach(el=>el.classList.remove('active'));
  const item=document.getElementById('rplItem_'+id);
  if(item){item.classList.add('active');}
  const preview=document.getElementById('rplPreview');if(!preview)return;
  const ex=ce.exercises[0];if(!ex)return;
  const diffLabel=ex.difficulty==='basico'?'Básico':ex.difficulty==='intermedio'?'Intermedio':'Avanzado';
  const timerMins=ex.timeLimit?Math.floor(ex.timeLimit/60):8;
  const exTabs=ce.exercises.map((e,i)=>`<button class="rpl-ex-tab${i===0?' active':''}" onclick="selectLandingEx(${i})">${e.num}. ${e.title.length>22?e.title.slice(0,22)+'…':e.title}</button>`).join('');
  preview.innerHTML=`<div class="rpl-pv-topbar"><div class="rpl-pv-title">${ce.title} — ${ex.title}</div><div class="rpl-pv-right"><span class="rpl-pv-badge ${ex.difficulty}">${diffLabel.toUpperCase()}</span><span class="rpl-pv-exnum">Ejercicio 1 de ${ce.exercises.length}</span><span class="rpl-pv-timer">${tpIcon('clock')} ${timerMins}:00</span></div></div><div class="rpl-ex-tabs">${exTabs}</div><div class="rpl-pv-body" id="rplPreviewBody">${buildLandingExBody(ce,0)}</div>`;
}

function selectLandingEx(idx){
  _selectedLandingExIdx=idx;
  const ce=COMMON_EXERCISES.find(c=>c.id===_selectedLandingRetoId);if(!ce)return;
  const ex=ce.exercises[idx];if(!ex)return;
  document.querySelectorAll('.rpl-ex-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  const diffLabel=ex.difficulty==='basico'?'Básico':ex.difficulty==='intermedio'?'Intermedio':'Avanzado';
  const timerMins=ex.timeLimit?Math.floor(ex.timeLimit/60):8;
  const topbar=document.querySelector('.rpl-pv-topbar');
  if(topbar)topbar.innerHTML=`<div class="rpl-pv-title">${ce.title} — ${ex.title}</div><div class="rpl-pv-right"><span class="rpl-pv-badge ${ex.difficulty}">${diffLabel.toUpperCase()}</span><span class="rpl-pv-exnum">Ejercicio ${idx+1} de ${ce.exercises.length}</span><span class="rpl-pv-timer">${tpIcon('clock')} ${timerMins}:00</span></div>`;
  const body=document.getElementById('rplPreviewBody');
  if(body)body.innerHTML=buildLandingExBody(ce,idx);
}

function filterCommonExLanding(){
  const q=document.getElementById('exSearchInput')?.value||'';
  document.getElementById('exSearchClear')?.classList.toggle('show',q.length>0);
  renderLandingCommon(q,_exCategoryLanding,_exLevelLanding);
}

function setExCategory(cat,btn){
  _exCategoryLanding=cat;
  document.querySelectorAll('#exCategoryFilters .rpl-cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filterCommonExLanding();
}

function setExLevel(level,btn){
  _exLevelLanding=level;
  filterCommonExLanding();
}

function clearExSearch(){
  document.getElementById('exSearchInput').value='';
  document.getElementById('exSearchClear').classList.remove('show');
  renderLandingCommon('',_exCategoryLanding,_exLevelLanding);
}

function renderEmpPool(){ /* lo sustituyen 14-empleo.js y 19-rrhh.js (pool real) */ }
function viewProfile(id){const c=CANDIDATES.find(p=>p.id===id);if(!c)return;document.getElementById('profileContent').innerHTML=`<div class="cp-card"><div class="cp-head"><div class="cp-avatar">${escHtml(c.i)}</div><div class="cp-info"><h3>${escHtml(c.alias||"Candidato anónimo")}</h3><div class="cp-meta">${escHtml(c.sector)} · Score: ${c.score} · Perfil ciego</div>${(()=>{if(typeof tpPoolCondChips==='function'){const chips=tpPoolCondChips(c.cond);const integ=c.integ?`<div class="tp-cond"><span class="tp-risk r-${c.integ}">Integridad: riesgo ${c.integ}</span>${c.verified?'<span class="tp-verified">✓ Notas verificadas</span>':''}</div>`:'';return chips+integ;}const cd=c.cond||{};const t=[...(cd.jornadas||[]).map(k=>TP_COND.jornadas[k]),...(cd.modalidades||[]).map(k=>TP_COND.modalidades[k]),...(cd.contratos||[]).map(k=>TP_COND.contratos[k]),cd.ciudad?(cd.ciudad+(cd.reubicacion?' · acepta mudarse':'')):'',cd.disponibilidad?(TP_COND.disponibilidad[cd.disponibilidad]||cd.disponibilidad):'',cd.horas?cd.horas+' h/sem':'',cd.salMin?'Desde '+Math.round(cd.salMin/1000)+' k€':''].filter(Boolean);return (t.length?`<div class="tp-cond">${t.map(x=>`<span class="tp-cond-chip">${escHtml(x)}</span>`).join('')}</div>`:'<div class="tp-cond"><span class="tp-cond-chip muted">Sin condiciones indicadas</span></div>')+(c.integ?`<div class="tp-cond"><span class="tp-risk r-${c.integ}">Integridad: riesgo ${c.integ}</span>${c.verified?'<span class="tp-verified">✓ Notas verificadas</span>':''}</div>`:'');})()}</div><button class="jm-close u-pos-absolute u-right-16 u-top-16" onclick="closeM('profileModal')">✕</button></div><div class="cp-body"><div class="u-fs-micro u-fw-600 u-c-slate-600 u-tt-uppercase u-ls-_04em u-mb-12">Skills evaluados</div><div class="cp-skills">${c.skills.map(s=>`<div class="cp-skill"><div class="cp-skill-name">${escHtml(s.n)}${s.verified?' <span class="tp-verified">✓</span>':''}</div><div class="cp-bar"><div class="cp-bar-fill" style="width:${s.v}%"></div></div><div class="cp-score">${s.v}/100</div></div>`).join('')}</div><div class="u-d-flex u-gap-10 u-mt-16"><button class="btn btn-primary" onclick="closeM('profileModal');unlockContact('${escHtml(c.id)}')">${c._unlocked?'Ver contacto →':'Desbloquear contacto · €49 →'}</button><button class="btn btn-outline" onclick="closeM('profileModal')">Cerrar</button></div></div></div>`;document.getElementById('profileModal').classList.add('open');}

// ═══ POST JOB ═══
let pjExConfigVal='common+custom';
let pjReqSkills=[];
let pjLevel='basico';

function selectPjLevel(level,el){
  pjLevel=level;
  document.querySelectorAll('#pjLevelSelector .level-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}

let _pjSkillCat='all';

function getSkillCategory(skillName){
  const ce=COMMON_EXERCISES.find(c=>c.skill===skillName);
  return ce?ce.category:'soft';
}

function renderPjSkills(){
  const q=(document.getElementById('pjSkillSearch')?.value||'').toLowerCase();
  let allSkills=Object.keys(candidateProfile.skills);
  
  if(_pjSkillCat==='soft')allSkills=allSkills.filter(s=>getSkillCategory(s)==='soft');
  else if(_pjSkillCat==='sector')allSkills=allSkills.filter(s=>getSkillCategory(s)==='sector');
  else if(_pjSkillCat==='selected')allSkills=allSkills.filter(s=>pjReqSkills.includes(s));
  
  if(q)allSkills=allSkills.filter(s=>s.toLowerCase().includes(q));
  
  const grid=document.getElementById('pjRequiredSkills');
  grid.innerHTML=allSkills.map(s=>{
    const sel=pjReqSkills.includes(s);
    return`<label style="display:flex;align-items:center;gap:6px;font-size:.72rem;cursor:pointer;padding:5px 8px;border:1.5px solid ${sel?'var(--emerald-400)':'var(--slate-200)'};border-radius:6px;background:${sel?'var(--emerald-50)':'white'};transition:all .15s" onclick="togglePjSkill('${s}')"><span style="width:14px;height:14px;border-radius:3px;border:1.5px solid ${sel?'var(--emerald-500)':'var(--slate-300)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.55rem;color:white;background:${sel?'var(--emerald-500)':'white'}">${sel?'✓':''}</span>${s}</label>`;
  }).join('');
}

function setPjSkillCat(cat,btn){
  _pjSkillCat=cat;
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderPjSkills();
}

function togglePostJob(){
  const f=document.getElementById('postJobForm');
  const isHidden=f.style.display==='none';
  f.style.display=isHidden?'block':'none';
  if(isHidden)renderPjSkills();
}

function togglePjSkill(skill){
  const idx=pjReqSkills.indexOf(skill);
  if(idx>=0)pjReqSkills.splice(idx,1);
  else pjReqSkills.push(skill);
  renderPjSkills();
}

function selectExConfig(val,el){
  pjExConfigVal=val;
  document.querySelectorAll('#pjExConfig .ex-config-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}

// La × llamaba a addSkill(), que con el campo vacío salía sin repintar: el tag seguía en pantalla.
function renderPjTags(){document.getElementById('pj-skills-list').innerHTML=pjSkills.map((s,j)=>`<span class="pj-tag">${escHtml(s)}<button type="button" aria-label="Quitar ${escHtml(s)}" onclick="pjSkills.splice(${j},1);renderPjTags()">×</button></span>`).join('');}
function addSkill(){const i=document.getElementById('pj-skill-input'),v=i.value.trim();if(!v)return;if(!pjSkills.includes(v))pjSkills.push(v);i.value='';renderPjTags();}

function publishJob(){
  const t=document.getElementById('pj-title').value.trim(),s=document.getElementById('pj-sector').value,d=document.getElementById('pj-desc').value.trim();
  if(!t||!s||!d){toast('Faltan el título, el sector o la descripción.');return;}
  if(pjReqSkills.length===0){toast('Selecciona al menos un skill requerido.');return;}
  const salMin=Number(document.getElementById('pj-sal-min').value)||null,salMax=Number(document.getElementById('pj-sal-max').value)||null;
  if(salMin&&salMax&&salMin>salMax){toast('El salario mínimo no puede superar al máximo.');return;}
  const modalidad=document.getElementById('pj-mode').value,ubicacion=(document.getElementById('pj-city').value||'').trim();
  if(modalidad!=='remoto'&&!ubicacion){toast('Indica la ubicación: la oferta no es 100 % remota.');return;}
  // Se guarda antes de resetear el formulario: antes el aviso de "a medida" no salía nunca.
  const pedidoAMedida=pjExConfigVal==='contact';
  const bm={Marketing:'jb-mkt',IT:'jb-it',Data:'jb-data',Business:'jb-biz',Design:'jb-des',RRHH:'jb-hr',Finance:'jb-fin',Legal:'jb-leg',Ops:'jb-ops',Sales:'jb-sales',Languages:'jb-lang',Cognitive:'jb-cognitive'};
  
  empPostedJobs.push({
    id:'cj_'+Date.now(),
    owner:companyKey(),
    ownerName:companyName(),
    title:t,
    sector:s,
    badge:bm[s]||'jb-it',
    company:'c1',
    desc:d,
    tags:pjSkills.length?pjSkills.slice(0,4):['General'],
    requiredSkills:pjReqSkills.slice(),
    requiredLevel:pjLevel,
    exerciseConfig:pjExConfigVal,
    // Condiciones del puesto: antes salario y modalidad se pedían y se tiraban.
    jornada:document.getElementById('pj-jornada').value,
    modalidad,
    contrato:document.getElementById('pj-contrato').value,
    ubicacion,
    salMin,salMax
  });
  TP.saveEmpJobs();
  
  pjSkills=[];pjReqSkills=[];pjExConfigVal='common+custom';pjLevel='basico';
  document.getElementById('pj-skills-list').innerHTML='';
  document.getElementById('pj-title').value='';
  document.getElementById('pj-desc').value='';
  ['pj-sal-min','pj-sal-max','pj-city'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  togglePostJob();renderEmpJobs();
  
  if(pedidoAMedida){
    toast('Oferta publicada. Has pedido ejercicios a medida: te escribimos en 24 h para diseñarlos.','ok');
  }else{
    toast('Oferta publicada. Los candidatos ya ven los skills requeridos y pueden hacer los retos.','ok');
  }
}
function closeDash(id){document.getElementById(id).classList.remove('open');document.body.style.overflow='';}

// ═══ UTILS ═══
function toggleAccessMenu(){const d=document.getElementById('accessDrop'),b=document.getElementById('accessBtn');d.classList.toggle('show');b.classList.toggle('open');}
function closeAccessMenu(){document.getElementById('accessDrop').classList.remove('show');document.getElementById('accessBtn').classList.remove('open');}
document.addEventListener('click',function(e){if(!e.target.closest('.nav-access'))closeAccessMenu();});
// Aviso propio en lugar de alert(). No bloquea el hilo, no rompe una presentación en
// vivo y se anuncia a lectores de pantalla. `alert` congela la pestana hasta
// que alguien pulsa Aceptar: en una presentacion eso son varios segundos de
// pantalla muerta.
// Consentimiento de analitica. Aceptar y rechazar tienen el mismo peso visual
// y el mismo numero de clics: es lo que pide la AEPD, y ademas es lo honesto.
function tpConsent(valor){
  try{ localStorage.setItem(window.TP_CONSENT_KEY, valor); }catch(e){}
  var b=document.getElementById('tpCookies'); if(b)b.classList.remove('show');
  document.body.classList.remove('tp-consent-abierto');
  if(valor==='aceptado')tpCargarAnalitica();
}
(function(){
  // Se muestra solo si no hay una decision previa guardada.
  function pintar(){
    if(tpConsentEstado())return;
    var b=document.getElementById('tpCookies');
    if(b)setTimeout(function(){ b.classList.add('show'); document.body.classList.add('tp-consent-abierto'); }, 900);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pintar);
  else pintar();
})();

function toast(msg, tipo){
  var wrap=document.getElementById('tpToastWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='tpToastWrap'; wrap.className='tp-toast-wrap';
    wrap.setAttribute('role','status'); wrap.setAttribute('aria-live','polite');
    document.body.appendChild(wrap);
  }
  var el=document.createElement('div');
  el.className='tp-toast '+(tipo||'warn');
  var ico=(tipo==='ok')
    ? '<svg class="tp-toast-ico" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>'
    : '<svg class="tp-toast-ico" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 4a1 1 0 011 1v4a1 1 0 11-2 0V7a1 1 0 011-1zm0 8.5a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z" clip-rule="evenodd"/></svg>';
  el.innerHTML=ico+'<span>'+String(msg).replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</span>';
  wrap.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function(){
    el.classList.remove('show');
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 260);
  }, tipo==='ok' ? 3200 : 4200);
}

function goTo(id){const el=document.getElementById(id);if(el){window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-70,behavior:'smooth'});}}
function goHome(){closeDash('dashCandidate');closeDash('dashEmpresa');closeAdmin();closeAuth('authCandidate');closeAuth('authEmpresa');closeSettings('cand');closeSettings('emp');window.scrollTo({top:0,behavior:'smooth'});}

// ═══ SETTINGS DRAWER ═══
function openSettings(type){
  const id=type==='cand'?'stDrawerCand':'stDrawerEmp';
  const ov=type==='cand'?'stOverlayCand':'stOverlayEmp';
  const d=document.getElementById(id);
  const o=document.getElementById(ov);
  if(d)d.classList.add('open');
  if(o)o.classList.add('open');
  if(type==='cand'){ updateStCandIncentives(); loadCandSettings(); }
  else loadEmpSettings();
}
function closeSettings(type){
  const id=type==='cand'?'stDrawerCand':'stDrawerEmp';
  const ov=type==='cand'?'stOverlayCand':'stOverlayEmp';
  const d=document.getElementById(id);
  const o=document.getElementById(ov);
  if(d)d.classList.remove('open');
  if(o)o.classList.remove('open');
}
function updateStCandIncentives(){
  // TalentPact es gratis para candidatos; no hay pago por retos
}
function openContact(asunto){
  const form=document.getElementById('cform');
  form.style.display='block';
  document.getElementById('csucc').style.display='none';
  if(asunto){
    // Quien pulsa "Activar Pro" no deberia tener que explicar por que escribe.
    const perfil=form.querySelector('select[name="perfil"]');
    if(perfil)perfil.value='Empresa';
    const msg=form.querySelector('textarea[name="mensaje"]');
    if(msg&&!msg.value.trim())msg.value='Me interesa el '+asunto+'. ¿Podéis contarme los siguientes pasos?';
  }
  document.getElementById('cmodal').classList.add('open');
}
function submitContact(){
  const name=document.getElementById('cf-name').value.trim();
  const email=document.getElementById('cf-email').value.trim();
  if(!name||!email){toast('Faltan el nombre o el correo.');return;}
  const form=document.getElementById('cform');
  const btn=form.querySelector('button');
  btn.textContent='Enviando…';btn.disabled=true;
  const formData=new URLSearchParams(new FormData(form)).toString();
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:formData})
    .then(function(r){if(r.ok){form.style.display='none';document.getElementById('csucc').style.display='block';}else{toast('No se ha podido enviar. Inténtalo de nuevo.');btn.textContent='Enviar →';btn.disabled=false;}})
    .catch(function(){toast('Sin conexión con el servidor. Inténtalo de nuevo.');btn.textContent='Enviar →';btn.disabled=false;});
}
function closeM(id){document.getElementById(id).classList.remove('open');}
document.getElementById('cmodal').addEventListener('click',function(e){if(e.target===this)closeM('cmodal');});
document.getElementById('jobModal').addEventListener('click',function(e){if(e.target===this)closeJobModal();});
document.getElementById('profileModal').addEventListener('click',function(e){if(e.target===this)closeM('profileModal');});
document.getElementById('payModal').addEventListener('click',function(e){if(e.target===this)closePayModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeContactModal();closeSettings('cand');closeSettings('emp');closeJobModal();closeM('cmodal');closeM('profileModal');closePayModal();closeAdminLogin();closeAdmin();closeDash('dashCandidate');closeDash('dashEmpresa');closeAuth('authCandidate');closeAuth('authEmpresa');}});
window.addEventListener('load',function(){if(typeof _scrollTop==='function')_scrollTop();});
const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
