// TalentPact · 08-ofertas-y-ejercicios
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ RENDER ═══
// Monograma de empresa: iniciales sobre un tono estable derivado del nombre.
// Sustituye a los emoji de color que se usaban como logotipo.
const TP_MONO_TINTES=6; // tintes definidos en componentes.css (.tp-tinte-0 … 5)
function companyMonogram(nombre){
  const n=String(nombre||'').trim();
  // Nombres de una sola palabra en CamelCase (GrowthLab, TechCorp) dan una
  // inicial sola y quedan pobres: se aprovechan sus mayusculas internas.
  const palabras=n.split(/[\s·-]+/).filter(Boolean);
  let iniciales;
  if(palabras.length>1){
    iniciales=palabras.slice(0,2).map(w=>w[0]).join('');
  }else{
    const mayus=(palabras[0]||'').match(/[A-ZÁÉÍÓÚÑ]/g)||[];
    iniciales=mayus.length>1?mayus.slice(0,2).join(''):(palabras[0]||'??').slice(0,2);
  }
  iniciales=(iniciales||'??').toUpperCase();
  let h=0; for(let k=0;k<n.length;k++)h=(h*31+n.charCodeAt(k))>>>0;
  return {iniciales,tinte:h%TP_MONO_TINTES};
}

// Cuántas ofertas se ven antes de pulsar "Ver todas".
const JOBS_VISIBLES=6;
let _jobsExpandido=false;
function toggleJobs(){_jobsExpandido=!_jobsExpandido;renderJobs(_ultimasOfertas);if(!_jobsExpandido){const el=document.getElementById('jobsGrid');if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-90,behavior:'smooth'});}}
let _ultimasOfertas=[];
// Tarjeta de oferta (portada y panel del candidato). Todo lo que viene de la base
// de datos se escapa: nombres de empresa y skills los escriben las empresas.
const TP_SECTOR_ES={IT:'Tecnología',Data:'Datos',Business:'Negocio',Design:'Diseño',Finance:'Finanzas',Ops:'Operaciones',Sales:'Ventas',Languages:'Idiomas'};
function tpTarjetaOferta(j,co,o){
  o=o||{};
  const req=j.requiredSkills||[],MAX=4;
  const nivel=j.requiredLevel||'basico';
  const nivelTxt={basico:'Básico',intermedio:'Intermedio',avanzado:'Avanzado'}[nivel]||'Básico';
  const m=co?companyMonogram(co.name):null;
  const empresa=co?`<div class="tp-oferta-emp"><span class="tp-mono-mini tp-tinte-${m.tinte}" aria-hidden="true">${escHtml(m.iniciales)}</span><span>${escHtml(co.name)}${co.size&&co.size!=='—'?' · '+escHtml(co.size)+' empleados':''}</span>${co.verificacion&&co.verificacion!=='sin_verificar'&&typeof tpSelloEmpresa==='function'?tpSelloEmpresa(co.verificacion):''}</div>`:'';
  const nom=x=>typeof tpSkillNombre==='function'?tpSkillNombre(x):x;
  const sk=req.slice(0,MAX).map(x=>`<span class="job-tag tp-skill-req ${o.tiene&&o.tiene(x)?'ok':''}">${o.tiene&&o.tiene(x)?'✓ ':''}${escHtml(nom(x))}</span>`).join('')+(req.length>MAX?`<span class="job-tag" title="${escHtml(req.slice(MAX).map(nom).join(', '))}">+${req.length-MAX}</span>`:'');
  // Área funcional del puesto (y especialidad si la hay); las ofertas antiguas la deducen de su sector.
  const area=typeof tpAreaDeOferta==='function'?tpAreaDeOferta(j):null;
  const esp=j.especialidad&&j.especialidad!==tpAreaNombre(area)?j.especialidad:'';
  const areaTxt=area?tpAreaNombre(area,true)+(esp?' · '+esp:''):(TP_SECTOR_ES[j.sector]||j.sector);
  const pie=o.pie||`<span class="level-badge level-${escHtml(nivel)}">${nivelTxt}</span>`;
  return `<div class="job-card tp-oferta" role="button" tabindex="0" onclick="${o.click}" onkeydown="if(event.key==='Enter')${o.click}">${empresa}<div class="tp-oferta-sector">${escHtml(areaTxt)}</div><h3>${escHtml(j.title)}</h3><div class="job-desc">${escHtml(j.desc)}</div>${tpCondChips(j,o.prefs)}<div class="job-tags">${sk}</div><div class="tp-oferta-pie">${pie}</div></div>`;
}
function renderJobs(list){_ultimasOfertas=list;const g=document.getElementById('jobsGrid'),nr=document.getElementById('noResults');const total=list.length;document.getElementById('resultsCount').textContent=`${total} oferta${total!==1?'s':''} de empresas`;if(!total){g.innerHTML='';nr.style.display='block';const m0=document.getElementById('jobsMore');if(m0)m0.innerHTML='';return;}nr.style.display='none';const visibles=_jobsExpandido?list:list.slice(0,JOBS_VISIBLES);const more=document.getElementById('jobsMore');if(more){more.innerHTML=total>JOBS_VISIBLES?`<button class="btn btn-outline" onclick="toggleJobs()">${_jobsExpandido?'Ver menos':'Ver las '+total+' ofertas'}</button>`:'';}g.innerHTML=visibles.map(j=>{const co=COMPANIES.find(c=>c.id===j.company);const req=j.requiredSkills||[];const reqLevel=j.requiredLevel||'basico';const levelLabel=reqLevel==='avanzado'?'Avanzado':reqLevel==='intermedio'?'Intermedio':'Básico';const levelCls='level-'+reqLevel;const configLabel=j.exerciseConfig==='common+custom'?'Comunes + personalizados':j.exerciseConfig==='custom'?'Personalizados':j.exerciseConfig==='contact'?'A medida':'Comunes';const configCls=j.exerciseConfig==='common+custom'?'ecb-common':j.exerciseConfig==='custom'?'ecb-custom':'ecb-contact';return tpTarjetaOferta(j,co,{click:"openAuth('candidate')",prefs:(typeof tpUser!=='undefined'&&tpUser)?undefined:null});}).join('');}
// Ofertas visibles para los candidatos: se excluyen las de cuentas pausadas.
function publicJobs(){ return empPostedJobs.filter(j=>!j.paused); }
// Filtro por área funcional (como LinkedIn: el puesto, no el sector de la empresa).
// La búsqueda encuentra también por el nombre del área, la especialidad y el
// nombre visible de las skills.
function filterJobs(){const q=document.getElementById('searchInput').value.toLowerCase().trim();document.getElementById('searchClear').classList.toggle('show',q.length>0);let l=JOBS.concat(publicJobs());if(currentSector!=='all')l=l.filter(j=>tpAreaDeOferta(j)===currentSector);if(q)l=l.filter(j=>j.title.toLowerCase().includes(q)||tpAreaNombre(tpAreaDeOferta(j)).toLowerCase().includes(q)||String(j.especialidad||'').toLowerCase().includes(q)||j.desc.toLowerCase().includes(q)||(j.tags||[]).some(t=>t.toLowerCase().includes(q))||(j.requiredSkills||[]).some(s=>tpSkillCoincide(s,q)));renderJobs(l);}
function setSector(s,btn){currentSector=s;document.querySelectorAll('#sectorFilters .filter-btn').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});btn.classList.add('active');btn.setAttribute('aria-pressed','true');filterJobs();}
function clearSearch(){document.getElementById('searchInput').value='';document.getElementById('searchClear').classList.remove('show');filterJobs();}

