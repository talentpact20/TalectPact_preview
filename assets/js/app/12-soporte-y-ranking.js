// TalentPact · 12-soporte-y-ranking
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ AI CUSTOMER SUPPORT CHAT ═══
let _aiChatHistory=[];

function toggleAiChat(){
  const panel=document.getElementById('aiChatPanel');
  const fab=document.getElementById('aiChatFab');
  const isOpen=panel.classList.contains('open');
  panel.classList.toggle('open');
  fab.textContent=isOpen?'💬':'✕';
  fab.classList.toggle('open');
  if(!isOpen)document.getElementById('aiChatInput').focus();
}

async function sendAiChat(){
  const input=document.getElementById('aiChatInput');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  
  const body=document.getElementById('aiChatBody');
  body.innerHTML+=`<div class="ai-msg ai-msg-user">${msg.replace(/</g,'&lt;')}</div>`;
  body.innerHTML+=`<div class="ai-msg ai-msg-typing" id="aiTyping"><div class="dots"><span></span><span></span><span></span></div></div>`;
  body.scrollTop=body.scrollHeight;
  
  _aiChatHistory.push({role:'user',content:msg});
  
  // El prompt (y los precios que puede citar) los pone el servidor:
  // netlify/functions/lib/support-prompt.js.
  try{
    const res=await fetch('/.netlify/functions/support-chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:_aiChatHistory.slice(-10)})
    });
    if(!res.ok){
      const err=await res.json().catch(()=>({error:'Error desconocido en chat IA'}));
      throw new Error(err.error||'Error en chat IA');
    }
    const data=await res.json();
    const reply=data.reply||'Disculpa, no he podido procesar tu mensaje. ¿Puedes reformularlo?';
    _aiChatHistory.push({role:'assistant',content:reply});
    document.getElementById('aiTyping')?.remove();
    body.innerHTML+=`<div class="ai-msg ai-msg-bot">${reply.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>`;
  }catch(e){
    document.getElementById('aiTyping')?.remove();
    const fallback=getAiFallback(msg);
    body.innerHTML+=`<div class="ai-msg ai-msg-bot">${fallback}</div>`;
  }
  body.scrollTop=body.scrollHeight;
}

function getAiFallback(msg){
  const q=msg.toLowerCase();
  if(q.includes('precio')||q.includes('coste')||q.includes('pago'))
    return'Los precios de TalentPact son: desbloqueo de contacto por €49, Plan Pro a €199/mes (incluye 5 contactos), y Plan Enterprise a €499/mes (ilimitado). ¿Necesitas más detalle sobre algún plan?';
  if(q.includes('reto')||q.includes('ejercicio')||q.includes('prueba'))
    return'TalentPact tiene 102 categorías de retos que cubren desde soft skills (liderazgo, comunicación) hasta habilidades técnicas (React, Python, SQL). Cada reto tiene 3 niveles: Básico, Intermedio y Avanzado. ¿Sobre qué área quieres saber más?';
  if(q.includes('candidato')||q.includes('perfil'))
    return'Los perfiles de candidatos son 100% anónimos. Las empresas ven skills verificados y scores, pero nunca el nombre ni datos de contacto hasta que pagan por desbloquear. Esto elimina sesgos en la selección.';
  if(q.includes('empresa')||q.includes('publicar')||q.includes('oferta'))
    return'Como empresa, puedes publicar ofertas indicando los skills que necesitas y el nivel requerido. Los candidatos que cumplan los requisitos podrán aplicar. Verás su score anónimo y podrás desbloquear su contacto.';
  if(q.includes('ia')||q.includes('evaluación')||q.includes('score'))
    return'Cada respuesta es evaluada por IA con rúbricas específicas. El sistema detecta respuestas de baja calidad y las puntúa con 0-10. Un junior competente obtiene 65-80. Scores >90 son excepcionales.';
  return'Gracias por tu mensaje. Si necesitas algo específico sobre precios, retos, tu perfil o cómo funciona la plataforma, pregúntame directamente. Si es un tema más complejo, puedo escalar tu consulta a nuestro equipo.';
}

// ═══ AI CHATBOT ═══
function toggleChat(){
  const p=document.getElementById('chatPanel');
  p.classList.toggle('open');
  if(p.classList.contains('open'))document.getElementById('chatInput').focus();
}

