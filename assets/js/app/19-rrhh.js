// TalentPact · 19-rrhh
// Personas y equipo, preguntas de vacante, bandeja de avisos y mini-pipeline.
// Script clásico: ámbito global compartido (ver assets/js/README.md).

var TP_PERSONAS_SKILLS={
  'Liderazgo':1,'Trabajo en Equipo':1,'Gestión del Tiempo':1,
  'Comunicación Escrita':1,'Toma de Decisiones':1,'Negociación':1,'Atención al Cliente':1
};
var TP_COGNITIVO_SKILLS={
  'Pensamiento Analítico':1,'Razonamiento Lógico':1,'Resolución de Problemas':1,
  'Creatividad':1,'Creatividad e Innovación':1,'Excel y Datos':1,
  'Pensamiento Estratégico':1,'Inglés (Speaking)':1
};
var TP_APP_ESTADOS={
  aplicado:'Aplicado',retos:'Retos',preseleccionado:'Preseleccionado',
  entrevista:'Entrevista',contratado:'Contratado',descartado:'Descartado'
};

function tpEsPersonaSkill(n){return !!TP_PERSONAS_SKILLS[String(n||'')];}
function tpEsCognitivoSkill(n){return !!TP_COGNITIVO_SKILLS[String(n||'')];}
function tpSegmentoReto(ce){
  if(!ce)return 'sector';
  if(ce.category==='sector')return 'sector';
  if(tpEsPersonaSkill(ce.skill))return 'personas';
  if(tpEsCognitivoSkill(ce.skill))return 'cognitivo';
  return ce.category==='soft'?'cognitivo':'sector';
}

/** Chips de Personas y equipo (+ integridad) para pool / ficha. */
function tpPersonasChips(c){
  const list=(c&&c.personas&&c.personas.length)?c.personas
    :(c&&c.skills||[]).filter(s=>tpEsPersonaSkill(s.n)).sort((a,b)=>b.v-a.v).slice(0,5);
  if(!list.length)return '<div class="tp-cond"><span class="tp-cond-chip muted">Sin simulaciones de personas aún</span></div>';
  return '<div class="tp-cond">'+list.map(s=>`<span class="tp-cond-chip tp-chip-personas">${escHtml(s.n)}: ${s.v}</span>`).join('')+'</div>';
}
function tpIntegridadDetalle(c){
  if(!c||!c.integ)return '<span class="u-c-slate-400">Sin informe de integridad</span>';
  const txt={bajo:'Riesgo bajo',medio:'Riesgo medio',alto:'Riesgo alto'}[c.integ]||c.integ;
  return `<span class="tp-risk r-${c.integ}">${txt}</span>${c.verified?' <span class="tp-verified">Notas verificadas</span>':''}<span class="u-fs-micro u-c-slate-500"> · No descarta solo: revisión humana</span>`;
}

// ── Filtros de retos: Personas / Cognitivo / Técnico ──
(function(){
  if(typeof renderCommonExercises!=='function')return;
  const _render=renderCommonExercises;
  renderCommonExercises=function(filter,cat){
    const c=cat!=null?cat:(typeof _dashExCat!=='undefined'?_dashExCat:'all');
    if(c==='personas'||c==='cognitivo'){
      const q=filter||'';
      let list=COMMON_EXERCISES.filter(ce=>tpSegmentoReto(ce)===c);
      if(q){const qq=q.toLowerCase();list=list.filter(ce=>(ce.title+' '+ce.desc+' '+(ce.searchTerms||'')+' '+ce.skill).toLowerCase().includes(qq));}
      let html='';
      if(!list.length)html='<div class="tp-empty u-p-24">No hay retos en este segmento.</div>';
      else list.forEach(ce=>{
        const done=candidateProfile.completedCommon.find(x=>x.id===ce.id);
        html+=`<div class="common-ex-card ${done?'completed':''}" onclick="openCommonEx('${ce.id}')"><span class="cex-icon">${tpMonograma(ce.title,ce.category)}</span><div class="cex-title">${ce.title}</div><div class="cex-desc">${ce.desc}</div><div class="cex-meta"><span class="cex-tag universal">${c==='personas'?'Personas y equipo':'Cognitivo'}</span>${done?`<span class="cex-tag">✓ ${done.score}/100</span>`:''}</div></div>`;
      });
      const box=document.getElementById('commonExGrid');if(box)box.innerHTML=html;
      return;
    }
    return _render.apply(this,arguments);
  };
})();