// ═══ JOB MODAL ═══
function openJob(id){
  const j=JOBS.concat(empPostedJobs).find(x=>x.id===id);if(!j)return;
  activeJob=j;currentEx=0;exResults={};_exState={};
  const co=COMPANIES.find(c=>c.id===j.company);
  document.getElementById('jmBadge').className='job-badge '+(j.badge||'jb-it');
  document.getElementById('jmBadge').textContent=j.sector;
  document.getElementById('jmTitle').textContent=j.title;
  document.getElementById('jmDesc').textContent=j.desc;
  
  // If common exercise, go directly to exercises
  if(j._isCommon){
    const el=getExercises(j);
    document.getElementById('jmProgress').innerHTML=el.map((_,i)=>`<div class="prog-dot${i===0?' active':''}" id="pd${i}"></div>`).join('')+`<span class="prog-lbl">${el.length} ejercicios</span>`;
    document.getElementById('exNav').innerHTML=el.map((e,i)=>`<button class="ex-tab${i===0?' active':''}" onclick="switchEx(${i})"><span class="ex-tab-num">${e.num}</span>${e.title.length>18?e.title.slice(0,18)+'…':e.title}</button>`).join('');
    renderEx(el,0);
    document.getElementById('jobModal').classList.add('open');document.getElementById('jobModal').scrollTop=0;
    return;
  }
  
  // Show skills-check apply screen
  const required=j.requiredSkills||[];
  const reqLevel=j.requiredLevel||'basico';
  const levelThreshold=reqLevel==='avanzado'?75:reqLevel==='intermedio'?50:30;
  const levelLabel=reqLevel==='avanzado'?'Avanzado':reqLevel==='intermedio'?'Intermedio':'Básico';
  const levelCls='level-'+reqLevel;
  
  const has=required.filter(s=>{
    const sk=candidateProfile.skills[s];
    return sk?.unlocked&&sk.score>=levelThreshold;
  });
  const missing=required.filter(s=>{
    const sk=candidateProfile.skills[s];
    return !sk?.unlocked||sk.score<levelThreshold;
  });
  const hasAll=missing.length===0&&required.length>0;
  
  const configLabel=j.exerciseConfig==='common+custom'?'Retos comunes + personalizados':j.exerciseConfig==='custom'?'Retos personalizados por la empresa':j.exerciseConfig==='contact'?'Ejercicios diseñados a medida':'Retos de la plataforma';
  const configBadge=j.exerciseConfig==='common+custom'?'ecb-common':j.exerciseConfig==='custom'?'ecb-custom':'ecb-contact';
  
  document.getElementById('jmProgress').innerHTML='';
  document.getElementById('exNav').innerHTML='';
  
  let skillsHTML='';
  has.forEach(s=>{
    const sc=candidateProfile.skills[s]?.score||0;
    skillsHTML+=`<div class="apply-skill-row has"><div class="ask-icon ok">✓</div><div class="ask-info"><h4>${escHtml(s)}</h4><p>Nivel ${levelLabel} alcanzado</p></div><div class="ask-score high">${tpBandaHtml(sc,true)}</div></div>`;
  });
  missing.forEach(s=>{
    const sk=candidateProfile.skills[s];
    const isUnlockedButLow=sk?.unlocked&&sk.score<levelThreshold;
    const commonEx=COMMON_EXERCISES.find(ce=>ce.skill===s);
    if(isUnlockedButLow){
      skillsHTML+=`<div class="apply-skill-row missing"><div class="ask-icon need">↑</div><div class="ask-info"><h4>${escHtml(s)}</h4><p>Tu banda (${tpBanda(sk.score).txt}, ${sk.score}) no alcanza la que pide la oferta (${tpBanda(levelThreshold).txt}). Repite el reto para mejorar.</p></div><div class="ask-score pending">${tpBandaHtml(sk.score,true)}</div><div class="ask-action">${commonEx?`<button class="btn btn-primary btn-sm" onclick="goToCommonFromApply('${commonEx.id}','${j.id}')">Repetir reto →</button>`:''}</div></div>`;
    }else{
      skillsHTML+=`<div class="apply-skill-row missing"><div class="ask-icon need">!</div><div class="ask-info"><h4>${escHtml(s)}</h4><p>Necesitas completar este reto (la oferta pide ${tpBanda(levelThreshold).txt} o más)</p></div><div class="ask-score pending">Pendiente</div><div class="ask-action">${commonEx?`<button class="btn btn-primary btn-sm" onclick="goToCommonFromApply('${commonEx.id}','${j.id}')">Hacer reto →</button>`:`<span class="ex-config-badge ecb-contact">Próximamente</span>`}</div></div>`;
    }
  });
  
  let summaryHTML='';
  if(hasAll){
    summaryHTML=`<div class="apply-summary u-bc-emerald-200 u-bg-emerald-50"><div class="apply-summary-icon">${tpIcon('check-circle')}</div><div class="apply-summary-text"><h4 class="u-c-emerald-600">¡Cumples todos los requisitos!</h4><p>Tienes todos los skills al nivel ${levelLabel} o superior. Puedes aplicar directamente.</p></div></div>`;
  }else{
    summaryHTML=`<div class="apply-summary"><div class="apply-summary-icon">${tpIcon('zap')}</div><div class="apply-summary-text"><h4>Te faltan ${missing.length} skill${missing.length>1?'s':''} al nivel requerido</h4><p>Esta oferta pide nivel <span class="level-badge ${levelCls}">${levelLabel}</span> (score ≥${levelThreshold}) en cada skill.</p></div></div>`;
  }
  
  document.getElementById('exContent').innerHTML=`<div class="apply-screen">
    ${co?`<div class="apply-company"><div class="apply-company-logo">${escHtml(co.logo||"")}</div><div class="apply-company-info"><h4>${escHtml(co.name)}</h4><p>${escHtml(co.size)} empleados · ${escHtml(co.sector||"")}</p></div><div class="u-d-flex u-gap-6 u-ml-auto u-ai-center"><span class="level-badge ${levelCls}">Nivel ${levelLabel}</span><div class="ex-config-badge ${configBadge}">${configLabel}</div></div></div>`:''}
    ${summaryHTML}
    <div class="apply-section-title">Skills requeridos — Nivel ${levelLabel} (${has.length}/${required.length} cumplidos)</div>
    <div class="apply-skills-list">${skillsHTML}</div>
    ${hasAll?`<div class="u-mb-16"><div class="apply-section-title">Retos adicionales de la empresa</div>
      ${j.exerciseConfig==='common+custom'||j.exerciseConfig==='custom'?`<p class="u-fs-micro u-c-slate-500 u-mb-12">Esta empresa también tiene retos personalizados. Completarlos mejora tu posición frente a otros candidatos.</p><button class="btn btn-primary" onclick="startJobExercises()">Completar retos de ${escHtml(co?.name||'la empresa')} →</button>
      <button class="btn btn-outline u-ml-8" onclick="applyDirectly()">Aplicar sin retos extras</button>`
      :j.exerciseConfig==='contact'?`<div class="u-bg-amber-100 u-b-1-solid-rgba-245-158-11-_2 u-r-8 u-p-12-14 u-fs-micro u-c-amber-500"><strong>Ejercicios a medida</strong><br>Esta empresa ha solicitado ejercicios diseñados específicamente para este puesto. <a href="#" onclick="openContact()" class="u-c-amber-500 u-fw-600">Contactar con TalentPact</a> para más info.</div>
      <button class="btn btn-primary u-mt-12" onclick="applyDirectly()">Aplicar con mis skills actuales →</button>`
      :`<button class="btn btn-primary" onclick="applyDirectly()">Aplicar a esta oferta →</button>`}
    </div>`:
    `<div class="u-ta-center u-p-16-0"><button class="btn btn-primary btn-lg" onclick="closeJobModal();openDashCand();setTimeout(()=>switchCandTab('common'),100)">Ir a completar retos comunes →</button></div>`}
  </div>`;
  
  document.getElementById('jobModal').classList.add('open');document.getElementById('jobModal').scrollTop=0;
}