const CHAT_FAQ={
  'retos':['Los retos son ejercicios prácticos cronometrados que evalúan tus habilidades reales. Hay 3 niveles: Básico, Intermedio y Avanzado. Cada reto tiene una pantalla de briefing que no revela el escenario hasta que pulses "Empezar". Una vez empieza, el timer cuenta hacia atrás y no se puede pausar.','Tenemos 102 retos en 25 áreas: desde soft skills (liderazgo, comunicación) hasta técnicos (React, Python, SQL). Completa los que quieras para construir tu perfil.'],
  'desbloquear':['Las empresas pagan €49 por desbloquear el contacto real de un candidato. Tu perfil es 100% anónimo hasta que una empresa paga. Al desbloquearlo, la empresa recibe tu contacto y puede escribirte directamente.','Si eres empresa: ve a una oferta → Ver candidatos → Desbloquear. Solo pagas si realmente quieres contactar.'],
  'problema':['Lamento que tengas un problema. Puedes reportarlo de dos formas:\n\n1. Ve a tu dashboard → pestaña "Soporte" → "Reportar un Problema"\n2. Escríbenos a hello@talentpact.io\n\nRespondemos en menos de 24h. Si es un problema con un score, incluye el nombre del reto y tu respuesta.'],
  'precio':['Para empresas:\n• Desbloqueo individual: €49/contacto\n• Plan Pro: €199/mes (5 contactos incluidos)\n• Plan Enterprise: €499/mes (contactos ilimitados)\n• Retos a medida: desde €299/vacante\n\nPara candidatos: gratis hasta 5 retos por semana; cada reto extra cuesta €5.'],
  'score':['Tu score se calcula con IA (Claude de Anthropic). Evalúa: relevancia, profundidad, estructura y aplicabilidad de tu respuesta. La escala va de 0 a 100:\n• 0-25: Insuficiente\n• 26-45: Por debajo del mínimo\n• 46-65: Aceptable\n• 66-80: Buen nivel junior\n• 81-100: Excelente'],
  'perfil':['Tu perfil muestra todas las skills que has desbloqueado con sus scores. Las empresas ven tu perfil de forma anónima (solo ven "Candidato #XXXX" + tus scores). Para completar tu perfil, haz retos comunes — cada uno desbloquea una skill.'],
  'default':['No estoy seguro de entender tu pregunta. Puedo ayudarte con:\n• Cómo funcionan los retos\n• Scores y evaluación IA\n• Precios para empresas\n• Tu perfil y skills\n• Reportar problemas\n\n¿Sobre qué quieres saber más?']
};

function getChatResponse(msg){
  const q=msg.toLowerCase();
  if(q.includes('reto')||q.includes('ejercicio')||q.includes('funciona'))return CHAT_FAQ.retos[q.includes('cuánto')||q.includes('tipo')?1:0];
  if(q.includes('desbloquea')||q.includes('contacto')||q.includes('unlock'))return CHAT_FAQ.desbloquear[q.includes('empresa')?1:0];
  if(q.includes('problema')||q.includes('error')||q.includes('bug')||q.includes('falla'))return CHAT_FAQ.problema[0];
  if(q.includes('precio')||q.includes('cuesta')||q.includes('gratis')||q.includes('pagar'))return CHAT_FAQ.precio[0];
  if(q.includes('score')||q.includes('puntuación')||q.includes('evalúa')||q.includes('nota'))return CHAT_FAQ.score[0];
  if(q.includes('perfil')||q.includes('skill')||q.includes('anónimo'))return CHAT_FAQ.perfil[0];
  return CHAT_FAQ.default[0];
}

function sendChat(){
  const input=document.getElementById('chatInput');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  const container=document.getElementById('chatMessages');
  container.innerHTML+=`<div class="chat-msg user">${msg}</div>`;
  container.innerHTML+=`<div class="chat-msg typing" id="chatTyping">Escribiendo…</div>`;
  container.scrollTop=container.scrollHeight;
  setTimeout(()=>{
    const typing=document.getElementById('chatTyping');
    if(typing)typing.remove();
    const response=getChatResponse(msg);
    container.innerHTML+=`<div class="chat-msg bot">${response.replace(/\n/g,'<br>')}</div>`;
    container.scrollTop=container.scrollHeight;
  },800+Math.floor(msg.length*15));
}

function askChat(question){
  document.getElementById('chatInput').value=question;
  sendChat();
}

