// TalentPact · 02-grabacion
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ AUDIO/VIDEO RECORDING ENGINE ═══
let _recState={recording:false,timer:null,elapsed:0,stream:null,analyser:null,bars:[]};
function startRecording(duration){
  _recState.recording=true;_recState.elapsed=0;
  const btn=document.getElementById('recBtn');
  const timer=document.getElementById('recTimer');
  const status=document.getElementById('recStatus');
  if(btn){btn.classList.add('recording');}
  if(status){status.textContent='Grabando…';status.className='rec-status live';}
  // Animate waveform
  _recState.timer=setInterval(()=>{
    _recState.elapsed++;
    const rem=duration-_recState.elapsed;
    if(timer)timer.textContent=Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0');
    // Animate wave bars
    document.querySelectorAll('.wave-bar').forEach(bar=>{
      const h=8+(Math.sin(b*0.3+Date.now()*0.001)*24+24);
      bar.style.height=h+'px';
      bar.classList.add('active');
    });
    if(_recState.elapsed>=duration){stopRecording();}
  },1000);
  // Try real microphone access for visual feedback
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      _recState.stream=stream;
    }).catch(()=>{});
  }
}
function stopRecording(){
  _recState.recording=false;
  clearInterval(_recState.timer);
  if(_recState.stream){_recState.stream.getTracks().forEach(t=>t.stop());_recState.stream=null;}
  const btn=document.getElementById('recBtn');
  const status=document.getElementById('recStatus');
  if(btn)btn.classList.remove('recording');
  if(status){status.textContent='✓ Grabación completada';status.className='rec-status';status.style.color='var(--emerald-400)';}
  document.querySelectorAll('.wave-bar').forEach(bar=>{bar.style.height='4px';bar.classList.remove('active');});
  // Show simulated analysis
  const metricsEl=document.getElementById('recMetrics');
  if(metricsEl){
    metricsEl.style.display='grid';
    const _flu=Math.min(95,Math.round(72+_recState.elapsed*0.3));const _cla=Math.min(92,Math.round(68+_recState.elapsed*0.25));metricsEl.innerHTML=`<div class="rec-metric"><div class="rec-metric-val">${_flu}%</div><div class="rec-metric-lbl">Fluidez</div></div><div class="rec-metric"><div class="rec-metric-val">${_cla}%</div><div class="rec-metric-lbl">Claridad</div></div><div class="rec-metric"><div class="rec-metric-val">${_recState.elapsed}s</div><div class="rec-metric-lbl">Duración</div></div>`;
  }
  document.getElementById('recSubmitBtn').style.display='block';
}
function toggleRecording(duration){
  if(_recState.recording){stopRecording();}else{startRecording(duration);}
}
// Generic exercise generator for jobs without custom exercises
function getExercises(job){
  // Common exercises
  if(job._isCommon){const ce=COMMON_EXERCISES.find(c=>c.id===job.id);return ce?ce.exercises:[];}
  if(EX_DB[job.id])return EX_DB[job.id];
  return[{id:'e1',num:'01',title:'Análisis de Situación',sub:'Analítica — 10 min',skills:{hard:job.tags.slice(0,2),soft:['Pensamiento crítico']},scenario:`Situación real para ${job.title}. Analiza los datos y propón acciones.`,type:'analysis',data:{table:[{n:'Métrica A',a:'Alto',b:'Positivo',c:'120',d:'OK',cls:'v-good'},{n:'Métrica B',a:'Bajo',b:'Negativo',c:'45',d:'⚠️',cls:'v-bad'},{n:'Métrica C',a:'Medio',b:'Neutro',c:'89',d:'→',cls:'v-warn'}],headers:['Elemento','Rendimiento','Tendencia','Valor','Status'],q:'Analiza los datos. ¿Cuál es el principal problema? ¿Qué acciones propondrías?',kw:['problema','acción','mejorar','priorizar']}},{id:'e2',num:'02',title:'Toma de Decisión',sub:'Estrategia — 10 min',skills:{hard:job.tags.slice(0,2),soft:['Priorización']},scenario:`Clasifica elementos según su prioridad para ${job.title}.`,type:'decision',data:{options:[{id:'d1',text:'Opción estratégica A — Alto impacto',correct:'priority'},{id:'d2',text:'Opción táctica B — Medio impacto',correct:'priority'},{id:'d3',text:'Opción operativa C — Bajo impacto',correct:'depriority'},{id:'d4',text:'Opción cosmética D — Muy bajo impacto',correct:'depriority'}],cats:['✅ Priorizar','⏸ Desprioritizar'],keys:['priority','depriority']}},{id:'e3',num:'03',title:'Comunicación Profesional',sub:'Email — 10 min',skills:{hard:job.tags.slice(0,1),soft:['Comunicación']},scenario:`Redacta un email profesional para ${job.title}.`,type:'email',data:{to:'Equipo / Cliente',subject:'Asunto del email',hint:'Estructura: contexto, propuesta, próximos pasos.'}}];}