function startJobExercises(){
  const j=activeJob;
  const el=getExercises(j);
  if(!el.length){applyDirectly();return;}
  document.getElementById('jmProgress').innerHTML=el.map((_,i)=>`<div class="prog-dot${i===0?' active':''}" id="pd${i}"></div>`).join('')+`<span class="prog-lbl">${el.length} retos</span>`;
  document.getElementById('exNav').innerHTML=el.map((e,i)=>`<button class="ex-tab${i===0?' active':''}" onclick="switchEx(${i})"><span class="ex-tab-num">${e.num}</span>${e.title.length>18?e.title.slice(0,18)+'…':e.title}</button>`).join('');
  renderEx(el,0);
}

// Postulación real: se guarda en el servidor (función apply). Antes solo se
// mostraba una pantalla de éxito y la empresa nunca recibía nada.
const TPPostulaciones={
  porOferta:{},   // jobId → etapa
  async cargar(){
    if(!tpUser)return;
    try{
      const r=await TPCloud._postAuth('apply',{});
      if(r&&Array.isArray(r.applications)){TPPostulaciones.porOferta={};r.applications.forEach(a=>{TPPostulaciones.porOferta[a.jobId]=a.status;});}
    }catch(e){console.warn('[TP] postulaciones',e);}
  },
  etapa(jobId){return TPPostulaciones.porOferta[jobId]||'';}
};
const TP_ETAPA_CANDIDATO={aplicado:'Postulación enviada',retos:'En fase de retos',preseleccionado:'Preseleccionado',entrevista:'En entrevista',contratado:'Contratado',descartado:'No continúa'};

/** Pantalla intermedia: el candidato responde los dilemas de la empresa. */
function tpPintarDilemasAplicar(j){
  const ds=(j&&j.dilemmas)||[];
  const box=document.getElementById('exContent');
  if(!box||!ds.length)return;
  box.innerHTML=`<div class="apply-screen"><div class="apply-section-title">Dilemas del día a día de esta empresa</div><p class="u-fs-peq u-c-slate-500 u-mb-16">Responde cómo actuarías. La empresa verá tus respuestas junto a tu perfil anónimo de skills.</p>`+
    ds.map((d,i)=>`<div class="pj-field u-mb-12"><label class="u-fs-micro u-fw-600" for="tp-dil-a${i+1}">Dilema ${i+1}</label><p class="u-fs-peq u-c-slate-600 u-mb-6">${escHtml(d)}</p><textarea id="tp-dil-a${i+1}" class="search-bar u-fs-peq u-p-10-12 u-bs-border-box u-w-100pct" rows="4" maxlength="2000" placeholder="Tu respuesta…"></textarea></div>`).join('')+
    `<div class="u-d-flex u-gap-10 u-mt-16"><button class="btn btn-primary" onclick="tpEnviarConDilemas()">Enviar postulación →</button><button class="btn btn-outline" onclick="closeJobModal()">Cancelar</button></div></div>`;
}

async function tpEnviarConDilemas(){
  const j=activeJob;
  const ds=(j&&j.dilemmas)||[];
  const answers=typeof tpLeerRespuestasDilema==='function'?tpLeerRespuestasDilema():[];
  if(answers.slice(0,ds.length).filter(Boolean).length<ds.length){toast('Responde los '+ds.length+' dilemas antes de postularte.');return;}
  return applyDirectly(true);
}

async function applyDirectly(dilemasOk){
  const j=activeJob,co=COMPANIES.find(c=>c.id===j.company);
  const box=document.getElementById('exContent');
  if(!tpUser){
    box.innerHTML='<div class="apply-screen u-ta-center">'+tpVacio({icono:'lock',titulo:'Inicia sesión para postularte',texto:'Tu postulación se guarda en tu cuenta y la empresa verá tu perfil anónimo de skills.',acciones:[{txt:'Iniciar sesión o crear cuenta',accion:"closeJobModal();openAuth('candidate')",tipo:'btn-primary'}]})+'</div>';
    return;
  }
  const ds=(j&&j.dilemmas)||[];
  if(ds.length&&!dilemasOk){tpPintarDilemasAplicar(j);return;}
  const dilemmaAnswers=ds.length&&typeof tpLeerRespuestasDilema==='function'?tpLeerRespuestasDilema():[];
  box.innerHTML='<div class="apply-screen">'+tpEsqueleto(3)+'</div>';
  let r;
  try{r=await TPCloud._postAuth('apply',{jobId:String(j.id),dilemmaAnswers});}catch(e){r={error:e.message||String(e)};}
  if(!r||r.error){
    box.innerHTML='<div class="apply-screen u-ta-center">'+tpVacio({error:true,icono:'alert',titulo:'No se ha podido enviar tu postulación',texto:(r&&r.error)||'Sin respuesta del servidor. Inténtalo de nuevo.',acciones:[{txt:'Reintentar',accion:ds.length?'tpPintarDilemasAplicar(activeJob)':'applyDirectly()',tipo:'btn-primary'}]})+'</div>';
    return;
  }
  _pendingJobId=null;
  TPPostulaciones.porOferta[j.id]=(r.application&&r.application.status)||'aplicado';
  const habilidades=(j.requiredSkills||[]).map(x=>{const sc=candidateProfile.skills[x]?.score||0;return`<span class="job-tag">${escHtml(x)}: <strong>${tpBanda(sc).txt}</strong></span>`;}).join('');
  box.innerHTML=`<div class="apply-screen u-ta-center"><div class="tp-final"><span class="tp-vacio-ico">${tpIcon('check')}</span><div><div class="tp-final-tit">${r.yaPostulado?'Ya te habías postulado':'Postulación enviada'}</div><p class="tp-final-sub">Tu perfil anónimo de skills${ds.length?' y tus respuestas a los dilemas están':' está'} a disposición de <strong>${escHtml(co?co.name:'la empresa')}</strong>. Te avisaremos en tu bandeja cuando cambie tu etapa. Si desbloquean tu contacto, se pondrán en contacto contigo.</p></div><div class="tp-final-skill u-d-block"><div class="u-fs-micro u-fw-600">Lo que verá la empresa</div><div class="job-tags u-mt-8">${habilidades}</div><div class="u-fs-micro u-mt-8">Tu nombre, email y teléfono permanecen ocultos hasta que la empresa pague.</div></div><div class="tp-res-acciones"><button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Volver al panel</button></div></div></div>`;
}
function goToCommonFromApply(commonExId, jobId){
  _pendingJobId=jobId;
  closeJobModal();
  openCommonEx(commonExId);
}
function switchEx(i){currentEx=i;const el=getExercises(activeJob);document.querySelectorAll('.ex-tab').forEach((t,j)=>t.classList.toggle('active',j===i));document.querySelectorAll('.prog-dot').forEach((p,j)=>{p.classList.remove('active','done');if(exResults[j]!==undefined)p.classList.add('done');else if(j===i)p.classList.add('active');});renderEx(el,i);document.getElementById('jobModal').scrollTop=0;}
let _exTimer=null;let _exTimeLeft=0;

