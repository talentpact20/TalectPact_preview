// TalentPact · 17-ofertas-reales
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.

// ═══════════════════════════════════════════════════════════════════════════
// TPOfertas — ofertas de empleo reales (Supabase: list-jobs / save-job)
//
// Sustituye a las 22 ofertas de ejemplo y a las publicadas solo en el
// navegador: una oferta existe cuando está en la base de datos y la ven todos.
// ═══════════════════════════════════════════════════════════════════════════
var TPOfertas={
  estado:'sin cargar',error:null,mias:[],errorMias:false,pagos:[],
  BADGE:{Marketing:'jb-mkt',IT:'jb-it',Data:'jb-data',Business:'jb-biz',Design:'jb-des',RRHH:'jb-hr',Finance:'jb-fin',Legal:'jb-leg',Ops:'jb-ops',Sales:'jb-sales',Languages:'jb-lang'},
  _clave(nombre){let h=0;const n=String(nombre||'');for(let k=0;k<n.length;k++)h=(h*31+n.charCodeAt(k))>>>0;return 'co_'+h.toString(36);},
  /** Oferta del servidor → forma que usan las vistas (empresa en COMPANIES). */
  adaptar(o){
    const c=o.company||{};const id=TPOfertas._clave(c.name);
    if(!COMPANIES.find(x=>x.id===id))COMPANIES.push({id,name:c.name||'Empresa',size:c.size||'—',sector:c.sector||o.sector,desc:c.description||'',website:c.website||null,location:c.location||null,verificacion:c.verificacion||'sin_verificar',logo:''});
    return Object.assign({},o,{company:id,companyInfo:c,badge:TPOfertas.BADGE[o.sector]||'jb-it',tags:(o.tags&&o.tags.length)?o.tags:[o.sector],paused:o.status==='closed'});
  },
  async cargar(){
    TPOfertas.estado='cargando';
    let r;
    try{r=await fetch('/.netlify/functions/list-jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(x=>x.json());}
    catch(e){r={error:e.message||String(e)};}
    if(!r||r.error){TPOfertas.estado='error';TPOfertas.error=(r&&(r.details||r.error))||'Sin respuesta';console.warn('[TP] list-jobs:',TPOfertas.error);}
    else{
      JOBS.length=0;COMPANIES.length=0;
      (r.jobs||[]).forEach(o=>JOBS.push(TPOfertas.adaptar(o)));
      TPOfertas.estado='ok';TPOfertas.error=null;
    }
    TPOfertas.repintar();
  },
  async cargarMias(){
    if(!tpCompany){TPOfertas.mias=[];return;}
    const r=await TPCloud._postAuth('list-jobs',{mine:true});
    TPOfertas.errorMias=!r||!!r.error;
    if(TPOfertas.errorMias)console.warn('[TP] list-jobs (mías):',r&&(r.details||r.error));
    TPOfertas.mias=(r&&r.jobs)?r.jobs.map(TPOfertas.adaptar):[];
    empPostedJobs=TPOfertas.mias;          // openJob y "Ver candidatos" buscan aquí las propias cerradas
    tpActividadEmpresa();
  },
  repintar(){
    try{filterJobs();}catch(e){}
    const d=document.getElementById('dashCandidate');
    if(d&&d.classList.contains('open')){try{renderJobMatches();renderCandOfertas();}catch(e){}}
  },
  /** Candidatos del pool con al menos un 50 % de encaje: la cifra real por oferta. */
  candidatosPara(job){return CANDIDATES.filter(c=>c._real&&encajeOferta(job,c).pct>=50).length;}
};

// Las ofertas públicas son las de JOBS; ya no hay una segunda lista local.
publicJobs=function(){return [];};
myPostedJobs=function(){return TPOfertas.mias;};
TP.saveEmpJobs=function(){};
try{localStorage.removeItem(TP_NS+'empJobs');}catch(e){}

// Publicar: valida en el cliente para dar el aviso rápido; el servidor valida igual.
// _tpPublicando evita que un doble clic publique la misma oferta dos veces.
let _tpPublicando=false;
publishJob=async function(){
  if(_tpPublicando)return;
  if(!tpCompany){toast('Inicia sesión con tu cuenta de empresa para publicar ofertas.');return;}
  const v=id=>(document.getElementById(id).value||'').trim();
  const datos={
    title:v('pj-title'),area:v('pj-sector'),especialidad:v('pj-especialidad'),description:v('pj-desc'),
    skillRequirements:typeof TPReq!=='undefined'?TPReq.paraEnviar():[],
    requiredSkills:pjReqSkills.slice(),tags:pjSkills.slice(0,6),requiredLevel:pjLevel,exerciseConfig:pjExConfigVal,
    jornada:v('pj-jornada'),modalidad:v('pj-mode'),contrato:v('pj-contrato'),ubicacion:v('pj-city'),
    salMin:Number(v('pj-sal-min'))||null,salMax:Number(v('pj-sal-max'))||null,
    cultureQuestions:typeof tpLeerPreguntasVacante==='function'?tpLeerPreguntasVacante():[],
    dilemmas:typeof tpLeerDilemasVacante==='function'?tpLeerDilemasVacante():[],
    screening:typeof TPCribadoOferta!=='undefined'?TPCribadoOferta.paraEnviar():[]
  };
  if(!datos.title||!datos.area||datos.description.length<20){toast('Faltan el título, el área o una descripción de al menos 20 caracteres.');if(typeof tpReqIr==='function')tpReqIr(1,true);return;}
  if(!datos.requiredSkills.length){toast('Elige al menos una skill que tenga que demostrar.');if(typeof tpReqIr==='function')tpReqIr(2,true);return;}
  if(datos.salMin&&datos.salMax&&datos.salMin>datos.salMax){toast('El salario mínimo no puede superar al máximo.');return;}
  if(datos.modalidad!=='remoto'&&!datos.ubicacion){toast('Indica la ubicación: la oferta no es 100 % remota.');return;}
  const pedidoAMedida=datos.exerciseConfig==='contact';
  const btn=document.querySelector('[onclick="publishJob()"]');
  _tpPublicando=true;if(btn){btn.disabled=true;btn.setAttribute('aria-busy','true');}
  let r;
  try{r=await TPCloud._postAuth('save-job',datos);}
  finally{_tpPublicando=false;if(btn){btn.disabled=false;btn.removeAttribute('aria-busy');}}
  if(!r||r.error){toast('No se pudo publicar: '+((r&&(r.error||r.details))||'error desconocido'));return;}
  pjSkills=[];pjReqSkills=[];pjExConfigVal='common+custom';pjLevel='basico';
  if(typeof TPReq!=='undefined')TPReq.reset();
  if(typeof TPCribadoOferta!=='undefined')TPCribadoOferta.reset();
  ['pj-title','pj-desc','pj-sal-min','pj-sal-max','pj-city','pj-q1','pj-q2','pj-q3','pj-d1','pj-d2','pj-d3'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  try{renderPjTags();renderPjSkills&&renderPjSkills();}catch(e){}
  togglePostJob();
  await Promise.all([TPOfertas.cargar(),TPOfertas.cargarMias()]);
  renderEmpJobs();
  toast(pedidoAMedida?'Oferta publicada. Has pedido ejercicios a medida: te escribimos en 24 h para diseñarlos.':'Oferta publicada. Ya la ven los candidatos.','ok');
};

async function tpCambiarEstadoOferta(id,estado){
  const r=await TPCloud._postAuth('save-job',{id,status:estado});
  if(!r||r.error){toast('No se pudo actualizar la oferta: '+((r&&r.error)||''));return;}
  await Promise.all([TPOfertas.cargar(),TPOfertas.cargarMias()]);
  renderEmpJobs();
  toast(estado==='closed'?'Oferta cerrada: ya no la ven los candidatos.':'Oferta reabierta.','ok');
}

// Panel de empresa: sus ofertas reales, con candidatos reales que encajan.
renderEmpJobs=function(){
  const mias=TPOfertas.mias;
  const st=document.getElementById('empStatOffers');if(st)st.textContent=TPOfertas.errorMias?'—':mias.filter(j=>j.status==='open').length;
  let h='<table class="dash-table"><thead><tr><th>Puesto</th><th>Sector</th><th>Candidatos que encajan</th><th>Estado</th><th></th></tr></thead><tbody>';
  mias.forEach(j=>{
    const abierta=j.status==='open';
    h+=`<tr><td><strong>${escHtml(j.title)}</strong><div class="u-fs-micro u-c-slate-500">${escHtml(TP_COND.jornadas[j.jornada]||'')} · ${escHtml(TP_COND.modalidades[j.modalidad]||'')}${j.ubicacion?' · '+escHtml(j.ubicacion):''}</div></td><td>${escHtml(j.sector)}</td>
      <td><strong>${TPPool.estado==='ok'?TPOfertas.candidatosPara(j):'—'}</strong></td>
      <td><span class="${abierta?'status-active':'status-closed'}">${abierta?'Abierta':'Cerrada'}</span></td>
      <td class="u-ws-nowrap"><button class="btn btn-primary btn-sm" onclick="showOfferCandidates('${escHtml(j.id)}')">Ver candidatos</button>
      <button class="btn btn-outline btn-sm" onclick="tpCambiarEstadoOferta('${escHtml(j.id)}','${abierta?'closed':'open'}')">${abierta?'Cerrar':'Reabrir'}</button></td></tr>`;
  });
  if(!mias.length)h+='<tr><td colspan="5">'+(TPOfertas.errorMias
    ?tpVacio({error:true,icono:'alert',titulo:'No se han podido cargar tus ofertas',texto:'El servidor no ha respondido bien. Tus ofertas no se han perdido: vuelve a intentarlo en unos minutos.',acciones:[{txt:'Reintentar',accion:'TPOfertas.cargarMias().then(renderEmpJobs)'}]})
    :'<div class="tp-empty">Todavía no has publicado ninguna oferta. Usa «Nueva oferta» para empezar.</div>')+'</td></tr>';
  h+='</tbody></table>';
  const box=document.getElementById('empJobsList');
  if(box)box.innerHTML=h;
};

// Pausar la cuenta = cerrar todas sus ofertas en el servidor.
toggleEmpPause=async function(){
  const abiertas=TPOfertas.mias.filter(j=>j.status==='open');
  const pausar=abiertas.length>0;
  const objetivo=pausar?abiertas:TPOfertas.mias;
  for(const j of objetivo){await TPCloud._postAuth('save-job',{id:j.id,status:pausar?'closed':'open'});}
  await Promise.all([TPOfertas.cargar(),TPOfertas.cargarMias()]);
  const b=document.getElementById('st-emp-pause');if(b)b.textContent=pausar?'Reactivar ofertas':'Cerrar todas las ofertas';
  stMsg('st-emp-sec-msg','ok',pausar?'Todas tus ofertas están cerradas.':'Tus ofertas vuelven a estar abiertas.');
  try{renderEmpJobs();renderEmpUsage();}catch(e){}
};

// Uso real de la cuenta: ofertas del servidor y pagos confirmados por Stripe.
(function(){
  const _sync=Pay.sync;
  Pay.sync=async function(){const r=await _sync.apply(Pay,arguments);if(r&&Array.isArray(r.unlocks))TPOfertas.pagos=r.unlocks;return r;};
})();
renderEmpUsage=function(){
  const box=document.getElementById('st-emp-usage');if(!box)return;
  const mias=TPOfertas.mias,pagos=TPOfertas.pagos;
  const total=pagos.reduce((n,p)=>n+(Number(p.amount_cents)||0),0)/100;
  const filas=[['Ofertas publicadas',mias.length],['Ofertas abiertas',mias.filter(j=>j.status==='open').length],['Contactos desbloqueados',pagos.length],['Importe pagado',total.toLocaleString('es-ES',{style:'currency',currency:'EUR'})]];
  box.innerHTML=filas.map(f=>'<div class="st-kv"><span>'+f[0]+'</span><strong>'+escHtml(String(f[1]))+'</strong></div>').join('');
};

// Al abrir el panel de empresa se traen sus ofertas.
(function(){
  const _open=openDashEmp;
  openDashEmp=function(){
    const r=_open.apply(this,arguments);
    TPOfertas.cargarMias().then(()=>{try{renderEmpJobs();}catch(e){}});
    return r;
  };
})();

// Ofertas públicas al arrancar.
TPOfertas.cargar();

// Entrada al backoffice: visible solo para el rol admin, tras cualquier login.
(function(){
  ['loginCandidate','loginEmpresa'].forEach(n=>{
    const f=window[n];if(typeof f!=='function')return;
    window[n]=async function(){const r=await f.apply(this,arguments);tpMostrarEntradaAdmin();return r;};
  });
})();

// Portada sin ofertas: se distingue "aún no hay", "no se pudieron cargar" y
// "tu búsqueda no da resultados".
(function(){
  const _render=renderJobs;
  renderJobs=function(list){
    _render.apply(this,arguments);
    const nr=document.getElementById('noResults');if(!nr||list.length)return;
    if(TPOfertas.estado==='error')nr.innerHTML=tpVacio({error:true,icono:'alert',titulo:'No se han podido cargar las ofertas',texto:'Puede ser un problema momentáneo de conexión. Vuelve a intentarlo en unos segundos.',acciones:[{txt:'Reintentar',accion:'TPOfertas.cargar()'}]});
    else if(TPOfertas.estado==='cargando'||TPOfertas.estado==='sin cargar')nr.innerHTML='<div class="tp-cargando-ofertas">'+('<div>'+tpEsqueleto(4)+'</div>').repeat(3)+'</div>';
    else if(!JOBS.length)nr.innerHTML=tpVacio({icono:'building',titulo:'Todavía no hay ofertas publicadas',texto:'Cuando una empresa publique una oferta, aparecerá aquí. Mientras tanto, completa retos: así ya tendrás tu nota verificada.',acciones:[{txt:'Publicar una oferta',accion:"openAuth('empresa')",tipo:'btn-dark'},{txt:'Ver los retos',accion:"document.getElementById('explorar').scrollIntoView({behavior:'smooth'})"}]});
    else nr.innerHTML=tpVacio({icono:'search',titulo:'Ninguna oferta coincide con tu búsqueda',texto:'Prueba con otro término o con otro sector.',acciones:[{txt:'Ver todas',accion:'clearSearch()'}]});
  };
})();

// Cifras del panel de empresa, con datos reales: ofertas abiertas propias,
// candidatos del pool, cuántos tienen media de 80 o más y contactos desbloqueados
// (los confirma el servidor). Antes eran números fijos en el HTML (4, 127, 23).
function tpActividadEmpresa(){
  const pon=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const cands=(typeof CANDIDATES!=='undefined'?CANDIDATES:[]);
  const poolOk=typeof TPPool!=='undefined'&&TPPool.estado==='ok';
  pon('empStatOffers',tpCompany?String((TPOfertas.mias||[]).filter(j=>j.status==='open').length):'—');
  pon('empStatPool',poolOk?String(TPPool.total||0):'—');
  pon('empStatTop',poolOk?String(cands.filter(c=>(c.skills||[]).some(x=>Number(x.v)>=80)).length):'—');
  pon('empStatUnlocks',String(cands.filter(c=>c._unlocked).length));
}
