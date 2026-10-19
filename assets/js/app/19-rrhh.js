// TalentPact · 19-rrhh
// Dos bloques: Hard skills (técnica) y Soft skills (6 dimensiones) + preguntas, dilemas, avisos y pipeline.
// Script clásico: ámbito global compartido (ver assets/js/README.md).
// Espejo de netlify/functions/lib/personas.js. Los filtros del catálogo de retos
// (pilar → dimensión o área) están en 23-clasificacion.js.

// Soft si la skill tiene dimensión en el diccionario (01b-taxonomia); si no, técnica.
var TP_FAMILIA_LABEL={hard:'Hard skills',soft:'Soft skills'};
var TP_APP_ESTADOS={
  aplicado:'Aplicado',retos:'Retos',preseleccionado:'Preseleccionado',
  entrevista:'Entrevista',contratado:'Contratado',descartado:'Descartado'
};

function tpFamiliaAptitud(n){
  const s=String(n||'').trim();
  if(!s)return null;
  return typeof tpDimensionDeSkill==='function'&&tpDimensionDeSkill(s)?'soft':'hard';
}
function tpEsPersonaSkill(n){return tpFamiliaAptitud(n)==='soft';}
function tpSegmentoReto(ce){return ce&&tpFamiliaAptitud(ce.skill)||'hard';}

/** Chips de Soft skills (+ integridad) para pool / ficha. */
function tpPersonasChips(c){
  const list=(c&&c.personas&&c.personas.length)?c.personas
    :(c&&c.skills||[]).filter(s=>tpEsPersonaSkill(s.n)).sort((a,b)=>b.v-a.v).slice(0,5);
  if(!list.length)return '<div class="tp-cond"><span class="tp-cond-chip muted">Sin soft skills aún</span></div>';
  return '<div class="tp-cond">'+list.map(s=>`<span class="tp-cond-chip tp-chip-personas">${escHtml(s.n)}: ${s.v}</span>`).join('')+'</div>';
}
function tpIntegridadDetalle(c){
  if(!c||!c.integ)return '<span class="u-c-slate-400">Sin informe de integridad</span>';
  const txt={bajo:'Riesgo bajo',medio:'Riesgo medio',alto:'Riesgo alto'}[c.integ]||c.integ;
  return `<span class="tp-risk r-${c.integ}">${txt}</span>${c.verified?' <span class="tp-verified">Notas verificadas</span>':''}<span class="u-fs-micro u-c-slate-500"> · No descarta solo: revisión humana</span>`;
}