function renderEx(el,i){
  const ex=el[i],ct=document.getElementById('exContent');
  if(exResults[i]!==undefined){renderDone(ex,i,el);return;}
  clearInterval(_exTimer);
  
  // ═══ PHASE 1: BRIEFING SCREEN ═══
  const diff=ex.difficulty||'intermedio';
  const diffLabel={basico:'Básico',intermedio:'Intermedio',avanzado:'Avanzado'}[diff]||'Intermedio';
  const diffCls='difficulty-'+diff;
  const timeLimit=ex.timeLimit||null;
  const typeIcons={analysis:'chart',email:'pen',decision:'list',audio:'mic',video:'video',cognitive:'bulb',image_audit:'search',upload:'paperclip'};
  const typeLabels={analysis:'Análisis de datos',email:'Redacción profesional',decision:'Toma de decisiones',audio:'Simulación por voz',video:'Grabación de vídeo',cognitive:'Razonamiento lógico',image_audit:'Auditoría visual'};
  const briefing=ex.briefing||'Se te presentará un escenario profesional real. Lee con atención y responde según tu criterio.';
  
  ct.innerHTML=`<div class="ex-briefing">
    <span class="ex-briefing-icon">${tpIcon(typeIcons[ex.type]||'clipboard')}</span>
    <h3 class="ex-briefing-title">${ex.title}</h3>
    <p class="ex-briefing-sub">${typeLabels[ex.type]||'Ejercicio práctico'} · Ejercicio ${ex.num} de 3</p>
    <div class="ex-briefing-meta">
      <span class="ex-meta-pill ${diffCls}">${diffLabel}</span>
      ${timeLimit?`<span class="ex-meta-pill time-pill">${tpIcon('clock')} ${Math.floor(timeLimit/60)} min</span>`:''}
      <span class="ex-meta-pill u-bc-blue-100 u-c-blue-500 u-bg-blue-100">${ex.type==='audio'||ex.type==='video'?'Grabación':'Texto'}</span>
    </div>
    <div class="ex-briefing-skills">${ex.skills.hard.map(s=>`<span class="skill-pill sp-hard">${s}</span>`).join('')}${ex.skills.soft.map(s=>`<span class="skill-pill sp-soft">${s}</span>`).join('')}</div>
    <div class="ex-briefing-text">${briefing}</div>
    <div class="ex-briefing-warn">${tpIcon('alert')} Cuando pulses «Estoy preparado», el escenario se revelará y ${timeLimit?`el tiempo (${Math.floor(timeLimit/60)}:${String(timeLimit%60).padStart(2,'0')}) empezará a correr.`:'no podrás volver atrás.'} No podrás copiar el enunciado.</div>
    <button class="btn-launch" onclick="launchExercise(${i})">Estoy preparado →</button>
  </div>`;
}

function launchExercise(i){
  const ct=document.getElementById('exContent');
  const el=getExercises(activeJob);
  ct.style.position='relative';
  const overlay=document.createElement('div');
  overlay.className='ex-countdown';
  overlay.innerHTML='<div class="countdown-num">3</div>';
  ct.appendChild(overlay);
  let count=3;
  const ci=setInterval(()=>{
    count--;
    if(count>0){overlay.innerHTML=`<div class="countdown-num">${count}</div>`;}
    else if(count===0){overlay.innerHTML='<div class="countdown-num go">¡Adelante!</div>';}
    else{clearInterval(ci);overlay.remove();ct.style.position='';renderExActive(el,i);}
  },800);
}

function renderExActive(el,i){
  const ex=el[i],ct=document.getElementById('exContent');
  const timeLimit=ex.timeLimit||null;
  let timerHTML='';
  if(timeLimit){
    _exTimeLeft=timeLimit;
    timerHTML=`<div class="ex-timer-bar"><div class="ex-timer-label">Tiempo restante</div><div class="ex-timer-track"><div class="ex-timer-fill green u-w-100pct" id="exTimerFill"></div></div><div class="ex-timer-clock" id="exTimerClock">${Math.floor(timeLimit/60)}:${String(timeLimit%60).padStart(2,'0')}</div></div>`;
  }
  let h=timerHTML+`<div class="ex-body u-user-select-none"><div class="scenario-box"><div class="scenario-label">Escenario</div><div class="scenario-texto">${tpFormatoEnunciado(ex.scenario)}</div></div>`;

  if(ex.type==='analysis'&&ex.data){const hd=ex.data.headers;h+=`<div class="tp-tabla-scroll"><table class="ex-data-table"><thead><tr>${hd.map(x=>`<th>${escHtml(x)}</th>`).join('')}</tr></thead><tbody>${ex.data.table.map(r=>`<tr><td>${escHtml(r.n)}</td><td class="${escHtml(r.cls||'')}">${escHtml(r.a)}</td><td>${escHtml(r.b)}</td><td>${escHtml(r.c)}</td><td>${escHtml(r.d)}</td></tr>`).join('')}</tbody></table></div><span class="ex-textarea-label">${escHtml(ex.data.q)}</span><textarea class="ex-textarea" id="exAns" placeholder="Escribe tu análisis…" oncopy="return false"></textarea>`;}
  else if(ex.type==='decision'&&ex.data){_exState.asgn={};ex.data.keys.forEach(k=>_exState.asgn[k]=[]);h+=`<p class="u-fs-peq u-c-slate-500 u-mb-12">Clasifica cada elemento haciendo clic:</p><div id="decItems">${ex.data.options.map(o=>`<div class="ex-choice" id="dc_${escHtml(o.id)}" onclick="cycleD('${escHtml(o.id)}',this)" data-cat=""><h4>${escHtml(o.text)}</h4><p id="dl_${escHtml(o.id)}">Sin asignar</p></div>`).join('')}</div><div class="u-d-flex u-gap-6 u-fw-wrap-wrap u-m-10-0">${ex.data.cats.map(c=>`<span class="job-tag u-fs-micro">${escHtml(c)}</span>`).join('')}</div>`;}
  else if(ex.type==='email'&&ex.data){h+=`${ex.data.hint?`<div class="ex-guia"><div class="scenario-label">Cómo organizar tu respuesta</div>${tpFormatoEnunciado(ex.data.hint)}</div>`:''}<div class="ex-email-mock"><div class="ex-email-head"><div class="ex-email-row"><label>Para:</label><input value="${escHtml(ex.data.to||'')}" readonly></div><div class="ex-email-row"><label>Asunto:</label><input id="exSubj" value="${escHtml(ex.data.subject||'')}" placeholder="Asunto…"></div></div><div class="ex-email-body"><textarea id="exAns" class="ex-email-texto" placeholder="Escribe tu respuesta…" oncopy="return false"></textarea></div></div>`;}
  else if(ex.type==='audio'&&ex.data){
    const dur=ex.data.duration||ex.data.maxTime||120;
    const botText=ex.data.botMessage||ex.data.botMsg||'';
    const bars=Array.from({length:40},()=>'<div class="wave-bar u-h-4"></div>').join('');
    if(botText)h+=`<div class="u-bg-slate-800 u-b-1-solid-slate-700 u-r-radius u-p-14-16 u-mb-16 u-c-slate-300 u-fs-peq">${botText}</div>`;
    h+=`<div class="rec-container"><div class="rec-label">${tpIcon('mic')} ${ex.data.context||''}</div><div class="rec-timer" id="recTimer">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div><div class="rec-status" id="recStatus">Pulsa REC para grabar</div><div class="waveform">${bars}</div><button class="rec-btn" id="recBtn" onclick="toggleRecording(${dur})"><div class="rec-btn-inner"></div></button><div class="rec-metrics" id="recMetrics" style="display:none"></div></div>`;
    h+=`<button class="btn btn-primary" id="recSubmitBtn" style="width:100%;justify-content:center;display:none" onclick="submitEx(${i})">Enviar grabación →</button>`;
    h+=`</div>`;ct.innerHTML=h;startExTimer(i);return;
  }
  else if(ex.type==='video'&&ex.data){
    const dur=ex.data.maxTime||ex.data.duration||120;
    const bars=Array.from({length:40},()=>'<div class="wave-bar u-h-4"></div>').join('');
    h+=`<div class="u-bg-slate-800 u-b-1-solid-slate-700 u-r-radius u-p-14-16 u-mb-16 u-c-slate-300 u-fs-peq">${ex.data.imageUrl||ex.data.context||''}</div>`;
    h+=`<div class="rec-container"><div class="rec-label">${tpIcon('video')} ${ex.data.context||'Grabación de vídeo'}</div><div class="rec-timer" id="recTimer">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div><div class="rec-status" id="recStatus">Pulsa REC para grabar</div><div class="waveform">${bars}</div><button class="rec-btn" id="recBtn" onclick="toggleRecording(${dur})"><div class="rec-btn-inner"></div></button><div class="rec-metrics" id="recMetrics" style="display:none"></div></div>`;
    h+=`<button class="btn btn-primary" id="recSubmitBtn" style="width:100%;justify-content:center;display:none" onclick="submitEx(${i})">Enviar grabación →</button>`;
    h+=`</div>`;ct.innerHTML=h;startExTimer(i);return;
  }
  else if(ex.type==='cognitive'&&ex.data){
    const puzzles=ex.data.puzzles;_exState.cogAnswers=new Array(puzzles.length).fill(-1);
    h+=`<div id="cogPuzzles">`;
    puzzles.forEach((p,pi)=>{
      h+=`<div class="u-bg-superficie u-b-1-solid-slate-200 u-r-radius u-p-18 u-mb-14"><div style="font-family:'JetBrains Mono',monospace;font-size:.625rem;color:var(--slate-400);margin-bottom:10px">PUZZLE ${pi+1} de ${puzzles.length}</div><div class="cog-sequence">${(p.seq||p.sequence||[]).map(s=>`<div class="cog-seq-item${s==='?'?' mystery':''}">${s}</div>`).join('')}</div><div class="cog-options">${p.options.map((o,oi)=>`<div class="cog-opt" id="cog_${pi}_${oi}" onclick="selectCog(${pi},${oi})">${o}</div>`).join('')}</div></div>`;
    });
    h+=`</div>`;
  }
  else if(ex.type==='image_audit'&&ex.data){
    const dur=ex.data.duration||120;
    const bars=Array.from({length:40},()=>'<div class="wave-bar u-h-4"></div>').join('');
    h+=`<div class="audit-image-wrap"><div class="audit-badge">${tpIcon('clock')} Analiza</div><div class="audit-image"><div class="audit-mockup"><div class="audit-mockup-nav"><div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div><div class="dot" style="background:#28c840"></div><span class="u-fs-micro u-c-slate-400 u-ml-8">${ex.data.mockupTitle||'App'}</span></div><div class="audit-mockup-body"><div style="color:#999" class="u-ff-comic-sans-ms-cursive u-fs-dest u-mb-6">bienvenido a foodapp</div><div class="u-d-flex u-gap-4 u-mb-10 u-fw-wrap-wrap">${['Inicio','Menú','Pedidos','Favoritos','Perfil','Ajustes','Ayuda','Blog','Tienda','Ofertas','Club','Más'].map(x=>`<span style="background:#f0f0f0;color:#aaa" class="u-p-2-5 u-r-2 u-fs-micro">${x}</span>`).join('')}</div><div style="background:#fafafa;border:1px solid #eee" class="u-r-4 u-p-8 u-mb-8"><div style="color:#bbb" class="u-fs-micro">Pizza Margherita €12.50</div></div><button style="background:#e8e8e8;color:#d0d0d0" class="u-b-none u-p-6-12 u-r-2 u-fs-micro u-w-100pct">pedir ahora</button></div></div></div></div>`;
    h+=`<div class="rec-container"><div class="rec-label">${tpIcon('video')} Graba tu auditoría</div><div class="rec-timer" id="recTimer">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div><div class="rec-status" id="recStatus">Pulsa REC</div><div class="waveform">${bars}</div><button class="rec-btn" id="recBtn" onclick="toggleRecording(${dur})"><div class="rec-btn-inner"></div></button><div class="rec-metrics" id="recMetrics" style="display:none"></div></div>`;
    h+=`<button class="btn btn-primary" id="recSubmitBtn" style="width:100%;justify-content:center;display:none" onclick="submitEx(${i})">Enviar auditoría →</button>`;
    h+=`</div>`;ct.innerHTML=h;startExTimer(i);return;
  }
  else if(ex.type==='upload'&&ex.data){
    const accept=ex.data.accept||'.pdf,.doc,.docx,.png,.jpg,.mp4,.zip';
    const maxMB=ex.data.maxMB||10;
    h+=`<div class="ex-upload-zone" id="uploadZone" onclick="document.getElementById('exFileInput').click()">
      <span class="ex-upload-icon">${tpIcon('paperclip')}</span>
      <div class="ex-upload-text">Haz clic o arrastra tu archivo aquí</div>
      <div class="ex-upload-hint">Formatos: ${accept} · Máx ${maxMB}MB</div>
      <input type="file" id="exFileInput" accept="${accept}" style="display:none" onchange="handleUpload(this)">
    </div>
    ${ex.data.urlField?`<div class="u-mt-12"><label class="u-fs-micro u-fw-600 u-c-slate-600 u-d-block u-mb-4">O introduce una URL:</label><input type="url" class="ex-url-input" id="exUrlInput" placeholder="${ex.data.urlPlaceholder||'https://...'}"></div>`:''}
    ${ex.data.commentField?`<div class="u-mt-12"><label class="u-fs-micro u-fw-600 u-c-slate-600 u-d-block u-mb-4">${ex.data.commentLabel||'Descripción / comentarios:'}</label><textarea class="ex-textarea" id="exAns" placeholder="${ex.data.commentHint||'Describe tu trabajo…'}" style="min-height:100px" oncopy="return false"></textarea></div>`:''}`;
  }

  h+=`<div class="u-mt-16"><button class="btn btn-primary" style="width:100%;justify-content:center" onclick="submitEx(${i})">Enviar respuesta →</button></div></div>`;
  ct.innerHTML=h;
  startExTimer(i);
  tpRespuestaViva(activeJob.id+':'+i);
}

