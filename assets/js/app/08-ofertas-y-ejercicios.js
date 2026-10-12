// TalentPact · 08-ofertas-y-ejercicios
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ RENDER ═══
// Monograma de empresa: iniciales sobre un tono estable derivado del nombre.
// Sustituye a los emoji de color que se usaban como logotipo.
const TP_MONO_TINTS=[['#ecfdf5','#047857'],['#eff6ff','#1d4ed8'],['#fef3c7','#b45309'],['#f5f3ff','#6d28d9'],['#fee2e2','#b91c1c'],['#f1f5f9','#334155']];
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
  const [bg,fg]=TP_MONO_TINTS[h%TP_MONO_TINTS.length];
  return {iniciales,bg,fg};
}

// Cuántas ofertas se ven antes de pulsar "Ver todas".
const JOBS_VISIBLES=6;
let _jobsExpandido=false;
function toggleJobs(){_jobsExpandido=!_jobsExpandido;renderJobs(_ultimasOfertas);if(!_jobsExpandido){const el=document.getElementById('jobsGrid');if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-90,behavior:'smooth'});}}
let _ultimasOfertas=[];
function renderJobs(list){_ultimasOfertas=list;const g=document.getElementById('jobsGrid'),nr=document.getElementById('noResults');const total=list.length;document.getElementById('resultsCount').textContent=`${total} oferta${total!==1?'s':''} de empresas`;if(!total){g.innerHTML='';nr.style.display='block';const m0=document.getElementById('jobsMore');if(m0)m0.innerHTML='';return;}nr.style.display='none';const visibles=_jobsExpandido?list:list.slice(0,JOBS_VISIBLES);const more=document.getElementById('jobsMore');if(more){more.innerHTML=total>JOBS_VISIBLES?`<button class="btn btn-outline" onclick="toggleJobs()">${_jobsExpandido?'Ver menos':'Ver las '+total+' ofertas'}</button>`:'';}g.innerHTML=visibles.map(j=>{const co=COMPANIES.find(c=>c.id===j.company);const req=j.requiredSkills||[];const reqLevel=j.requiredLevel||'basico';const levelLabel=reqLevel==='avanzado'?'Avanzado':reqLevel==='intermedio'?'Intermedio':'Básico';const levelCls='level-'+reqLevel;const configLabel=j.exerciseConfig==='common+custom'?'Comunes + personalizados':j.exerciseConfig==='custom'?'Personalizados':j.exerciseConfig==='contact'?'A medida':'Comunes';const configCls=j.exerciseConfig==='common+custom'?'ecb-common':j.exerciseConfig==='custom'?'ecb-custom':'ecb-contact';return`<div class="job-card" onclick="openAuth('candidate')"><div class="job-badge ${j.badge}">${j.sector}</div><h3>${escHtml(j.title)}</h3><div class="job-desc">${escHtml(j.desc)}</div>${tpCondChips(j,null)}<div style="font-size:.6875rem;font-weight:600;color:var(--slate-600);margin:8px 0 4px;text-transform:uppercase;letter-spacing:.04em">Skills requeridos:</div><div class="job-tags">${req.map(s=>`<span class="job-tag" style="border:1px solid var(--emerald-100);background:var(--emerald-50);color:var(--emerald-600)">${s}</span>`).join('')}${j.tags.map(t=>`<span class="job-tag">${escHtml(t)}</span>`).join('')}</div>${co?(m=>`<div class="job-company"><div class="job-company-dot" style="background:${m.bg};color:${m.fg}">${m.iniciales}</div>${co.name} · ${co.size} empleados</div>`)(companyMonogram(co.name)):''}<div style="margin-top:8px;display:flex;align-items:center;gap:6px"><span class="level-badge ${levelCls}">${levelLabel}</span><span class="ex-config-badge ${configCls}">${configLabel}</span></div></div>`;}).join('');}
// Ofertas visibles para los candidatos: se excluyen las de cuentas pausadas.
function publicJobs(){ return empPostedJobs.filter(j=>!j.paused); }
function filterJobs(){const q=document.getElementById('searchInput').value.toLowerCase().trim();document.getElementById('searchClear').classList.toggle('show',q.length>0);let l=JOBS.concat(publicJobs());if(currentSector!=='all')l=l.filter(j=>j.sector===currentSector);if(q)l=l.filter(j=>j.title.toLowerCase().includes(q)||j.sector.toLowerCase().includes(q)||j.desc.toLowerCase().includes(q)||j.tags.some(t=>t.toLowerCase().includes(q)));renderJobs(l);}
function setSector(s,btn){currentSector=s;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filterJobs();}
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
    skillsHTML+=`<div class="apply-skill-row has"><div class="ask-icon ok">✓</div><div class="ask-info"><h4>${s}</h4><p>Nivel ${levelLabel} alcanzado (≥${levelThreshold})</p></div><div class="ask-score high">${sc}/100</div></div>`;
  });
  missing.forEach(s=>{
    const sk=candidateProfile.skills[s];
    const isUnlockedButLow=sk?.unlocked&&sk.score<levelThreshold;
    const commonEx=COMMON_EXERCISES.find(ce=>ce.skill===s);
    if(isUnlockedButLow){
      skillsHTML+=`<div class="apply-skill-row missing"><div class="ask-icon need">↑</div><div class="ask-info"><h4>${s}</h4><p>Tu score (${sk.score}) no alcanza el nivel ${levelLabel} (≥${levelThreshold}). Repite el reto para mejorar.</p></div><div class="ask-score pending">${sk.score}/${levelThreshold}</div><div class="ask-action">${commonEx?`<button class="btn btn-primary btn-sm" onclick="goToCommonFromApply('${commonEx.id}','${j.id}')">Repetir reto →</button>`:''}</div></div>`;
    }else{
      skillsHTML+=`<div class="apply-skill-row missing"><div class="ask-icon need">!</div><div class="ask-info"><h4>${s}</h4><p>Necesitas completar este reto (nivel ${levelLabel}, ≥${levelThreshold})</p></div><div class="ask-score pending">Pendiente</div><div class="ask-action">${commonEx?`<button class="btn btn-primary btn-sm" onclick="goToCommonFromApply('${commonEx.id}','${j.id}')">Hacer reto →</button>`:`<span class="ex-config-badge ecb-contact">Próximamente</span>`}</div></div>`;
    }
  });
  
  let summaryHTML='';
  if(hasAll){
    summaryHTML=`<div class="apply-summary" style="border-color:var(--emerald-200);background:var(--emerald-50)"><div class="apply-summary-icon">${tpIcon('check-circle')}</div><div class="apply-summary-text"><h4 style="color:var(--emerald-600)">¡Cumples todos los requisitos!</h4><p>Tienes todos los skills al nivel ${levelLabel} o superior. Puedes aplicar directamente.</p></div></div>`;
  }else{
    summaryHTML=`<div class="apply-summary"><div class="apply-summary-icon">${tpIcon('zap')}</div><div class="apply-summary-text"><h4>Te faltan ${missing.length} skill${missing.length>1?'s':''} al nivel requerido</h4><p>Esta oferta pide nivel <span class="level-badge ${levelCls}">${levelLabel}</span> (score ≥${levelThreshold}) en cada skill.</p></div></div>`;
  }
  
  document.getElementById('exContent').innerHTML=`<div class="apply-screen">
    ${co?`<div class="apply-company"><div class="apply-company-logo">${co.logo}</div><div class="apply-company-info"><h4>${co.name}</h4><p>${co.size} empleados · ${co.sector}</p></div><div style="display:flex;gap:6px;margin-left:auto;align-items:center"><span class="level-badge ${levelCls}">Nivel ${levelLabel}</span><div class="ex-config-badge ${configBadge}">${configLabel}</div></div></div>`:''}
    ${summaryHTML}
    <div class="apply-section-title">Skills requeridos — Nivel ${levelLabel} (${has.length}/${required.length} cumplidos)</div>
    <div class="apply-skills-list">${skillsHTML}</div>
    ${hasAll?`<div style="margin-bottom:16px"><div class="apply-section-title">Retos adicionales de la empresa</div>
      ${j.exerciseConfig==='common+custom'||j.exerciseConfig==='custom'?`<p style="font-size:.78rem;color:var(--slate-500);margin-bottom:12px">Esta empresa también tiene retos personalizados. Completarlos mejora tu posición frente a otros candidatos.</p><button class="btn btn-primary" onclick="startJobExercises()">Completar retos de ${co?.name||'la empresa'} →</button>
      <button class="btn btn-outline" style="margin-left:8px" onclick="applyDirectly()">Aplicar sin retos extras</button>`
      :j.exerciseConfig==='contact'?`<div style="background:var(--amber-100);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:12px 14px;font-size:.78rem;color:var(--amber-500)"><strong>Ejercicios a medida</strong><br>Esta empresa ha solicitado ejercicios diseñados específicamente para este puesto. <a href="#" onclick="openContact()" style="color:var(--amber-500);font-weight:600">Contactar con TalentPact</a> para más info.</div>
      <button class="btn btn-primary" style="margin-top:12px" onclick="applyDirectly()">Aplicar con mis skills actuales →</button>`
      :`<button class="btn btn-primary" onclick="applyDirectly()">Aplicar a esta oferta →</button>`}
    </div>`:
    `<div style="text-align:center;padding:16px 0"><button class="btn btn-primary btn-lg" onclick="closeJobModal();openDashCand();setTimeout(()=>switchCandTab('common',document.querySelectorAll('#candDashTabs .dash-tab')[1]),100)">Ir a completar retos comunes →</button></div>`}
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

function applyDirectly(){
  const co=COMPANIES.find(c=>c.id===activeJob.company);
  _pendingJobId=null; // Clear pending job
  document.getElementById('exContent').innerHTML=`<div class="apply-screen" style="text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:var(--emerald-50);border:2px solid var(--emerald-200);display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:14px">${tpIcon('check-circle')}</div><h3 class="display" style="font-size:1.3rem;color:var(--emerald-600);margin-bottom:6px">¡Candidatura enviada!</h3><p style="color:var(--slate-500);font-size:.8125rem;margin-bottom:20px;max-width:380px;margin-left:auto;margin-right:auto">Tu perfil anónimo de skills ha sido enviado a <strong>${co?.name||'la empresa'}</strong>. Si están interesados, pagarán para ver tu contacto y se pondrán en contacto contigo.</p><div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:10px;padding:14px;margin-bottom:20px;text-align:left"><div style="font-size:.6875rem;font-weight:600;color:var(--slate-500);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Lo que verá la empresa:</div><div style="display:flex;gap:8px;flex-wrap:wrap">${(activeJob.requiredSkills||[]).map(s=>{const sc=candidateProfile.skills[s]?.score||0;return`<span class="job-tag" style="font-size:.6875rem">${s}: <strong>${sc}</strong></span>`;}).join('')}</div><div style="font-size:.6875rem;color:var(--slate-400);margin-top:8px">Tu nombre, email y teléfono permanecen ocultos hasta que la empresa pague.</div></div><div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Volver al panel</button><button class="btn btn-primary" onclick="closeJobModal();openDashCand()">Explorar más ofertas</button></div></div>`;
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
      <span class="ex-meta-pill" style="border-color:var(--blue-100);color:var(--blue-500);background:var(--blue-100)">${ex.type==='audio'||ex.type==='video'?'Grabación':'Texto'}</span>
    </div>
    <div class="ex-briefing-skills">${ex.skills.hard.map(s=>`<span class="skill-pill sp-hard">${s}</span>`).join('')}${ex.skills.soft.map(s=>`<span class="skill-pill sp-soft">${s}</span>`).join('')}</div>
    <div class="ex-briefing-text">${briefing}</div>
    <div class="ex-briefing-warn">${tpIcon('alert')} Cuando pulses "Empezar", el escenario se revelará y ${timeLimit?`el tiempo (${Math.floor(timeLimit/60)}:${String(timeLimit%60).padStart(2,'0')}) empezará a correr.`:'no podrás volver atrás.'} No podrás copiar el enunciado.</div>
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
    timerHTML=`<div class="ex-timer-bar"><div class="ex-timer-label">Tiempo restante</div><div class="ex-timer-track"><div class="ex-timer-fill green" id="exTimerFill" style="width:100%"></div></div><div class="ex-timer-clock" id="exTimerClock">${Math.floor(timeLimit/60)}:${String(timeLimit%60).padStart(2,'0')}</div></div>`;
  }
  let h=timerHTML+`<div class="ex-body" style="user-select:none"><div class="scenario-box"><div class="scenario-label">Escenario</div><p>${ex.scenario}</p></div>`;

  if(ex.type==='analysis'&&ex.data){const hd=ex.data.headers;h+=`<table class="ex-data-table"><thead><tr>${hd.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${ex.data.table.map(r=>`<tr><td>${r.n}</td><td class="${r.cls}">${r.a}</td><td>${r.b}</td><td>${r.c}</td><td>${r.d}</td></tr>`).join('')}</tbody></table><span class="ex-textarea-label">${ex.data.q}</span><textarea class="ex-textarea" id="exAns" placeholder="Escribe tu análisis…" oncopy="return false"></textarea>`;}
  else if(ex.type==='decision'&&ex.data){_exState.asgn={};ex.data.keys.forEach(k=>_exState.asgn[k]=[]);h+=`<p style="font-size:.8125rem;color:var(--slate-500);margin-bottom:12px;">Clasifica cada elemento haciendo clic:</p><div id="decItems">${ex.data.options.map(o=>`<div class="ex-choice" id="dc_${o.id}" onclick="cycleD('${o.id}',this)" data-correct="${o.correct}" data-cat=""><h4>${o.text}</h4><p id="dl_${o.id}">Sin asignar</p></div>`).join('')}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;">${ex.data.cats.map(c=>`<span class="job-tag" style="font-size:.6875rem">${c}</span>`).join('')}</div>`;}
  else if(ex.type==='email'&&ex.data){h+=`<div class="ex-email-mock"><div class="ex-email-head"><div class="ex-email-row"><label>Para:</label><input value="${ex.data.to}" readonly></div><div class="ex-email-row"><label>Asunto:</label><input id="exSubj" value="${ex.data.subject||''}" placeholder="Asunto…"></div></div><div class="ex-email-body"><textarea id="exAns" placeholder="${ex.data.hint||'Escribe…'}" style="min-height:150px" oncopy="return false"></textarea></div></div>`;}
  else if(ex.type==='audio'&&ex.data){
    const dur=ex.data.duration||ex.data.maxTime||120;
    const botText=ex.data.botMessage||ex.data.botMsg||'';
    const bars=Array.from({length:40},()=>'<div class="wave-bar" style="height:4px"></div>').join('');
    if(botText)h+=`<div style="background:var(--slate-800);border:1px solid var(--slate-700);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px;color:var(--slate-300);font-size:.8125rem">${botText}</div>`;
    h+=`<div class="rec-container"><div class="rec-label">${tpIcon('mic')} ${ex.data.context||''}</div><div class="rec-timer" id="recTimer">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div><div class="rec-status" id="recStatus">Pulsa REC para grabar</div><div class="waveform">${bars}</div><button class="rec-btn" id="recBtn" onclick="toggleRecording(${dur})"><div class="rec-btn-inner"></div></button><div class="rec-metrics" id="recMetrics" style="display:none"></div></div>`;
    h+=`<button class="btn btn-primary" id="recSubmitBtn" style="width:100%;justify-content:center;display:none" onclick="submitEx(${i})">Enviar grabación →</button>`;
    h+=`</div>`;ct.innerHTML=h;startExTimer(i);return;
  }
  else if(ex.type==='video'&&ex.data){
    const dur=ex.data.maxTime||ex.data.duration||120;
    const bars=Array.from({length:40},()=>'<div class="wave-bar" style="height:4px"></div>').join('');
    h+=`<div style="background:var(--slate-800);border:1px solid var(--slate-700);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px;color:var(--slate-300);font-size:.8125rem">${ex.data.imageUrl||ex.data.context||''}</div>`;
    h+=`<div class="rec-container"><div class="rec-label">${tpIcon('video')} ${ex.data.context||'Grabación de vídeo'}</div><div class="rec-timer" id="recTimer">${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}</div><div class="rec-status" id="recStatus">Pulsa REC para grabar</div><div class="waveform">${bars}</div><button class="rec-btn" id="recBtn" onclick="toggleRecording(${dur})"><div class="rec-btn-inner"></div></button><div class="rec-metrics" id="recMetrics" style="display:none"></div></div>`;
    h+=`<button class="btn btn-primary" id="recSubmitBtn" style="width:100%;justify-content:center;display:none" onclick="submitEx(${i})">Enviar grabación →</button>`;
    h+=`</div>`;ct.innerHTML=h;startExTimer(i);return;
  }
  else if(ex.type==='cognitive'&&ex.data){
    const puzzles=ex.data.puzzles;_exState.cogAnswers=new Array(puzzles.length).fill(-1);_exState.cogCorrect=puzzles.map(p=>p.correct);
    h+=`<div id="cogPuzzles">`;
    puzzles.forEach((p,pi)=>{
      h+=`<div style="background:white;border:1px solid var(--slate-200);border-radius:var(--radius);padding:18px;margin-bottom:14px"><div style="font-family:'JetBrains Mono',monospace;font-size:.625rem;color:var(--slate-400);margin-bottom:10px">PUZZLE ${pi+1} de ${puzzles.length}</div><div class="cog-sequence">${(p.seq||p.sequence||[]).map(s=>`<div class="cog-seq-item${s==='?'?' mystery':''}">${s}</div>`).join('')}</div><div class="cog-options">${p.options.map((o,oi)=>`<div class="cog-opt" id="cog_${pi}_${oi}" onclick="selectCog(${pi},${oi})">${o}</div>`).join('')}</div></div>`;
    });
    h+=`</div>`;
  }
  else if(ex.type==='image_audit'&&ex.data){
    const dur=ex.data.duration||120;
    const bars=Array.from({length:40},()=>'<div class="wave-bar" style="height:4px"></div>').join('');
    h+=`<div class="audit-image-wrap"><div class="audit-badge">${tpIcon('clock')} Analiza</div><div class="audit-image"><div class="audit-mockup"><div class="audit-mockup-nav"><div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div><div class="dot" style="background:#28c840"></div><span style="font-size:.65rem;color:var(--slate-400);margin-left:8px">${ex.data.mockupTitle||'App'}</span></div><div class="audit-mockup-body"><div style="font-family:Comic Sans MS,cursive;font-size:1.1rem;color:#999;margin-bottom:6px">bienvenido a foodapp</div><div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">${['Inicio','Menú','Pedidos','Favoritos','Perfil','Ajustes','Ayuda','Blog','Tienda','Ofertas','Club','Más'].map(x=>`<span style="background:#f0f0f0;padding:2px 5px;border-radius:2px;font-size:.5rem;color:#aaa">${x}</span>`).join('')}</div><div style="background:#fafafa;border:1px solid #eee;border-radius:4px;padding:8px;margin-bottom:8px"><div style="font-size:.7rem;color:#bbb">Pizza Margherita €12.50</div></div><button style="background:#e8e8e8;color:#d0d0d0;border:none;padding:6px 12px;border-radius:2px;font-size:.6rem;width:100%">pedir ahora</button></div></div></div></div>`;
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
    ${ex.data.urlField?`<div style="margin-top:12px"><label style="font-size:.6875rem;font-weight:600;color:var(--slate-600);display:block;margin-bottom:4px">O introduce una URL:</label><input type="url" class="ex-url-input" id="exUrlInput" placeholder="${ex.data.urlPlaceholder||'https://...'}"></div>`:''}
    ${ex.data.commentField?`<div style="margin-top:12px"><label style="font-size:.6875rem;font-weight:600;color:var(--slate-600);display:block;margin-bottom:4px">${ex.data.commentLabel||'Descripción / comentarios:'}</label><textarea class="ex-textarea" id="exAns" placeholder="${ex.data.commentHint||'Describe tu trabajo…'}" style="min-height:100px" oncopy="return false"></textarea></div>`:''}`;
  }

  h+=`<div style="margin-top:16px"><button class="btn btn-primary" style="width:100%;justify-content:center" onclick="submitEx(${i})">Enviar respuesta →</button></div></div>`;
  ct.innerHTML=h;
  startExTimer(i);
}

function handleUpload(input){
  const file=input.files[0];
  if(!file)return;
  const zone=document.getElementById('uploadZone');
  zone.classList.add('has-file');
  zone.innerHTML=`<div class="ex-upload-preview"><span class="file-icon">${tpIcon('file')}</span><div class="file-info"><div class="file-name">${file.name}</div><div class="file-size">${(file.size/1024/1024).toFixed(2)} MB</div></div><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();document.getElementById('exFileInput').value='';document.getElementById('uploadZone').classList.remove('has-file');document.getElementById('uploadZone').innerHTML='<span class=\\'ex-upload-icon\\'>'+tpIcon('paperclip')+'</span><div class=\\'ex-upload-text\\'>Haz clic para cambiar archivo</div>';"><span>✕</span></button></div><input type="file" id="exFileInput" style="display:none" onchange="handleUpload(this)">`;
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
    let choices=[];items.forEach(el=>{choices.push({text:el.querySelector('h4')?.textContent||'',chosen:el.dataset.cat,correct:el.dataset.correct});});
    candidateResponse=JSON.stringify(choices);
    evaluationType='deterministic_plus_ai';
  }else if(ex.type==='cognitive'){
    const answers=_exState.cogAnswers||[];const correct=_exState.cogCorrect||[];
    if(answers.some(a=>a===-1)){toast('Falta responder a algún puzzle.');return;}
    let hits=0;answers.forEach((a,j)=>{if(a===correct[j])hits++;});
    const sc=Math.min(100,Math.round((hits/correct.length)*90)+10);
    exResults[i]={score:sc,time:_exTimeLeft?((getExercises(activeJob)[i].timeLimit||300)-_exTimeLeft):120,feedback:{overall:`Has acertado ${hits} de ${correct.length} secuencias.`,criteria:[{name:'Aciertos',score:Math.round((hits/correct.length)*100),comment:`${hits}/${correct.length} respuestas correctas`},{name:'Razonamiento lógico',score:sc,comment:sc>80?'Excelente capacidad de reconocimiento de patrones.':sc>60?'Buen nivel de razonamiento. Practica secuencias más complejas.':'Necesitas mejorar el reconocimiento de patrones numéricos y lógicos.'}],aiPowered:false}};
    recordEval(ex,sc,false,'Test de patrones (selección de opciones)',exResults[i].feedback);
    switchEx(i);return;
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
  ct.innerHTML=`<div class="ex-body"><div class="ai-eval-loading"><div class="ai-eval-spinner"></div><p>Evaluando tu respuesta con IA…</p><div class="eval-step" id="evalStep">Analizando contenido…</div></div></div>`;
  
  // Animate loading steps
  const steps=['Analizando contenido…','Aplicando rúbrica de evaluación…','Comparando con criterios del puesto…','Generando feedback personalizado…'];
  let stepIdx=0;
  const stepInterval=setInterval(()=>{stepIdx++;if(stepIdx<steps.length){const el=document.getElementById('evalStep');if(el)el.textContent=steps[stepIdx];}},1500);

  try{
    const result=await evaluateWithAI(ex, candidateResponse, evaluationType);
    clearInterval(stepInterval);
    exResults[i]={score:result.score,time:_exTimeLeft?((ex.timeLimit||300)-_exTimeLeft):120,feedback:result};
    recordEval(ex,result.score,result.aiPowered!==false,candidateResponse,result);
    switchEx(i);
  }catch(err){
    clearInterval(stepInterval);
    console.error('AI eval error:',err);
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
  // Pre-check for garbage
  const quality=detectQuality(response);
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
  const res=await fetch('/.netlify/functions/evaluate-exercise',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
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
  const criteria=fb.criteria||[];
  const isAI=fb.aiPowered!==false;
  
  let feedbackHTML='';
  if(criteria.length>0){
    // El texto del modelo puede citar la respuesta del candidato: se escapa siempre.
    const badge=fb.blockedByFilter?tpIcon('shield')+' Bloqueado por el filtro anti-manipulación':isAI?tpIcon('sparkles')+' Corregido con IA':tpIcon('chart')+' Corrección automática de reserva';
    feedbackHTML=`<div class="ai-feedback"><div class="ai-feedback-header"><div class="ai-badge">${badge}</div>${fb.receiptSigned?'<span class="tp-verified" title="Nota firmada por el Corrector v2 '+escHtml(fb.evaluatorVersion||'')+'">✓ Verificada</span>':''}<span style="font-size:.75rem;color:var(--slate-400);margin-left:auto">${escHtml(ex.title)}</span></div><div class="ai-feedback-body">${fb.capped?`<div class="tp-integrity-note warn">Nota limitada: ${escHtml(fb.capped)}.</div>`:''}<div class="ai-criteria-grid">${criteria.map(c=>{
      const cls=c.score>=75?'high':c.score>=50?'mid':'low';
      const color=c.score>=75?'var(--emerald-500)':c.score>=50?'var(--amber-500)':'var(--red-500)';
      return `<div class="ai-criterion"><div class="ai-criterion-name">${escHtml(c.name)}<span class="ai-criterion-score ${cls}">${c.score}/100</span></div><div class="ai-criterion-bar"><div class="ai-criterion-bar-fill" style="width:${c.score}%;background:${color}"></div></div><div class="ai-criterion-comment">${escHtml(c.comment||'')}</div></div>`;
    }).join('')}</div>${fb.overall?`<div class="ai-overall-comment">${escHtml(fb.overall)}</div>`:''}</div></div>`;
  }
  
  document.getElementById('exContent').innerHTML=`<div class="ex-body"><div style="text-align:center;margin-bottom:20px"><div style="width:48px;height:48px;border-radius:50%;background:var(--emerald-50);border:2px solid var(--emerald-200);display:inline-flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:12px">✓</div><h3 style="font-family:'Sora',sans-serif;font-weight:800;font-size:1.2rem;color:var(--emerald-600);margin-bottom:4px">Completado</h3><p style="color:var(--slate-500);font-size:.8125rem;margin-bottom:16px">${ex.title}</p><div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;max-width:300px;margin-left:auto;margin-right:auto"><div class="score-card" style="flex:1"><div class="score-num">${r.score}</div><div class="score-lbl">Score</div></div><div class="score-card" style="flex:1"><div class="score-num">${Math.floor(r.time/60)}:${(r.time%60).toString().padStart(2,'0')}</div><div class="score-lbl">Tiempo</div></div><div class="score-card" style="flex:1"><div class="score-num">Top ${r.score>80?'15':r.score>60?'30':'50'}%</div><div class="score-lbl">Ranking</div></div></div></div>${feedbackHTML}${window.TPIntegrity?TPIntegrity.html(r.integrity):''}<div style="display:flex;gap:10px;justify-content:center;margin-top:16px">${i<el.length-1?`<button class="btn btn-primary" onclick="switchEx(${i+1})">Siguiente →</button>`:''}${(()=>{const p=el.findIndex((_,j)=>exResults[j]===undefined);return (!allDone&&i===el.length-1&&p>=0)?`<button class="btn btn-primary" onclick="switchEx(${p})">Ir al ejercicio pendiente (0${p+1}) →</button>`:'';})()}${allDone?`<button class="btn btn-dark" onclick="showFinal()">Ver resultado final</button>`:''}</div></div>`;}
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
      const res=await TPCloud.saveEvaluation(u,{challengeId:activeJob.id,skill:skill,score:avg,criteria:crit.length?crit:null,reasoning:overalls.join('\n\n')||null,modelUsed:model,tokensIn:tin||null,tokensOut:tout||null,costEur:cost||null,receipts,integrity:integ});
      console.info('[TP] save-evaluation OK →',(ai?'IA '+(model||''):'sin IA'),res);
    }catch(e){console.warn('[TP] save-evaluation ERROR',e);}
  })();
  syncMyPoolEntry();
  document.getElementById('exNav').innerHTML='';document.getElementById('jmProgress').innerHTML='';
  const isCommon=activeJob._isCommon;
  const hasPending=isCommon&&_pendingJobId;
  document.getElementById('exContent').innerHTML=`<div class="ex-body" style="text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:var(--emerald-50);border:2px solid var(--emerald-200);display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:14px">${tpIcon('check-circle')}</div><h3 class="display" style="font-size:1.5rem;color:var(--emerald-600);margin-bottom:6px">${avg>=80?'Perfil activado':avg>=60?'Buen nivel':'Sigue practicando'}</h3><p style="color:var(--slate-500);margin-bottom:24px;font-size:.8125rem">Has completado los ${el.length} ejercicios de <strong>${escHtml(activeJob.title)}</strong>.${isCommon?' Tu skill ha sido actualizada en tu perfil.':''}</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:24px">${sc.map((s,i)=>`<div class="score-card"><div class="score-num">${s}</div><div class="score-lbl">EJ.0${i+1}</div></div>`).join('')}<div class="score-card"><div class="score-num">${avg}</div><div class="score-lbl">Media</div></div></div>${window.TPIntegrity?TPIntegrity.html(integ,true):''}${isCommon?`<div style="background:var(--emerald-50);border:1px solid var(--emerald-100);border-radius:8px;padding:14px;margin-bottom:20px;font-size:.8125rem;color:var(--emerald-600)">✓ Skill "<strong>${activeJob._skill}</strong>" desbloqueada con score <strong>${avg}</strong>. Todas las empresas pueden verlo.</div>`:''}<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${hasPending?`<button class="btn btn-primary" onclick="closeJobModal();openJob('${_pendingJobId}');_pendingJobId=null;">← Volver a la oferta</button><button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Ir al panel</button>`:`<button class="btn btn-outline" onclick="closeJobModal();openDashCand()">Volver al panel</button><button class="btn btn-primary" onclick="closeJobModal();openDashCand();setTimeout(()=>switchCandTab('common',document.querySelectorAll('#candDashTabs .dash-tab')[1]),100)">${isCommon?'Más retos comunes →':'Ver resultados →'}</button>`}</div></div>`;}

function closeJobModal(){document.getElementById('jobModal').classList.remove('open');}