function tpReintentarPool(){TPPool.estado='cargando';renderEmpPool();TPPool.cargar().then(renderEmpPool);}

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
    let h=`<div class="tp-filterbar"><label>Jornada <select onchange="TP_POOL_FILTRO.jornada=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.jornadas,f.jornada)}</select></label><label>Modalidad <select onchange="TP_POOL_FILTRO.modalidad=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.modalidades,f.modalidad)}</select></label><label class="tp-filter-check"><input type="checkbox"${f.soloVerificados?' checked':''} onchange="TP_POOL_FILTRO.soloVerificados=this.checked;renderEmpPool()"> Solo notas verificadas</label><label class="tp-filter-check"><input type="checkbox"${f.soloPersonas?' checked':''} onchange="TP_POOL_FILTRO.soloPersonas=this.checked;renderEmpPool()"> Con soft skills</label><span class="tp-filter-count">${lista.length} de ${CANDIDATES.length}</span></div>${window.TPPool&&TPPool.aviso()?`<div class="tp-pool-aviso">${escHtml(TPPool.aviso())}${TPPool.estado==='error'?' <button type="button" class="btn btn-outline btn-sm" onclick="tpReintentarPool()">Reintentar</button>':''}</div>`:''}`;
    h+='<div class="tp-tabla-scroll"><table class="dash-table"><thead><tr><th>Candidato</th><th>Sector</th><th>Score</th><th>Soft skills</th><th>Condiciones</th><th>Integridad</th><th>Hard skills</th><th></th></tr></thead><tbody>';
    lista.forEach(c=>{
      const tech=(c.skills||[]).filter(s=>!tpEsPersonaSkill(s.n)).slice(0,2);
      const integ=tpIntegridadDetalle(c);
      h+=`<tr><td><div class="u-d-flex u-ai-center u-gap-8"><div class="dash-avatar u-bg-emerald-100 u-c-emerald-600">${escHtml(c.i)}</div>${escHtml(String(c.alias||'').replace(/^Candidato /,''))}</div></td><td>${escHtml(c.sector)}</td><td><strong class="u-c-emerald-600">${c.score}</strong></td><td>${tpPersonasChips(c)}</td><td>${tpPoolCondChips(c.cond)}</td><td>${integ}</td><td>${tech.length?tech.map(s=>`<span class="job-tag">${escHtml(s.n)}: ${s.v}</span>`).join(' '):'<span class="u-c-slate-400">—</span>'}</td><td><button class="btn btn-primary btn-sm" onclick="viewProfile('${escHtml(c.id)}')">${c._unlocked?'Ver contacto':'Ver perfil'}</button></td></tr>`;
    });
    if(!lista.length)h+='<tr><td colspan="8"><div class="tp-empty">'+(CANDIDATES.length?'Ningún candidato cumple esos filtros.':'Todavía no hay candidatos en el pool.')+'</div></td></tr>';
    h+='</tbody></table></div>';
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
    const hard=(c.skills||[]).filter(s=>!tpEsPersonaSkill(s.n)).sort((a,b)=>b.v-a.v).slice(0,5);
    box.innerHTML='<div class="u-fs-micro u-fw-600 u-c-slate-600 u-mb-4">Soft skills</div>'+tpPersonasChips(c)+
      (hard.length?'<div class="u-fs-micro u-fw-600 u-c-slate-600 u-mt-8 u-mb-4">Hard skills</div><div class="tp-cond">'+hard.map(s=>`<span class="tp-cond-chip">${escHtml(s.n)}: ${s.v}</span>`).join('')+'</div>':'')+
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
    // Personas pesa más que técnico (40/30), pero si la oferta no pide técnico
    // ese 30 % no se regala: los 70 puntos de skills van enteros a personas.
    const pesoSkills=techReq.length?p*0.4+t*0.3:p*0.7;
    return {pct:skills?Math.round((pesoSkills+pctCond*0.3)*100):0,skills,jor,mod,personas:p};
  };
})();

// ── Preguntas y dilemas al publicar ──
function tpLeerPreguntasVacante(){
  return [1,2,3].map(i=>{
    const el=document.getElementById('pj-q'+i);
    return el?(el.value||'').trim().slice(0,200):'';
  }).filter(Boolean);
}
function tpLeerDilemasVacante(){
  return [1,2,3].map(i=>{
    const el=document.getElementById('pj-d'+i);
    return el?(el.value||'').trim().slice(0,600):'';
  }).filter(Boolean);
}
function tpLeerRespuestasDilema(){
  return [1,2,3].map(i=>{
    const el=document.getElementById('tp-dil-a'+i);
    return el?(el.value||'').trim().slice(0,2000):'';
  }).filter(Boolean);
}

// publishJob (17-ofertas-reales.js) envía cultureQuestions + dilemmas.