function handleUpload(input){
  const file=input.files[0];
  if(!file)return;
  const zone=document.getElementById('uploadZone');
  zone.classList.add('has-file');
  zone.innerHTML=`<div class="ex-upload-preview"><span class="file-icon">${tpIcon('file')}</span><div class="file-info"><div class="file-name">${escHtml(file.name)}</div><div class="file-size">${(file.size/1024/1024).toFixed(2)} MB</div></div><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();document.getElementById('exFileInput').value='';document.getElementById('uploadZone').classList.remove('has-file');document.getElementById('uploadZone').innerHTML='<span class=\\'ex-upload-icon\\'>'+tpIcon('paperclip')+'</span><div class=\\'ex-upload-text\\'>Haz clic para cambiar archivo</div>';"><span>✕</span></button></div><input type="file" id="exFileInput" style="display:none" onchange="handleUpload(this)">`;
  _exState.uploadedFile=file.name;
}

function startExTimer(i){
  const ex=getExercises(activeJob)[i];
  const timeLimit=ex.timeLimit;
  if(!timeLimit){_exTimer=null;return;}
  clearInterval(_exTimer);
  _exTimeLeft=window.TPIntegrity?TPIntegrity.remaining(i,timeLimit):timeLimit;
  _exTimer=setInterval(()=>{
    _exTimeLeft--;
    const fill=document.getElementById('exTimerFill');
    const clock=document.getElementById('exTimerClock');
    if(!fill||!clock){clearInterval(_exTimer);return;}
    const pct=(_exTimeLeft/timeLimit)*100;
    fill.style.width=pct+'%';
    fill.className='ex-timer-fill '+(pct>40?'green':pct>15?'amber':'red');
    clock.textContent=Math.floor(_exTimeLeft/60)+':'+String(_exTimeLeft%60).padStart(2,'0');
    clock.className='ex-timer-clock'+(pct<=15?' warn':'');
    if(_exTimeLeft<=0){
      clearInterval(_exTimer);
      clock.textContent='0:00';
      submitEx(i);
    }
  },1000);
}
function cycleD(id,el){const ex=getExercises(activeJob)[currentEx],keys=ex.data.keys,names=ex.data.cats;let cur=el.dataset.cat;let ni=cur?keys.indexOf(cur)+1:0;if(ni>=keys.length)ni=0;el.dataset.cat=keys[ni];el.className='ex-choice selected';const lbl=document.getElementById('dl_'+id);lbl.textContent=names[ni];lbl.style.color='var(--emerald-600)';}
function selectCog(puzzleIdx,optIdx){_exState.cogAnswers[puzzleIdx]=optIdx;const ex=getExercises(activeJob)[currentEx];if(!ex||ex.type!=='cognitive')return;const puzzles=ex.data.puzzles;puzzles[puzzleIdx].options.forEach((_,oi)=>{const el=document.getElementById('cog_'+puzzleIdx+'_'+oi);if(el){el.classList.toggle('selected',oi===optIdx);}});}
async function submitEx(i){
  const ex=getExercises(activeJob)[i];
  let candidateResponse='';
  let evaluationType='ai'; // ai, deterministic, recording

  // Gather response based on type
  if(ex.type==='analysis'){
    candidateResponse=(document.getElementById('exAns')?.value||'').trim();
    if(!candidateResponse||candidateResponse.length<15){toast('Escribe tu análisis: al menos 15 caracteres.');return;}
  }else if(ex.type==='email'){
    candidateResponse=(document.getElementById('exAns')?.value||'').trim();
    const subj=(document.getElementById('exSubj')?.value||'').trim();
    if(!candidateResponse||candidateResponse.length<20){toast('Escribe tu respuesta: al menos 20 caracteres.');return;}
    const ed=ex.data||{};
    if(ed.minChars&&candidateResponse.length<ed.minChars){toast('El cuerpo del email necesita al menos '+ed.minChars+' caracteres. Ahora tiene '+candidateResponse.length+'.');return;}
    if(ed.minWords){const wc=candidateResponse.split(/\s+/).filter(Boolean).length;if(wc<ed.minWords){toast('El cuerpo del email necesita al menos '+ed.minWords+' palabras. Ahora tiene '+wc+'.');return;}}
    if(subj) candidateResponse='Asunto: '+subj+'\n\n'+candidateResponse;
  }else if(ex.type==='decision'){
    const items=document.querySelectorAll('#decItems .ex-choice');
    let assigned=0;items.forEach(el=>{if(el.dataset.cat)assigned++;});
    if(assigned<items.length-1){toast('Falta clasificar algún elemento.');return;}
    let choices=[];items.forEach(el=>{choices.push({text:el.querySelector('h4')?.textContent||'',chosen:el.dataset.cat});});
    candidateResponse=JSON.stringify(choices);
    evaluationType='deterministic_plus_ai';
  }else if(ex.type==='cognitive'){
    // La solución ya no está en el navegador: corrige el servidor.
    const answers=_exState.cogAnswers||[];
    if(answers.some(a=>a===-1)){toast('Falta responder a algún puzzle.');return;}
    candidateResponse=JSON.stringify(answers);
    evaluationType='deterministic_plus_ai';
  }else if(ex.type==='audio'||ex.type==='video'||ex.type==='image_audit'){
    if(_recState.elapsed<5){toast('Graba al menos 5 segundos antes de enviar.');return;}
    stopRecording();
    candidateResponse=`[Grabación de ${ex.type==='audio'?'audio':'vídeo'}: ${_recState.elapsed} segundos]`;
    evaluationType='recording_ai';
  }else if(ex.type==='upload'){
    const file=_exState.uploadedFile||'';
    const url=(document.getElementById('exUrlInput')?.value||'').trim();
    const comment=(document.getElementById('exAns')?.value||'').trim();
    if(!file&&!url){toast('Sube un archivo o pega una URL.');return;}
    candidateResponse=`[Archivo: ${file||'ninguno'}] [URL: ${url||'ninguna'}] [Comentario: ${comment||'sin comentario'}]`;
    evaluationType='ai';
  }

  // Show loading state
  const ct=document.getElementById('exContent');
  ct.innerHTML=`<div class="ex-body"><div class="ai-eval-loading" role="status">${tpPasos([{txt:'Respuesta recibida',hecho:true},{txt:'Corrigiendo con la rúbrica',hecho:false},{txt:'Resultado',hecho:false}],'Corrección')}<p class="u-mt-16">Esto suele tardar entre 10 y 30 segundos. No cierres esta ventana.</p></div></div>`;
  const stepInterval=null;

  try{
    const result=await evaluateWithAI(ex, candidateResponse, evaluationType);
    clearInterval(stepInterval);
    exResults[i]={score:result.score,time:_exTimeLeft?((ex.timeLimit||300)-_exTimeLeft):120,feedback:result};
    recordEval(ex,result.score,result.aiPowered!==false,candidateResponse,result);
    switchEx(i);
  }catch(err){
    clearInterval(stepInterval);
    console.error('AI eval error:',err);
    // Clasificaciones y secuencias las corrige el servidor con su solución: sin
    // él no hay nota local posible. Se vuelve al ejercicio para reenviarlo.
    if(evaluationType==='deterministic_plus_ai'){toast('No se ha podido corregir. Tu tiempo sigue: vuelve a enviarlo.');switchEx(i);return;}
    // Fallback to rubric-based scoring
    const fallback=fallbackScore(ex,candidateResponse);
    exResults[i]={score:fallback.score,time:_exTimeLeft?((ex.timeLimit||300)-_exTimeLeft):120,feedback:fallback};
    recordEval(ex,fallback.score,false,candidateResponse,fallback);
    switchEx(i);
  }
}