// ═══ RANKING LEADERBOARD ═══
const RANKING_DATA=[
  {id:'r1',name:'Candidato #1847',sector:'IT',score:94,retos:9},
  {id:'r2',name:'Candidato #1293',sector:'Marketing',score:92,retos:7},
  {id:'r3',name:'Candidato #1561',sector:'IT',score:91,retos:8},
  {id:'r4',name:'Candidato #1034',sector:'Data',score:89,retos:6},
  {id:'r5',name:'Candidato #1422',sector:'Marketing',score:88,retos:5},
  {id:'you',name:'Tú',sector:'—',score:0,retos:0},
  {id:'r6',name:'Candidato #1688',sector:'Design',score:86,retos:5},
  {id:'r7',name:'Candidato #1105',sector:'Data',score:85,retos:4},
  {id:'r8',name:'Candidato #1779',sector:'Finance',score:83,retos:6},
  {id:'r9',name:'Candidato #1333',sector:'RRHH',score:81,retos:4},
  {id:'r10',name:'Candidato #1956',sector:'IT',score:80,retos:3},
  {id:'r11',name:'Candidato #1201',sector:'Business',score:79,retos:4},
  {id:'r12',name:'Candidato #1667',sector:'Sales',score:78,retos:3},
  {id:'r13',name:'Candidato #1444',sector:'Design',score:76,retos:4},
  {id:'r14',name:'Candidato #1555',sector:'IT',score:74,retos:2},
  {id:'r15',name:'Candidato #1888',sector:'Finance',score:72,retos:3},
];