// Mostrar preguntas y dilemas en ficha de oferta (candidato).
(function(){
  const _open=typeof openJob==='function'?openJob:null;
  if(!_open)return;
  openJob=function(id){
    const r=_open.apply(this,arguments);
    const j=JOBS.concat(typeof empPostedJobs!=='undefined'?empPostedJobs:[]).find(x=>String(x.id)===String(id))
      ||(window.TPOfertas&&TPOfertas.mias||[]).find(x=>String(x.id)===String(id));
    const qs=j&&j.cultureQuestions;
    const ds=j&&j.dilemmas;
    let el=document.getElementById('tpJobCultureQs');
    if((!qs||!qs.length)&&(!ds||!ds.length)){
      if(el)el.remove();
      return r;
    }
    if(!el){
      const desc=document.getElementById('jmDesc');
      if(!desc)return r;
      el=document.createElement('div');
      el.id='tpJobCultureQs';
      el.className='tp-culture-qs u-mt-8';
      desc.insertAdjacentElement('afterend',el);
    }
    let html='';
    if(qs&&qs.length){
      html+='<div class="u-fs-micro u-fw-700 u-c-slate-600 u-tt-uppercase u-mb-8">Preguntas de esta vacante</div><ol class="tp-culture-list">'+
        qs.map(q=>`<li>${escHtml(q)}</li>`).join('')+'</ol><p class="u-fs-micro u-c-slate-500 u-mb-12">La empresa las usa en la entrevista; no son un test de personalidad.</p>';
    }
    if(ds&&ds.length){
      html+='<div class="u-fs-micro u-fw-700 u-c-slate-600 u-tt-uppercase u-mb-8">Dilemas del día a día</div><ol class="tp-culture-list">'+
        ds.map(d=>`<li>${escHtml(d)}</li>`).join('')+'</ol><p class="u-fs-micro u-c-slate-500">Al postularte responderás cómo actuarías en estas situaciones.</p>';
    }
    el.innerHTML=html;
    return r;
  };
})();