// ═══ QUALITY DETECTION ═══
function detectQuality(text){
  if(!text||text.length<5)return{garbage:true,reason:'empty'};
  const clean=text.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g,'').trim();
  const words=clean.split(/\s+/).filter(w=>w.length>1);
  // Check for random characters
  const alphaRatio=clean.length/Math.max(text.length,1);
  if(alphaRatio<0.4)return{garbage:true,reason:'random_chars'};
  // Check for repeated characters
  if(/(.)\1{5,}/.test(text))return{garbage:true,reason:'repeated_chars'};
  // Check for minimum real words (at least 5 words of 3+ chars)
  const realWords=words.filter(w=>w.length>=3);
  if(realWords.length<5)return{garbage:true,reason:'too_few_words'};
  // Check for basic sentence structure (at least one period, comma, or question mark)
  const hasPunctuation=/[.,;:?!]/.test(text);
  // Check for repeated word spam
  const wordSet=new Set(words.map(w=>w.toLowerCase()));
  if(wordSet.size<words.length*0.3&&words.length>8)return{garbage:true,reason:'word_spam'};
  // Short but has real words
  if(words.length<15)return{garbage:false,quality:'low',wordCount:words.length};
  if(words.length<40)return{garbage:false,quality:'medium',wordCount:words.length};
  return{garbage:false,quality:'high',wordCount:words.length};
}

// Tipo de cambio EUR/USD usado para expresar el coste de la IA en euros.
// Es un supuesto declarado, no un dato de mercado en vivo: se documenta en la
// memoria para que el COGS del plan financiero sea reproducible.
const EUR_USD=1.09;