function renderRanking(sector,btn){
  if(btn){
    document.querySelectorAll('#rankingSectorFilters .filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  // Update "you" entry with real profile data
  const you=RANKING_DATA.find(r=>r.id==='you');
  const completed=candidateProfile.completedCommon;
  if(completed.length>0){
    const scores=completed.map(c=>c.score);
    you.score=Math.round(scores.reduce((a,b)=>a+b)/scores.length);
    you.retos=completed.length;
  }
  
  let list=RANKING_DATA.slice();
  // Preferencia de privacidad: si la desactivas, tu fila desaparece del leaderboard.
  if(!prefIsOn('cand','publicRanking',true))list=list.filter(r=>r.id!=='you');
  if(sector&&sector!=='all')list=list.filter(r=>r.sector===sector||r.id==='you');
  list.sort((a,b)=>b.score-a.score);
  
  let h='';
  list.forEach((r,i)=>{
    const pos=i+1;
    const posCls=pos===1?'gold':pos===2?'silver':pos===3?'bronze':'normal';
    const isYou=r.id==='you';
    const scoreColor=r.score>=80?'var(--emerald-600)':r.score>=60?'var(--amber-500)':'var(--slate-500)';
    h+=`<div class="ranking-row ${isYou?'is-you':''}">
      <div class="ranking-pos ${posCls}">${pos<=3?['🥇','🥈','🥉'][pos-1]:pos}</div>
      <div class="ranking-name">${isYou?'<strong>⭐ Tú</strong>':r.name} <span>${r.sector} · ${r.retos} retos</span></div>
      <div class="ranking-score" style="color:${scoreColor}">${r.score>0?r.score:'—'}</div>
    </div>`;
  });
  
  if(!h)h='<div style="padding:24px;text-align:center;color:var(--slate-400)">No hay datos para este sector.</div>';
  document.getElementById('rankingList').innerHTML=h;
}

// ═══ ONBOARDING PROGRESS ═══
function renderOnboarding(){
  // Registro y sector salen de los datos reales: fijarlos a true hacía que un
  // invitado sin cuenta ni sector arrancara con un 33 % "completado".
  const meta=(tpUser&&tpUser.user_metadata)||{};
  const guest=TP.load('guestProfile',null)||{};
  const sector=((meta.sector||guest.sector)||'').trim();
  const skillsTotal=Object.keys(candidateProfile.skills).length;
  const skillsMeta=Math.ceil(skillsTotal*0.1);
  const steps=[
    {id:'register',label:'Registro',done:!!tpUser},
    {id:'sector',label:'Sector elegido',done:!!sector},
    {id:'first_reto',label:'1er reto completado',done:candidateProfile.completedCommon.length>=1},
    {id:'three_retos',label:'3 retos completados',done:candidateProfile.completedCommon.length>=3},
    {id:'five_retos',label:'5 retos completados',done:candidateProfile.completedCommon.length>=5},
    // La etiqueta decía ">70% skills" pero el umbral real es el 10 %: ahora dice lo que mide.
    {id:'profile_complete',label:skillsMeta+'+ skills verificadas',done:Object.values(candidateProfile.skills).filter(s=>s.unlocked).length>=skillsMeta},
  ];
  
  const doneCount=steps.filter(s=>s.done).length;
  const pct=Math.round((doneCount/steps.length)*100);
  
  document.getElementById('obPct').textContent=pct+'%';
  document.getElementById('obFill').style.width=pct+'%';
  document.getElementById('obSteps').innerHTML=steps.map(s=>
    `<div class="ob-step ${s.done?'done':'pending'}">${s.label}</div>`
  ).join('');
  
  // Hide onboarding bar if 100%
  document.getElementById('onboardingBar').style.display=pct>=100?'none':'block';
}

// ═══ FAQ DATA ═══
const FAQ_ITEMS=[
  {q:'¿Cómo funcionan los retos?',a:'Cada reto tiene 3 ejercicios de dificultad creciente (Básico → Intermedio → Avanzado). Primero ves un briefing sin el escenario. Al pulsar "Empezar", hay una cuenta atrás 3-2-1 y se revela el ejercicio con un timer. Tu respuesta se evalúa con IA.'},
  {q:'¿Mi perfil es anónimo?',a:'Sí. Las empresas ven "Candidato #XXXX" con tus scores y skills, pero nunca tu nombre, email o teléfono hasta que pagan €49 para desbloquearte. Tú recibes un email cuando te desbloquean.'},
  {q:'¿Puedo repetir un reto?',a:'Sí. Si no estás satisfecho con tu score, puedes repetir cualquier reto. Se queda el score más alto.'},
  {q:'¿Cómo se calcula el score?',a:'La IA evalúa tu respuesta en 4 criterios: relevancia (¿abordas el escenario?), profundidad (¿demuestras conocimiento real?), estructura (¿está bien organizada?) y aplicabilidad (¿es realista?). Cada criterio de 0 a 100.'},
  {q:'¿Qué pasa si mi score es bajo?',a:'No pasa nada negativo. Puedes repetir el reto, practicar más, o completar otros retos donde destaques. Las empresas ven tu mejor versión.'},
  {q:'¿Cuánto tarda la evaluación?',a:'La evaluación por IA tarda 3-8 segundos. Recibes feedback inmediato con puntuación y comentarios detallados por criterio.'},
  {q:'¿Es gratis para candidatos?',a:'Sí: hasta 5 retos por semana, tu perfil y tu SkillPass son gratis. Si quieres hacer más, cada reto extra cuesta €5. Los retos no se pagan al candidato: el valor es que las empresas te encuentren por lo que sabes hacer.'},
  {q:'¿Cómo me contactan las empresas?',a:'Cuando una empresa desbloquea tu contacto (pagando €49), recibe tu nombre, email y teléfono y puede escribirte directamente. Tú decides si respondes. Hasta ese momento tu perfil es anónimo.'},
];

function renderFAQ(){
  const el=document.getElementById('faqList');
  if(!el)return;
  el.innerHTML=FAQ_ITEMS.map((f,i)=>`<div style="border-bottom:1px solid var(--slate-100);padding:12px 0;cursor:pointer" onclick="this.querySelector('.faq-a').style.display=this.querySelector('.faq-a').style.display==='none'?'block':'none'">
    <div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:.8125rem;font-weight:600;color:var(--slate-700)">${f.q}</span><span style="color:var(--slate-400);font-size:.75rem">▾</span></div>
    <div class="faq-a" style="display:none;font-size:.78rem;color:var(--slate-500);margin-top:8px;line-height:1.6">${f.a}</div>
  </div>`).join('');
}

// ═══ SUPPORT BUG REPORT ═══
function submitBugReport(){
  const type=document.getElementById('bugType').value;
  const desc=document.getElementById('bugDesc').value.trim();
  if(!desc){toast('Cuéntanos qué ha pasado para poder ayudarte.');return;}

  toast('Reporte enviado. Gracias por ayudarnos a mejorar.','ok');
  document.getElementById('bugDesc').value = '';
}

// Explorar (landing): pintar retos y ofertas. Se lanza tras el evento load para no interferir con el scroll reset.
function initPublicExplore(){
  try{filterCommonExLanding();}catch(e){console.error('filterCommonExLanding',e);}
  try{filterJobs();}catch(e){console.error('filterJobs',e);}
  // Tras el reflow del grid, forzar de nuevo el scroll al top
  if(typeof _scrollTop==='function'){_scrollTop();setTimeout(_scrollTop,50);setTimeout(_scrollTop,150);}
}
// Esperar al load completo (fuentes, CSS) antes de pintar el grid, para que los _scrollTop previos ya hayan actuado
window.addEventListener('load',function(){
  setTimeout(initPublicExplore,0);
});