// ── Bandeja de avisos (candidato) ──
var TPInbox={
  items:[],
  /** Candidato → #candInbox; empresa → #empInbox (los avisos se guardan por cuenta). */
  caja(){return document.getElementById(tpCompany&&!tpUser?'empInbox':'candInbox');},
  async cargar(){
    if(!tpUser&&!tpCompany)return;
    try{
      const r=await TPCloud._postAuth('inbox',{});
      if(r&&Array.isArray(r.notifications))TPInbox.items=r.notifications;
    }catch(e){console.warn('[TP] inbox',e);}
    TPInbox.pintar();
  },
  pintar(){
    const box=TPInbox.caja();
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
  const _open=typeof openDashEmp==='function'?openDashEmp:null;
  if(!_open)return;
  openDashEmp=function(){
    const r=_open.apply(this,arguments);
    TPInbox.cargar();
    return r;
  };
})();
(function(){
  const _open=typeof openDashCand==='function'?openDashCand:null;
  if(!_open)return;
  openDashCand=function(){
    const r=_open.apply(this,arguments);
    TPInbox.cargar();
    if(typeof TPPostulaciones!=='undefined')TPPostulaciones.cargar().then(()=>{try{renderCandOfertas();renderJobMatches();}catch(e){}});
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
  /** Diálogo propio (accesible) para el motivo de descarte. Devuelve el texto o null. */
  pedirMotivo(){
    return new Promise(res=>{
      const d=document.createElement('dialog');
      d.className='tp-dialogo';
      d.innerHTML='<form method="dialog"><h3>Motivo del descarte</h3><p>Es obligatorio y queda registrado: nadie queda fuera sin una razón que una persona pueda revisar.</p><label class="sr-only" for="tpMotivo">Motivo</label><textarea id="tpMotivo" rows="3" minlength="3" maxlength="300" required></textarea><div class="tp-dialogo-acc"><button type="button" class="btn btn-outline" data-r="no">Cancelar</button><button type="submit" class="btn btn-dark" value="ok">Descartar</button></div></form>';
      document.body.appendChild(d);
      const fin=v=>{d.close();d.remove();res(v);};
      d.querySelector('[data-r=no]').onclick=()=>fin(null);
      d.addEventListener('cancel',e=>{e.preventDefault();fin(null);});
      d.querySelector('form').onsubmit=e=>{e.preventDefault();fin(d.querySelector('textarea').value);};
      d.showModal();d.querySelector('textarea').focus();
    });
  },
  async set(jobId,ref,status){
    let reason='';
    if(status==='descartado'){
      reason=await TPApps.pedirMotivo();
      if(reason===null){await TPApps.cargar(jobId);showOfferCandidates(jobId);return;}
      if(reason.trim().length<3){toast('Hace falta un motivo para descartar.');await TPApps.cargar(jobId);showOfferCandidates(jobId);return;}
    }
    const r=await TPCloud._postAuth('applications',{jobId,candidateRef:ref,status,reason});
    // Si no se guarda, el desplegable no puede quedarse mostrando la etapa nueva.
    if(!r||r.error){toast('No se ha guardado la etapa: '+((r&&r.error)||'sin respuesta del servidor'));await TPApps.cargar(jobId);showOfferCandidates(jobId);return;}
    toast(status==='descartado'?'Candidatura descartada. El motivo queda registrado.':'Etapa actualizada: '+(TP_APP_ESTADOS[status]||status)+'.','ok');
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
      const ref=card.dataset.ref; // la etapa no depende de si el candidato acepta contacto
      if(!ref)return;
      const cur=TPApps.estadoDe(jobId,ref)||'';
      if(cur){const h4=card.querySelector('h4');if(h4)h4.insertAdjacentHTML('afterend','<div class="tp-postulado">'+tpChip(cur==='aplicado'?'Se ha postulado':(TP_APP_ESTADOS[cur]||cur),cur==='descartado'?'error':'info')+'</div>');}
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
    // Postulaciones de candidatos que no salen en la lista (no están visibles en el pool).
    const visibles=new Set([...list.querySelectorAll('.offer-cand-card')].map(c=>String(c.dataset.ref)));
    const ocultas=(TPApps.byJob[jobId]||[]).filter(a=>!visibles.has(String(a.candidateRef))).length;
    let aviso=document.getElementById('tpOfertaOcultas');
    if(aviso)aviso.remove();
    if(ocultas){
      aviso=document.createElement('div');aviso.id='tpOfertaOcultas';aviso.className='tp-integrity-note info';
      aviso.textContent=ocultas+(ocultas===1?' candidato se ha postulado pero no aparece':' candidatos se han postulado pero no aparecen')+' en esta lista porque ha ocultado su perfil del pool. La postulación sigue guardada.';
      list.prepend(aviso);
    }
    // Preguntas y dilemas de la vacante en cabecera
    const job=JOBS.concat(window.TPOfertas&&TPOfertas.mias||[]).find(j=>String(j.id)===String(jobId));
    const title=document.getElementById('empOfferCandTitle');
    const previas=document.getElementById('tpOfferQs');
    const hayQs=job&&job.cultureQuestions&&job.cultureQuestions.length;
    const hayDs=job&&job.dilemmas&&job.dilemmas.length;
    if(previas&&!hayQs&&!hayDs)previas.remove();
    if(title&&(hayQs||hayDs)){
      let q=document.getElementById('tpOfferQs');
      if(!q){q=document.createElement('div');q.id='tpOfferQs';q.className='tp-culture-qs u-mb-12';title.parentNode.insertAdjacentElement('afterend',q);}
      let h='';
      if(hayQs)h+='<div class="u-fs-micro u-fw-600">Preguntas de la vacante</div><ol class="tp-culture-list">'+job.cultureQuestions.map(x=>`<li>${escHtml(x)}</li>`).join('')+'</ol>';
      if(hayDs)h+='<div class="u-fs-micro u-fw-600'+(hayQs?' u-mt-8':'')+'">Dilemas del día a día</div><ol class="tp-culture-list">'+job.dilemmas.map(x=>`<li>${escHtml(x)}</li>`).join('')+'</ol>';
      q.innerHTML=h;
    }
    // Respuestas a dilemas en cada tarjeta de postulado
    list.querySelectorAll('.offer-cand-card').forEach(card=>{
      const ref=card.dataset.ref;
      if(!ref)return;
      const app=(TPApps.byJob[jobId]||[]).find(x=>String(x.candidateRef)===String(ref));
      const ans=app&&app.dilemmaAnswers;
      let box=card.querySelector('.tp-dil-answers');
      if(!ans||!ans.length){if(box)box.remove();return;}
      if(!box){box=document.createElement('div');box.className='tp-dil-answers tp-culture-qs u-mt-8';(card.querySelector('.oc-actions')||card).insertAdjacentElement('beforebegin',box);}
      box.innerHTML='<div class="u-fs-micro u-fw-600 u-mb-4">Respuestas a dilemas</div>'+ans.map(a=>`<div class="u-mb-8"><div class="u-fs-micro u-c-slate-500">${escHtml(a.prompt)}</div><div class="u-fs-peq">${escHtml(a.answer)}</div></div>`).join('');
    });
  };
})();