(function(){
  const _set=typeof setExCategory==='function'?setExCategory:null;
  if(!_set||typeof renderLandingCommon!=='function')return;
  setExCategory=function(c,btn){
    document.querySelectorAll('.rpl-cat-btn').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
    const q=(document.getElementById('exSearchInput')&&document.getElementById('exSearchInput').value)||'';
    if(c==='personas'||c==='cognitivo'){
      _exCategoryLanding=c;
      const list=COMMON_EXERCISES.filter(ce=>tpSegmentoReto(ce)===c);
      const el=document.getElementById('landingCommonGrid');
      if(!el)return;
      const label=c==='personas'?'Personas y equipo':'Cognitivo y criterio';
      el.innerHTML=`<div class="rpl-group-label">${label}</div>`+list.map(ce=>{
        return`<div class="rpl-item" id="rplItem_${ce.id}" onclick="selectLandingReto('${ce.id}')"><div class="rpl-item-icon">${tpMonograma(ce.title,ce.category)}</div><div class="rpl-item-info"><div class="rpl-item-title">${ce.title}</div><div class="rpl-item-sub">${label}</div></div></div>`;
      }).join('');
      const countEl=document.getElementById('exResultsCount');
      if(countEl)countEl.textContent=list.length+' reto'+(list.length!==1?'s':'');
      if(list[0])selectLandingReto(list[0].id);
      return;
    }
    return _set.apply(this,arguments);
  };
})();

(function(){
  const _render=typeof renderPjSkills==='function'?renderPjSkills:null;
  if(!_render)return;
  renderPjSkills=function(){
    if(_pjSkillCat!=='personas'&&_pjSkillCat!=='cognitivo')return _render.apply(this,arguments);
    const q=(document.getElementById('pjSkillSearch')?.value||'').toLowerCase();
    let list=Object.keys(candidateProfile.skills||{});
    list=list.filter(_pjSkillCat==='personas'?tpEsPersonaSkill:tpEsCognitivoSkill);
    if(q)list=list.filter(s=>s.toLowerCase().includes(q));
    const grid=document.getElementById('pjRequiredSkills');
    if(!grid)return;
    grid.innerHTML=list.map(s=>{
      const sel=pjReqSkills.includes(s);
      const safe=String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return`<button type="button" class="filter-btn u-fs-micro${sel?' active':''}" onclick="togglePjSkill('${safe}')">${sel?'✓ ':''}${escHtml(s)}</button>`;
    }).join('')||'<span class="u-c-slate-400 u-fs-micro">Ninguna skill en este segmento.</span>';
  };
})();

// Pool: filtro “con evidencia de personas” + columna Personas.
(function(){
  const prev=typeof TP_POOL_FILTRO!=='undefined'?TP_POOL_FILTRO:null;
  if(!prev)return;
  TP_POOL_FILTRO.soloPersonas=false;
  const _ren=renderEmpPool;
  renderEmpPool=function(){
    const f=TP_POOL_FILTRO,opt=(m,v)=>Object.entries(m).map(([k,t])=>`<option value="${k}"${k===v?' selected':''}>${t}</option>`).join('');
    const lista=CANDIDATES.filter(c=>{
      const cd=c.cond||{};
      const pers=(c.personas&&c.personas.length)||(c.skills||[]).some(s=>tpEsPersonaSkill(s.n));
      return(!f.jornada||(cd.jornadas||[]).includes(f.jornada))
        &&(!f.modalidad||(cd.modalidades||[]).includes(f.modalidad))
        &&(!f.soloVerificados||c.verified)
        &&(!f.soloPersonas||pers);
    });
    let h=`<div class="tp-filterbar"><label>Jornada <select onchange="TP_POOL_FILTRO.jornada=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.jornadas,f.jornada)}</select></label><label>Modalidad <select onchange="TP_POOL_FILTRO.modalidad=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.modalidades,f.modalidad)}</select></label><label class="tp-filter-check"><input type="checkbox"${f.soloVerificados?' checked':''} onchange="TP_POOL_FILTRO.soloVerificados=this.checked;renderEmpPool()"> Solo notas verificadas</label><label class="tp-filter-check"><input type="checkbox"${f.soloPersonas?' checked':''} onchange="TP_POOL_FILTRO.soloPersonas=this.checked;renderEmpPool()"> Con evidencia de personas</label><span class="tp-filter-count">${lista.length} de ${CANDIDATES.length}</span></div>${window.TPPool&&TPPool.aviso()?`<div class="tp-pool-aviso">${escHtml(TPPool.aviso())}</div>`:''}`;
    h+='<table class="dash-table"><thead><tr><th>Candidato</th><th>Sector</th><th>Score</th><th>Personas y equipo</th><th>Condiciones</th><th>Integridad</th><th>Técnico</th><th></th></tr></thead><tbody>';
    lista.forEach(c=>{
      const tech=(c.skills||[]).filter(s=>!tpEsPersonaSkill(s.n)).slice(0,2);
      const integ=tpIntegridadDetalle(c);
      h+=`<tr><td><div class="u-d-flex u-ai-center u-gap-8"><div class="dash-avatar u-bg-emerald-100 u-c-emerald-600">${escHtml(c.i)}</div>${escHtml(String(c.alias||'').replace(/^Candidato /,''))}</div></td><td>${escHtml(c.sector)}</td><td><strong class="u-c-emerald-600">${c.score}</strong></td><td>${tpPersonasChips(c)}</td><td>${tpPoolCondChips(c.cond)}</td><td>${integ}</td><td>${tech.length?tech.map(s=>`<span class="job-tag">${escHtml(s.n)}: ${s.v}</span>`).join(' '):'<span class="u-c-slate-400">—</span>'}</td><td><button class="btn btn-primary btn-sm" onclick="viewProfile('${escHtml(c.id)}')">${c._unlocked?'Ver contacto':'Ver perfil'}</button></td></tr>`;
    });
    if(!lista.length)h+='<tr><td colspan="8"><div class="tp-empty">'+(CANDIDATES.length?'Ningún candidato cumple esos filtros.':'Todavía no hay candidatos en el pool.')+'</div></td></tr>';
    h+='</tbody></table>';
    const box=document.getElementById('empPool');
    if(box)box.innerHTML=h;
  };
})();