async function evaluateWithAI(ex, response, evalType){
  // Pre-check for garbage. Las clasificaciones no son texto (van como lista de
  // elecciones) y las corrige el servidor con la solución oficial.
  const quality=evalType==='deterministic_plus_ai'?{garbage:false}:detectQuality(response);
  if(quality.garbage){
    return{
      score:3,
      criteria:[
        {name:'Validez de respuesta',score:0,comment:'La respuesta no contiene contenido coherente o profesional.'},
        {name:'Relevancia',score:0,comment:'No se detecta ningún intento de abordar el escenario planteado.'},
        {name:'Esfuerzo',score:5,comment:'Se requiere un esfuerzo real para ser evaluado. Razón: '+({empty:'respuesta vacía',random_chars:'caracteres aleatorios',repeated_chars:'caracteres repetidos',too_few_words:'muy pocas palabras',word_spam:'texto repetitivo'}[quality.reason]||'contenido no válido')+'.'}
      ],
      overall:'Esta respuesta no puede ser evaluada porque no contiene contenido profesional relevante. Para obtener una evaluación real, necesitas escribir una respuesta coherente que aborde el escenario planteado.',
      aiPowered:true
    };
  }

  // Corrector v2: el navegador ya no escribe las reglas del examen. Envía el
  // ejercicio y la respuesta; el servidor monta la rúbrica, filtra el prompt
  // injection y devuelve la nota con un recibo firmado.
  const d=ex.data||{};
  const exercise={
    id:ex.id||ex.num||ex.title,challengeId:activeJob&&activeJob.id,title:ex.title,scenario:ex.scenario,type:evalType==='deterministic_plus_ai'?'deterministic_plus_ai':ex.type,
    jobTitle:activeJob&&activeJob.title,sector:activeJob&&activeJob.sector,
    data:{table:d.table,kw:d.kw,to:d.to,subject:d.subject,hint:d.hint,context:d.context}
  };
  const integ=(window.TPIntegrity&&TPIntegrity.current())||null;
  // Con sesión, el límite de correcciones va por cuenta y no por IP (más holgado).
  const evHeaders={'Content-Type':'application/json'};
  try{const t=window.TPCloud&&await TPCloud.accessToken();if(t)evHeaders['Authorization']='Bearer '+t;}catch(e){}
  const res=await fetch('/.netlify/functions/evaluate-exercise',{
    method:'POST',
    headers:evHeaders,
    body:JSON.stringify({exercise,response,integrity:integ?{risk:integ.risk}:null})
  });
  if(!res.ok){
    const err=await res.json().catch(()=>({error:'Error desconocido en evaluación IA'}));
    throw new Error((err.error||'Error en evaluación IA')+(err.details?': '+err.details:''));
  }
  const parsed=await res.json();
  
  // Validate scores — NO default to 50, default to 0
  parsed.score=Math.max(0,Math.min(100,Math.round(parsed.score||0)));
  if(parsed.criteria){parsed.criteria.forEach(c=>{c.score=Math.max(0,Math.min(100,Math.round(c.score||0)));});}
  parsed.aiPowered=true;
  // Coste real de la evaluación a partir de los tokens (tarifa claude-sonnet-4-6:
  // $3 / MTok input, $15 / MTok output). La tarifa de Anthropic está en DÓLARES:
  // el importe se convierte a euros de forma explícita en vez de escribir "€"
  // sobre una cifra en USD, que inflaba el COGS declarado un ~8 %.
  if(parsed.usage){
    const ti=parsed.usage.input_tokens||0, to=parsed.usage.output_tokens||0;
    parsed.tokensIn=ti; parsed.tokensOut=to;
    parsed.costUSD=(ti*3 + to*15)/1000000;
    parsed.costEUR=parsed.costUSD/EUR_USD;
  }
  return parsed;
}

// La rúbrica vive en el servidor (netlify/functions/lib/evaluator.js): el
// candidato no puede reescribir los criterios con que se le corrige.

function fallbackScore(ex, response){
  const quality=detectQuality(response);
  
  // Garbage responses get near-zero
  if(quality.garbage){
    return{score:3,criteria:[{name:'Validez',score:0,comment:'Respuesta no válida: contenido incoherente o vacío.'},{name:'Relevancia',score:0,comment:'No aborda el escenario.'}],overall:'La respuesta no contiene contenido evaluable. Escribe una respuesta real que aborde el escenario.',aiPowered:false};
  }
  
  let score=0;const criteria=[];
  
  if(ex.type==='analysis'){
    const kw=ex.data?.kw||[];const found=kw.filter(k=>response.toLowerCase().includes(k.toLowerCase()));
    const relevance=Math.round((found.length/Math.max(kw.length,1))*100);
    const depthRaw=quality.quality==='high'?65:quality.quality==='medium'?40:20;
    const depth=found.length>0?depthRaw:Math.round(depthRaw*0.3);
    score=Math.round(relevance*0.6+depth*0.4);
    criteria.push({name:'Relevancia',score:relevance,comment:`${found.length} de ${kw.length} conceptos clave mencionados.${found.length<2?' Necesitas abordar más aspectos del escenario.':''}`});
    criteria.push({name:'Profundidad',score:depth,comment:quality.quality==='high'?'Respuesta desarrollada.':quality.quality==='medium'?'Necesita más desarrollo.':'Respuesta demasiado breve para este tipo de análisis.'});
  }else if(ex.type==='email'){
    const hasGreeting=/hola|estimad|buenas|dear|hi /i.test(response);
    const hasClosing=/salud|atentamente|gracias|regards|best/i.test(response);
    const hasStructure=hasGreeting&&hasClosing;
    const structureScore=hasStructure?60:hasGreeting||hasClosing?35:10;
    const contentScore=quality.quality==='high'?55:quality.quality==='medium'?35:15;
    score=Math.round(structureScore*0.5+contentScore*0.5);
    criteria.push({name:'Estructura',score:structureScore,comment:hasStructure?'Tiene saludo y cierre.':hasGreeting?'Falta cierre profesional.':hasClosing?'Falta saludo.':'Sin estructura de email profesional (saludo, cuerpo, cierre).'});
    criteria.push({name:'Contenido',score:contentScore,comment:quality.quality==='high'?'Contenido desarrollado.':'Necesita más desarrollo y concreción.'});
  }else if(ex.type==='decision'){
    try{const items=JSON.parse(response||'[]');
    let correct=0;items.forEach(it=>{if(it.chosen===it.correct)correct++;});
    score=items.length>0?Math.round((correct/items.length)*100):0;
    criteria.push({name:'Precisión',score:score,comment:`${correct} de ${items.length} clasificaciones correctas.`});}
    catch(e){score=0;criteria.push({name:'Precisión',score:0,comment:'Error al procesar respuestas.'});}
  }else{
    score=quality.quality==='high'?40:quality.quality==='medium'?25:10;
    criteria.push({name:'Completitud',score:score,comment:'Evaluación básica. La IA no está disponible para una evaluación detallada.'});
  }
  return{score:Math.max(0,Math.min(100,score)),criteria,overall:score<20?'La respuesta no alcanza el mínimo evaluable. Desarrolla más tu análisis abordando el escenario concreto.':'Evaluación automática básica. Los resultados de la evaluación IA serán más precisos.',aiPowered:false};
}