// Ficha perfil: personas + integridad primero.
(function(){
  const _vp=typeof viewProfile==='function'?viewProfile:null;
  if(!_vp)return;
  viewProfile=function(id){
    _vp(id);
    const c=CANDIDATES.find(p=>String(p.id)===String(id));
    if(!c)return;
    const info=document.querySelector('#profileContent .cp-info');
    if(!info)return;
    let box=document.getElementById('tpPerfilPersonas');
    if(!box){
      box=document.createElement('div');
      box.id='tpPerfilPersonas';
      box.className='u-mt-8';
      info.appendChild(box);
    }
    box.innerHTML='<div class="u-fs-micro u-fw-600 u-c-slate-600 u-mb-4">Personas y equipo</div>'+tpPersonasChips(c)+
      '<div class="u-fs-micro u-fw-600 u-c-slate-600 u-mt-8 u-mb-4">Integridad de la prueba</div><div class="tp-cond">'+tpIntegridadDetalle(c)+'</div>';
  };
})();

// Encaje oferta: más peso a skills de personas si la oferta las pide.
(function(){
  const _enc=typeof encajeOferta==='function'?encajeOferta:null;
  if(!_enc)return;
  encajeOferta=function(job,c){
    const req=(job.requiredSkills||[]).map(x=>String(x));
    const persReq=req.filter(tpEsPersonaSkill);
    const techReq=req.filter(x=>!tpEsPersonaSkill(x));
    if(!persReq.length)return _enc(job,c);
    const tiene=new Set((c.skills||[]).map(s=>String(s.n).toLowerCase()));
    const match=(arr)=>arr.length?arr.filter(x=>tiene.has(x.toLowerCase())).length/arr.length:1;
    const p=match(persReq),t=match(techReq);
    const cd=c.cond||{};
    const ok=(lista,v)=>!v||!(lista&&lista.length)?null:lista.includes(v);
    const jor=ok(cd.jornadas,job.jornada),mod=ok(cd.modalidades,job.modalidad);
    const cond=[jor,mod].filter(x=>x!==null);
    const pctCond=cond.length?cond.filter(Boolean).length/cond.length:1;
    const skills=req.length?(p*persReq.length+t*techReq.length)/req.length:0;
    return {pct:Math.round((p*0.4+t*0.3+pctCond*0.3)*100),skills,jor,mod,personas:p};
  };
})();

// ── Preguntas de vacante al publicar ──
function tpLeerPreguntasVacante(){
  return [1,2,3].map(i=>{
    const el=document.getElementById('pj-q'+i);
    return el?(el.value||'').trim().slice(0,200):'';
  }).filter(Boolean);
}