function renderDone(ex,i,el){
  const r=exResults[i],allDone=el.every((_,j)=>exResults[j]!==undefined);
  const fb=r.feedback||{};
  const criteria=Array.isArray(fb.criteria)?fb.criteria:[];
  const isAI=fb.aiPowered!==false;
  TPBorrador.borrar(activeJob.id+':'+i);
  // El texto del modelo puede citar la respuesta del candidato: se escapa siempre.
  const origen=fb.blockedByFilter?tpChip('Bloqueado por el filtro anti-manipulación','error'):fb.deterministic?tpChip('Corregido con la solución oficial','info'):isAI?tpChip('Corregido con IA','info'):tpChip('Corrección automática de reserva');
  const verif=fb.receiptSigned?'<span title="Nota firmada por el Corrector v2 '+escHtml(fb.evaluatorVersion||'')+'">'+tpChip('Nota verificada','ok')+'</span>':'';
  const ord=criteria.slice().sort((a,b)=>b.score-a.score);
  const fuerte=ord[0],debil=ord.length>1?ord[ord.length-1]:null;
  const pares=(fuerte&&debil&&fuerte.score!==debil.score)?`<div class="tp-res-pares"><div class="tp-res-par"><h4>${tpIcon('check')} Tu mejor criterio</h4><p>${escHtml(fuerte.name)}: ${fuerte.score} sobre 100.</p></div><div class="tp-res-par mejora"><h4>${tpIcon('target')} Dónde más puedes subir</h4><p>${escHtml(debil.name)}: ${debil.score} sobre 100. Lee el comentario de ese criterio antes de repetir el reto.</p></div></div>`:'';
  const crit=`<div class="tp-res-crit"><h4>Por criterio</h4>${criteria.length?`<div class="tp-notas">${criteria.map(c=>tpBarraNota({nombre:c.name,nota:c.score,comentario:c.comment})).join('')}</div>`:'<p class="tp-nota-coment">Este ejercicio se corrige de forma automática y no tiene desglose por criterios.</p>'}</div>`;
  const tiempo=Math.floor(r.time/60)+':'+String(r.time%60).padStart(2,'0');
  const pend=el.findIndex((_,j)=>exResults[j]===undefined);
  const acciones=(i<el.length-1?`<button class="btn btn-primary" onclick="switchEx(${i+1})">Siguiente ejercicio →</button>`:'')
    +((!allDone&&i===el.length-1&&pend>=0)?`<button class="btn btn-primary" onclick="switchEx(${pend})">Ir al ejercicio pendiente (${pend+1}) →</button>`:'')
    +(allDone?`<button class="btn btn-dark" onclick="showFinal()">Ver resultado final</button>`:'');
  const reto=JSON.stringify(String(activeJob.title||'')).replace(/"/g,'&quot;');
  document.getElementById('exContent').innerHTML=`<div class="ex-body"><div class="tp-res">
    <div class="tp-res-cab"><div><div class="tp-res-tit">Resultado</div><div class="tp-res-sub">${escHtml(ex.title)} · ejercicio ${i+1} de ${el.length}</div></div><div class="tp-res-chips">${verif}${origen}</div></div>
    ${fb.capped?`<div class="tp-integrity-note warn">Nota limitada: ${escHtml(fb.capped)}.</div>`:''}
    <div class="tp-res-cuerpo"><div class="tp-res-nota">${tpAnillo(r.score,'sobre 100')}<div class="tp-res-dato"><span>Banda</span><b>${tpBanda(r.score).txt}</b></div><div class="tp-res-dato"><span>Tiempo</span><b>${tiempo}</b></div></div>${crit}</div>
    ${pares}
    ${fb.overall?`<div class="tp-res-global">${escHtml(fb.overall)}</div>`:''}
    ${window.TPIntegrity?TPIntegrity.html(r.integrity):''}
    <div class="tp-res-pie"><span class="tp-res-aviso">${tpIcon('help')} La nota la propone ${isAI?'un sistema de IA':'una corrección automática'} y una persona puede revisarla si lo pides.</span><div class="tp-res-acciones"><button class="btn btn-outline" onclick="tpPedirRevision(${reto},${i+1})">Pedir revisión</button>${acciones}</div></div>
  </div></div>`;}
function showFinal(){const el=getExercises(activeJob),sc=el.map((_,i)=>exResults[i]?.score||0),avg=Math.round(sc.reduce((a,b)=>a+b)/sc.length);
  // Save to candidate profile if common exercise
  // Integridad agregada de los ejercicios (cámara, pestañas, pegados…).
  const integ=window.TPIntegrity?TPIntegrity.aggregate(el.map((_,i)=>exResults[i]&&exResults[i].integrity)):null;
  const verificada=el.every((_,i)=>exResults[i]&&exResults[i].feedback&&exResults[i].feedback.receiptSigned);
  if(activeJob._isCommon){
    const existing=candidateProfile.completedCommon.findIndex(c=>c.id===activeJob.id);
    const entry={id:activeJob.id,score:avg,skill:activeJob._skill,date:new Date().toISOString(),integrity:integ&&integ.risk,verified:verificada};
    // Repetir un reto nunca baja la nota: se queda la mejor (lo que promete la FAQ).
    const prev=existing>=0?candidateProfile.completedCommon[existing]:null;
    if(!prev)candidateProfile.completedCommon.push(entry);
    else if(avg>=prev.score)candidateProfile.completedCommon[existing]=entry;
    // Unlock the skill
    const sk=candidateProfile.skills[activeJob._skill];
    if(sk&&(!sk.unlocked||avg>=sk.score)){
      sk.score=avg;
      sk.unlocked=true;
      sk.source=activeJob.id;
    }
  }else{
    candidateProfile.completedCustom.push({id:activeJob.id,score:avg,title:activeJob.title});
  }
  // Persistencia: guardar progreso del candidato y publicarlo en el pool de talento
  TP.saveProfile();
  // Persistencia real en Supabase (candidato autenticado). Fire-and-forget robusto:
  // resolvemos el usuario en el momento (por si la variable en memoria se perdió) y
  // lo lanzamos ANTES de cualquier otra cosa que pudiera fallar.
  (async()=>{
    try{
      const u=tpUser||await TPCloud.currentUser();
      if(!u){console.info('[TP] save-evaluation omitido: sin sesión (modo invitado)');return;}
      tpUser=u;
      const skill=activeJob._skill||activeJob.title||'Reto';
      // Agregamos los metadatos reales de la IA de cada ejercicio (trazabilidad AI Act Art. 12).
      const exs=getExercises(activeJob);
      let crit=[],tin=0,tout=0,cost=0,model=null,ai=false;const overalls=[];
      exs.forEach((ex,i)=>{
        const fb=(exResults[i]&&exResults[i].feedback)||{};
        if(Array.isArray(fb.criteria))crit=crit.concat(fb.criteria.map(c=>({name:c.name,score:c.score,comment:c.comment})));
        if(fb.usage){tin+=fb.usage.input_tokens||0;tout+=fb.usage.output_tokens||0;}
        if(typeof fb.costEUR==='number')cost+=fb.costEUR;
        if(!model&&fb.modelUsed)model=fb.modelUsed;
        if(fb.aiPowered)ai=true;
        if(fb.overall)overalls.push((ex&&ex.title?ex.title+': ':'')+fb.overall);
      });
      const receipts=exs.map((_,i)=>exResults[i]&&exResults[i].feedback&&exResults[i].feedback.receipt).filter(Boolean);
      const res=await TPCloud.saveEvaluation(u,{challengeId:activeJob.id,attemptId:activeJob._attemptId||null,skill:skill,score:avg,criteria:crit.length?crit:null,reasoning:overalls.join('\n\n')||null,modelUsed:model,tokensIn:tin||null,tokensOut:tout||null,costEur:cost||null,receipts,integrity:integ});
      if(res&&res.error){toast('Tu nota no se ha guardado: '+res.error);console.warn('[TP] save-evaluation',res);return;}
      console.info('[TP] save-evaluation OK →',(ai?'IA '+(model||''):'sin IA'),res);
    }catch(e){console.warn('[TP] save-evaluation ERROR',e);}
  })();
  syncMyPoolEntry();
  document.getElementById('exNav').innerHTML='';document.getElementById('jmProgress').innerHTML='';
  const isCommon=activeJob._isCommon;
  const hasPending=isCommon&&_pendingJobId;
  const titulo=avg>=80?'Perfil activado':avg>=60?'Buen nivel':'Sigue practicando';
  const botones=hasPending?`<button class="btn btn-primary" onclick="closeJobModal();openJob('${_pendingJobId}');_pendingJobId=null;">← Volver a la oferta</button><button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Ir al panel</button>`:`<button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Volver al panel</button><button class="btn btn-primary" onclick="closeJobModal();openDashCand();setTimeout(()=>switchCandTab('common'),100)">${isCommon?'Más retos →':'Ver resultados →'}</button>`;
  document.getElementById('exContent').innerHTML=`<div class="ex-body"><div class="tp-final">
    ${tpAnillo(avg,'media')}
    <div><div class="tp-final-tit">${titulo}</div><p class="tp-final-sub">Has completado los ${el.length} ejercicios de <strong>${escHtml(activeJob.title)}</strong>.${isCommon?' Tu skill se ha actualizado en tu perfil.':''}</p></div>
    <div class="tp-final-ejs">${sc.map((s,i)=>`<div class="tp-final-ej"><span>Ejercicio ${i+1}</span><b>${s}</b></div>`).join('')}</div>
    ${verificada?tpChip('Todas las notas están verificadas','ok'):''}
    ${window.TPIntegrity?TPIntegrity.html(integ,true):''}
    ${isCommon?`<div class="tp-final-skill">${tpIcon('check-circle')}<span>Skill «<strong>${escHtml(activeJob._skill||'')}</strong>» con nota <strong>${avg}</strong>. Las empresas la ven en el pool si tu perfil es visible.</span></div>`:''}
    <div class="tp-res-acciones">${botones}</div>
  </div></div>`;}

function closeJobModal(){document.getElementById('jobModal').classList.remove('open');}