(function(){
  if(typeof TPCloud==='undefined')return;
  publishJob=async function(){
    if(!tpCompany){toast('Inicia sesión con tu cuenta de empresa para publicar ofertas.');return;}
    const v=id=>(document.getElementById(id).value||'').trim();
    const datos={
      title:v('pj-title'),sector:v('pj-sector'),description:v('pj-desc'),
      requiredSkills:pjReqSkills.slice(),tags:pjSkills.slice(0,6),requiredLevel:pjLevel,exerciseConfig:pjExConfigVal,
      jornada:v('pj-jornada'),modalidad:v('pj-mode'),contrato:v('pj-contrato'),ubicacion:v('pj-city'),
      salMin:Number(v('pj-sal-min'))||null,salMax:Number(v('pj-sal-max'))||null,
      cultureQuestions:tpLeerPreguntasVacante()
    };
    if(!datos.title||!datos.sector||datos.description.length<20){toast('Faltan el título, el sector o una descripción de al menos 20 caracteres.');return;}
    if(!datos.requiredSkills.length){toast('Selecciona al menos un skill requerido.');return;}
    if(datos.salMin&&datos.salMax&&datos.salMin>datos.salMax){toast('El salario mínimo no puede superar al máximo.');return;}
    if(datos.modalidad!=='remoto'&&!datos.ubicacion){toast('Indica la ubicación: la oferta no es 100 % remota.');return;}
    const pedidoAMedida=datos.exerciseConfig==='contact';
    const r=await TPCloud._postAuth('save-job',datos);
    if(!r||r.error){toast('No se pudo publicar: '+((r&&(r.error||r.details))||'error desconocido'));return;}
    pjSkills=[];pjReqSkills=[];pjExConfigVal='common+custom';pjLevel='basico';
    ['pj-title','pj-desc','pj-sal-min','pj-sal-max','pj-city','pj-q1','pj-q2','pj-q3'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    try{renderPjTags();renderPjSkills&&renderPjSkills();}catch(e){}
    togglePostJob();
    await Promise.all([TPOfertas.cargar(),TPOfertas.cargarMias()]);
    renderEmpJobs();
    toast(pedidoAMedida?'Oferta publicada. Has pedido ejercicios a medida: te escribimos en 24 h para diseñarlos.':'Oferta publicada. Ya la ven los candidatos.','ok');
  };
})();

// Mostrar preguntas de vacante en ficha de oferta (candidato).
(function(){
  // Se engancha cuando se abre un job; openJob está en 08.
  const _open=typeof openJob==='function'?openJob:null;
  if(!_open)return;
  openJob=function(id){
    const r=_open.apply(this,arguments);
    const j=JOBS.concat(typeof empPostedJobs!=='undefined'?empPostedJobs:[]).find(x=>String(x.id)===String(id))
      ||(window.TPOfertas&&TPOfertas.mias||[]).find(x=>String(x.id)===String(id));
    const qs=j&&j.cultureQuestions;
    let el=document.getElementById('tpJobCultureQs');
    const host=document.getElementById('jobModal')||document.getElementById('exContent');
    if(!qs||!qs.length){
      if(el)el.remove();
      return r;
    }
    if(!el){
      el=document.createElement('div');
      el.id='tpJobCultureQs';
      el.className='tp-culture-qs';
      const modal=document.querySelector('#jobModal .jm-body, #jobModal .job-modal-body, #jobModal');
      if(modal)modal.appendChild(el);
    }
    el.innerHTML='<div class="u-fs-micro u-fw-700 u-c-slate-600 u-tt-uppercase u-mb-8">Preguntas de esta vacante</div><ol class="tp-culture-list">'+
      qs.map(q=>`<li>${escHtml(q)}</li>`).join('')+'</ol><p class="u-fs-micro u-c-slate-500">La empresa las usa para hablar del encaje cultural en la entrevista; no son un test de personalidad.</p>';
    return r;
  };
})();

// ── Bandeja de avisos (candidato) ──
var TPInbox={
  items:[],
  async cargar(){
    if(!tpUser)return;
    try{
      const r=await TPCloud._postAuth('inbox',{});
      if(r&&Array.isArray(r.notifications))TPInbox.items=r.notifications;
    }catch(e){console.warn('[TP] inbox',e);}
    TPInbox.pintar();
  },
  pintar(){
    const box=document.getElementById('candInbox');
    if(!box)return;
    const unread=TPInbox.items.filter(n=>!n.readAt);
    if(!TPInbox.items.length){box.innerHTML='';box.hidden=true;return;}
    box.hidden=false;
    box.innerHTML=`<div class="tp-inbox"><div class="tp-inbox-head"><strong>Avisos</strong>${unread.length?`<span class="tp-inbox-badge">${unread.length}</span>`:''}<button type="button" class="btn btn-outline btn-sm" onclick="TPInbox.marcarTodos()">Marcar leídos</button></div>`+
      TPInbox.items.slice(0,8).map(n=>`<div class="tp-inbox-item${n.readAt?'':' is-new'}"><div class="tp-inbox-title">${escHtml(n.title)}</div><div class="tp-inbox-body">${escHtml(n.body)}</div><div class="tp-inbox-meta">${n.createdAt?new Date(n.createdAt).toLocaleString('es-ES'):''}</div></div>`).join('')+'</div>';
  },
  async marcarTodos(){
    const ids=TPInbox.items.filter(n=>!n.readAt).map(n=>n.id);
    if(!ids.length)return;
    try{await TPCloud._postAuth('inbox',{markRead:ids});}catch(e){}
    await TPInbox.cargar();
  }
};
(function(){
  const _open=typeof openDashCand==='function'?openDashCand:null;
  if(!_open)return;
  openDashCand=function(){
    const r=_open.apply(this,arguments);
    TPInbox.cargar();
    return r;
  };
})();

// ── Mini-pipeline en candidatos de oferta ──
var TPApps={
  byJob:{},
  async cargar(jobId){
    try{
      const r=await TPCloud._postAuth('applications',{jobId:String(jobId)});
      TPApps.byJob[jobId]=Array.isArray(r&&r.applications)?r.applications:[];
    }catch(e){TPApps.byJob[jobId]=[];}
    return TPApps.byJob[jobId];
  },
  estadoDe(jobId,ref){
    const a=(TPApps.byJob[jobId]||[]).find(x=>String(x.candidateRef)===String(ref));
    return a?a.status:'';
  },
  async set(jobId,ref,status){
    let reason='';
    if(status==='descartado'){
      reason=window.prompt('Motivo del descarte (obligatorio, queda registrado):','')||'';
      if(reason.trim().length<3){toast('Hace falta un motivo para descartar.');return;}
    }
    const r=await TPCloud._postAuth('applications',{jobId,candidateRef:ref,status,reason});
    if(r&&r.error){toast(r.error);return;}
    await TPApps.cargar(jobId);
    if(typeof showOfferCandidates==='function')showOfferCandidates(jobId);
  }
};

(function(){
  const _show=typeof showOfferCandidates==='function'?showOfferCandidates:null;
  if(!_show)return;
  showOfferCandidates=async function(jobId){
    await TPApps.cargar(jobId);
    _show(jobId);
    // Añadir selectores de etapa a cada tarjeta.
    const list=document.getElementById('empOfferCandList');
    if(!list)return;
    list.querySelectorAll('.offer-cand-card').forEach(card=>{
      const btn=card.querySelector('[onclick*="unlockContact"],[onclick*="showContactCard"]');
      const m=(btn&&btn.getAttribute('onclick')||'').match(/'([^']+)'/);
      const ref=m&&m[1];
      if(!ref)return;
      const cur=TPApps.estadoDe(jobId,ref)||'';
      const sel=document.createElement('div');
      sel.className='tp-pipeline';
      sel.innerHTML='<label class="u-fs-micro">Etapa <select aria-label="Etapa del proceso">'+
        `<option value="">—</option>`+
        Object.entries(TP_APP_ESTADOS).map(([k,t])=>`<option value="${k}"${k===cur?' selected':''}>${t}</option>`).join('')+
        '</select></label>';
      sel.querySelector('select').onchange=function(){if(this.value)TPApps.set(jobId,ref,this.value);};
      const actions=card.querySelector('.oc-actions')||card;
      actions.appendChild(sel);
    });
    // Preguntas de la vacante en cabecera
    const job=JOBS.concat(window.TPOfertas&&TPOfertas.mias||[]).find(j=>String(j.id)===String(jobId));
    const title=document.getElementById('empOfferCandTitle');
    if(title&&job&&job.cultureQuestions&&job.cultureQuestions.length){
      let q=document.getElementById('tpOfferQs');
      if(!q){q=document.createElement('div');q.id='tpOfferQs';q.className='tp-culture-qs u-mt-8';title.parentNode.insertBefore(q,title.nextSibling);}
      q.innerHTML='<div class="u-fs-micro u-fw-600">Preguntas de la vacante</div><ol class="tp-culture-list">'+job.cultureQuestions.map(x=>`<li>${escHtml(x)}</li>`).join('')+'</ol>';
    }
  };
})();
