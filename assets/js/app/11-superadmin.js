// TalentPact · 11-superadmin
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ SUPERADMIN BACKOFFICE ═══
const ADMIN_CANDIDATES=[
  {id:'p1',name:'Ana García Martínez',email:'ana.garcia@email.com',phone:'+34 612 345 678',initials:'AG',sector:'Marketing',score:88,retos:5,registered:'2026-01-15'},
  {id:'p2',name:'Mario Torres López',email:'m.torres@email.com',phone:'+34 623 456 789',initials:'MT',sector:'IT',score:91,retos:7,registered:'2026-01-22'},
  {id:'p3',name:'Laura Ruiz Fernández',email:'laura.ruiz@email.com',phone:'+34 634 567 890',initials:'LR',sector:'Data',score:85,retos:4,registered:'2026-02-03'},
  {id:'p4',name:'Carlos Pérez Gómez',email:'carlos.perez@email.com',phone:'+34 645 678 901',initials:'CP',sector:'Sales',score:72,retos:3,registered:'2026-02-10'},
  {id:'p5',name:'Sofía Navarro Chen',email:'sofia.navarro@email.com',phone:'+34 656 789 012',initials:'SN',sector:'Design',score:79,retos:4,registered:'2026-02-18'},
  {id:'p6',name:'Pablo Delgado Ruiz',email:'pablo.d@email.com',phone:'+34 667 890 123',initials:'PD',sector:'Finance',score:83,retos:6,registered:'2026-03-01'},
  {id:'p7',name:'Elena Moreno Vidal',email:'elena.m@email.com',phone:'+34 678 901 234',initials:'EM',sector:'RRHH',score:68,retos:2,registered:'2026-03-05'},
  {id:'p8',name:'Diego Alonso Kim',email:'diego.ak@email.com',phone:'+34 689 012 345',initials:'DA',sector:'IT',score:94,retos:9,registered:'2026-03-08'},
];

// Simulated business metrics
const ADMIN_BIZ={
  mrr:4850,mrrPrev:3920,mrrGrowth:23.7,
  arr:58200,
  totalRevenue:12430,
  activeCompanies:18,activeCompaniesPrev:14,
  contactUnlocks:87,contactUnlocksPrev:64,
  avgRevenuePerCompany:691,
  churnRate:4.2,churnPrev:5.8,
  creditUsageToday:142,creditUsageYesterday:128,
  totalEvaluations:3847,
  mrrHistory:[1200,1850,2400,3100,3920,4850],
  revenueByType:[{type:'Contactos unitarios',amount:6240,pct:50},{type:'Plan Pro (€199/mes)',amount:3582,pct:29},{type:'Plan Enterprise (€499/mes)',amount:1996,pct:16},{type:'Retos a medida',amount:612,pct:5}],
  creditsDaily:[98,112,87,134,142,128,156,148,102,95,167,142,131,120,155,148,136,124,142,138,152,148,162,155,142,130,128,145,158,142],
};

const ADMIN_AI={
  totalCalls:3847,totalCost:127.35,avgCostPerEval:0.033,
  marginPerContact:48.97,
  errorRate:1.8,appealRate:3.2,appealsPending:7,
  costsByType:[
    {type:'Análisis de datos',calls:812,avgCost:0.041,totalCost:33.29,margin:'98.6%'},
    {type:'Email / Redacción',calls:1340,avgCost:0.028,totalCost:37.52,margin:'99.1%'},
    {type:'Decisión / Clasificación',calls:924,avgCost:0.018,totalCost:16.63,margin:'99.4%'},
    {type:'Audio (simulación voz)',calls:420,avgCost:0.052,totalCost:21.84,margin:'98.3%'},
    {type:'Cognitive / Lógica',calls:245,avgCost:0.012,totalCost:2.94,margin:'99.6%'},
    {type:'Upload / Portfolio',calls:106,avgCost:0.065,totalCost:6.89,margin:'97.8%'},
  ],
  alerts:[
    {level:'warn',msg:'El reto "System Design Básico" tiene un coste medio de €0.089/eval (2.7x la media). Revisar complejidad del prompt.'},
    {level:'ok',msg:'Coste total IA este mes: €127.35. Presupuesto mensual: €500. Uso al 25.5%.'},
    {level:'warn',msg:'7 apelaciones pendientes de revisión. 3 en "Cold Call Improvisada" (posible problema con evaluación de audio).'},
  ],
  appeals:[
    {reto:'Cold Call Improvisada',quejas:12,score_medio:34,status:'🔴 Revisar rúbrica'},
    {reto:'JavaScript Debug Avanzado',quejas:8,score_medio:28,status:'🟡 Monitorizar'},
    {reto:'Análisis de P&L',quejas:5,score_medio:41,status:'🟡 Monitorizar'},
    {reto:'Negociar tu Salario',quejas:3,score_medio:52,status:'🟢 Normal'},
    {reto:'CSS Layout Debug',quejas:2,score_medio:61,status:'🟢 Normal'},
  ],
};

const ADMIN_PAYMENTS=[
  {date:'22 Mar 2026',company:'TechCorp',type:'Contacto',amount:49,method:'Visa ···4242',status:'Completado'},
  {date:'21 Mar 2026',company:'GrowthLab',type:'Plan Pro',amount:199,method:'Transferencia',status:'Completado'},
  {date:'21 Mar 2026',company:'DataPulse',type:'Contacto',amount:49,method:'Visa ···8811',status:'Completado'},
  {date:'20 Mar 2026',company:'FinEdge',type:'Plan Enterprise',amount:499,method:'Visa ···3366',status:'Completado'},
  {date:'20 Mar 2026',company:'SalesForward',type:'Contacto',amount:49,method:'PayPal',status:'Completado'},
  {date:'19 Mar 2026',company:'PixelCraft',type:'Reto a medida',amount:299,method:'Transferencia',status:'Completado'},
  {date:'19 Mar 2026',company:'TechCorp',type:'Contacto',amount:49,method:'Visa ···4242',status:'Completado'},
  {date:'18 Mar 2026',company:'PeopleFirst',type:'Plan Pro',amount:199,method:'Visa ···9922',status:'Pendiente'},
];

let _impersonating=null;

// Acceso al backoffice. El acceso real exige una sesión cuyo app_metadata.role
// sea 'admin': app_metadata solo lo puede escribir el servidor con la service
// key (user_metadata, en cambio, lo edita el propio usuario). Sin ese rol se
// entra en modo demostración, con datos ficticios y rotulado como tal: una
// contraseña escrita en el JS del cliente no protege nada, la ve cualquiera.
function tpEsAdmin(){const u=tpUser||tpCompany;return !!(u&&u.app_metadata&&u.app_metadata.role==='admin');}
function abrirBackoffice(modo){
  document.getElementById('adminLoginModal').classList.remove('open');
  const d=document.getElementById('dashAdmin');
  d.classList.add('open');
  let aviso=document.getElementById('admModoAviso');
  if(!aviso){aviso=document.createElement('div');aviso.id='admModoAviso';aviso.setAttribute('role','status');aviso.style.cssText='position:sticky;top:0;z-index:5;padding:8px 16px;font-size:.75rem;font-weight:600;text-align:center';d.prepend(aviso);}
  aviso.textContent=modo==='real'?'Backoffice · sesión con rol admin':'Modo demostración · todos los datos de este panel son ficticios';
  aviso.style.background=modo==='real'?'#064e3b':'#78350f';aviso.style.color='#fff';
  document.body.style.overflow='hidden';
  renderAdminMetrics();
}
function openAdmin(){
  closeAccessMenu();
  if(tpEsAdmin()){abrirBackoffice('real');return;}
  document.getElementById('adminPwInput').value='';
  document.getElementById('adminPwError').style.display='none';
  document.getElementById('adminLoginModal').classList.add('open');
  setTimeout(()=>document.getElementById('adminPwInput').focus(),100);
}
function submitAdminLogin(){
  const pw=document.getElementById('adminPwInput').value;
  // Clave de la DEMO (datos ficticios), no un control de seguridad.
  if(pw!=='admin2026'){
    document.getElementById('adminPwError').style.display='block';
    document.getElementById('adminPwInput').value='';
    document.getElementById('adminPwInput').focus();
    return;
  }
  abrirBackoffice('demo');
}
function closeAdminLogin(){
  document.getElementById('adminLoginModal').classList.remove('open');
}
function closeAdmin(){document.getElementById('dashAdmin').classList.remove('open');document.body.style.overflow='';}

function switchAdminPage(page,btn){
  document.querySelectorAll('.admin-nav-item').forEach(n=>n.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.admin-page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('adminPage-'+page);
  if(el)el.classList.add('active');
  if(page==='metrics')renderAdminMetrics();
  else if(page==='ai')renderAdminAI();
  else if(page==='library')renderAdminLibrary();
  else if(page==='impersonate')renderAdminImpersonate();
  else if(page==='candidates')renderAdminCandidates('');
  else if(page==='companies')renderAdminCompanies('');
  else if(page==='offers')renderAdminOffers();
  else if(page==='payments')renderAdminPayments();
}

// ═══ A. MÉTRICAS DE NEGOCIO ═══
function renderAdminMetrics(){
  const b=ADMIN_BIZ;
  document.getElementById('admBizMetrics').innerHTML=`
    <div class="admin-metric"><div class="am-label">MRR</div><div class="am-val">€${b.mrr.toLocaleString()}</div><div class="am-change am-up">↑ ${b.mrrGrowth}% vs mes anterior</div><div class="am-spark">${b.mrrHistory.map(v=>`<div class="am-spark-bar" style="height:${(v/Math.max(...b.mrrHistory))*28}px;background:${v===b.mrr?'var(--emerald-500)':'rgba(16,185,129,.25)'}"></div>`).join('')}</div></div>
    <div class="admin-metric"><div class="am-label">ARR (Proyección)</div><div class="am-val">€${b.arr.toLocaleString()}</div><div class="am-change" style="color:#6b7280">MRR × 12</div></div>
    <div class="admin-metric"><div class="am-label">Empresas activas</div><div class="am-val">${b.activeCompanies}</div><div class="am-change am-up">↑ ${b.activeCompanies-b.activeCompaniesPrev} nuevas este mes</div></div>
    <div class="admin-metric"><div class="am-label">Churn Rate</div><div class="am-val">${b.churnRate}%</div><div class="am-change ${b.churnRate<b.churnPrev?'am-up':'am-down'}">${b.churnRate<b.churnPrev?'↓':'↑'} ${Math.abs(b.churnRate-b.churnPrev).toFixed(1)}pp vs anterior</div></div>
  `;
  // MRR Chart
  const months=['Oct','Nov','Dic','Ene','Feb','Mar'];
  const maxMrr=Math.max(...b.mrrHistory);
  document.getElementById('admMrrChart').innerHTML=`<div class="admin-chart">${b.mrrHistory.map((v,i)=>`<div class="admin-chart-bar" style="height:${(v/maxMrr)*90}px;background:${i===b.mrrHistory.length-1?'var(--emerald-500)':'rgba(16,185,129,.3)'}" title="€${v}"></div>`).join('')}</div><div style="display:flex;gap:4px;padding:0 0 8px;font-size:.6rem;color:#6b7280;font-family:JetBrains Mono,monospace">${months.map(m=>`<span style="flex:1;text-align:center">${m}</span>`).join('')}</div>`;
  // Revenue breakdown
  document.getElementById('admRevenueBreakdown').innerHTML=b.revenueByType.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1f2937"><div><div style="font-size:.78rem;color:white;font-weight:600">${r.type}</div><div style="font-size:.65rem;color:#6b7280">${r.pct}% del total</div></div><div style="font-family:JetBrains Mono,monospace;color:var(--emerald-400);font-weight:700">€${r.amount.toLocaleString()}</div></div>`).join('');
  // Credits chart
  const maxC=Math.max(...b.creditsDaily);
  document.getElementById('admCreditsChart').innerHTML=`<div class="admin-chart">${b.creditsDaily.map((v,i)=>`<div class="admin-chart-bar" style="height:${(v/maxC)*80}px;background:${v>150?'var(--amber-500)':'var(--emerald-500)'};opacity:${i>=b.creditsDaily.length-7?1:.4}" title="${v} evals"></div>`).join('')}</div><div style="font-size:.65rem;color:#6b7280;padding:0 0 8px">← 30 días · Media: ${Math.round(b.creditsDaily.reduce((a,c)=>a+c)/b.creditsDaily.length)} evals/día · Hoy: ${b.creditUsageToday}</div>`;
}

// ═══ B. IA & COSTES ═══
function renderAdminAI(){
  const a=ADMIN_AI;
  // ── Datos REALES persistidos en esta instalación (audit trail localStorage) ──
  const real=TP.getEvals();
  const realCount=real.length;
  const realAvg=realCount?Math.round(real.reduce((s,e)=>s+(e.score||0),0)/realCount):0;
  const realCost=real.reduce((s,e)=>s+(e.estCost||0),0);
  const realAi=real.filter(e=>e.aiPowered).length;
  const realBanner=document.getElementById('admAiRealData');
  if(realBanner){
    realBanner.innerHTML=realCount
      ?`<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center"><div style="font-size:.7rem;color:var(--emerald-400);font-weight:700;text-transform:uppercase;letter-spacing:.04em">● Datos reales (esta instalación)</div><div style="color:#cbd5e1;font-size:.8rem"><strong style="color:white">${realCount}</strong> evaluaciones registradas</div><div style="color:#cbd5e1;font-size:.8rem">Score medio real <strong style="color:white">${realAvg}/100</strong></div><div style="color:#cbd5e1;font-size:.8rem"><strong style="color:white">${realAi}</strong> con IA (Claude)</div><div style="color:#cbd5e1;font-size:.8rem">Coste real total <strong style="color:var(--emerald-400)">€${realCost.toFixed(4)}</strong></div></div>`
      :`<div style="color:#6b7280;font-size:.78rem">Sin evaluaciones reales registradas todavía. Completa un reto como candidato y aparecerán aquí (persistidas en localStorage).</div>`;
  }
  // ── Historial de evaluaciones (respuesta + feedback completo) ──
  const hist=document.getElementById('admAiHistory');
  if(hist){
    if(!realCount){
      hist.innerHTML='<div style="color:#6b7280;font-size:.78rem">Sin evaluaciones registradas todavía. Cada ejercicio que un candidato complete aparecerá aquí con su respuesta y el feedback de la IA.</div>';
    }else{
      hist.innerHTML=real.slice().reverse().slice(0,50).map(e=>{
        const d=new Date(e.ts);
        const fecha=isNaN(d)?'':d.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        const sc=e.score||0;
        const col=sc>=80?'var(--emerald-400)':sc>=50?'var(--amber-500)':'var(--red-500)';
        const cost=typeof e.estCost==='number'?e.estCost:0;
        const costLabel=cost>0?`€${cost.toFixed(4)}`:'—';
        const tokTip=(e.tokensIn||e.tokensOut)?`${e.tokensIn||0} in / ${e.tokensOut||0} out · `:'';
        const crit=(e.criteria||[]).map(c=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0"><span style="color:#cbd5e1">${escHtml(c.name)}</span><span style="font-family:JetBrains Mono,monospace;color:#94a3b8">${c.score}/100</span></div>${c.comment?`<div style="color:#6b7280;font-size:.7rem;margin:0 0 6px">${escHtml(c.comment)}</div>`:''}`).join('');
        return `<details style="border:1px solid #1f2937;border-radius:8px;margin-bottom:8px;padding:0 12px">
          <summary style="cursor:pointer;padding:10px 0;display:flex;align-items:center;gap:12px;list-style:none">
            <span style="font-family:JetBrains Mono,monospace;font-weight:700;color:${col};min-width:34px">${sc}</span>
            <span style="color:white;font-weight:600;font-size:.8rem">${escHtml(e.exTitle)}</span>
            <span style="color:#6b7280;font-size:.7rem">${escHtml(e.job)} · ${escHtml(e.sector)}</span>
            <span style="font-family:JetBrains Mono,monospace;color:var(--emerald-400);font-size:.7rem;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.18);border-radius:5px;padding:1px 7px">${costLabel}</span>
            <span style="margin-left:auto;color:#6b7280;font-size:.7rem">${fecha}${e.aiPowered?' · IA':''}</span>
          </summary>
          <div style="padding:6px 0 12px">
            <div style="font-size:.7rem;color:#6b7280;margin-bottom:8px;font-family:JetBrains Mono,monospace">Coste ${e.costReal?'real':'estimado'}: ${costLabel}${cost>0?`  ·  ${tokTip}modelo claude-sonnet-4-6`:''}</div>
            ${e.overall?`<div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);border-radius:6px;padding:8px 10px;margin-bottom:8px;color:#cbd5e1;font-size:.75rem"><strong style="color:#60a5fa">Feedback IA:</strong> ${escHtml(e.overall)}</div>`:''}
            ${crit?`<div style="margin-bottom:8px">${crit}</div>`:''}
            ${e.response?`<div style="font-size:.66rem;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Respuesta del candidato</div><div style="background:#0b1220;border:1px solid #1f2937;border-radius:6px;padding:8px 10px;color:#94a3b8;font-size:.72rem;white-space:pre-wrap;max-height:160px;overflow:auto">${escHtml(e.response)}</div>`:''}
          </div>
        </details>`;
      }).join('');
    }
  }
  document.getElementById('admAiMetrics').innerHTML=`
    <div class="admin-metric"><div class="am-label">Coste total IA (mes)</div><div class="am-val">€${a.totalCost.toFixed(2)}</div><div class="am-change" style="color:#6b7280">${a.totalCalls.toLocaleString()} evaluaciones</div></div>
    <div class="admin-metric"><div class="am-label">Coste medio/eval</div><div class="am-val">€${a.avgCostPerEval.toFixed(3)}</div><div class="am-change am-up">Margen: €${a.marginPerContact.toFixed(2)}/contacto</div></div>
    <div class="admin-metric"><div class="am-label">Tasa de error IA</div><div class="am-val">${a.errorRate}%</div><div class="am-change ${a.errorRate<3?'am-up':'am-down'}">${a.errorRate<3?'✓ Dentro del rango':'⚠️ Revisar'}</div></div>
    <div class="admin-metric"><div class="am-label">Apelaciones pendientes</div><div class="am-val">${a.appealsPending}</div><div class="am-change ${a.appealsPending>5?'am-down':'am-up'}">${a.appealRate}% de candidatos apelan</div></div>
  `;
  // Cost by type table
  document.getElementById('admAiCosts').innerHTML=`<table class="admin-table"><thead><tr><th>Tipo de reto</th><th>Evaluaciones</th><th>Coste medio</th><th>Coste total</th><th>Margen</th></tr></thead><tbody>${a.costsByType.map(c=>{
    const isHigh=c.avgCost>0.05;
    return`<tr><td style="color:white;font-weight:600">${c.type}</td><td>${c.calls}</td><td style="color:${isHigh?'var(--amber-500)':'var(--emerald-400)'};font-family:JetBrains Mono,monospace">€${c.avgCost.toFixed(3)}</td><td style="font-family:JetBrains Mono,monospace">€${c.totalCost.toFixed(2)}</td><td><span class="at-status at-active">${c.margin}</span></td></tr>`;
  }).join('')}</tbody></table>`;
  // Alerts
  document.getElementById('admAiAlerts').innerHTML=a.alerts.map(al=>`<div class="ai-alert" style="${al.level==='ok'?'background:rgba(16,185,129,.05);border-color:rgba(16,185,129,.15);color:var(--emerald-400)':''}"><span>${al.level==='warn'?'⚠️':'✅'}</span><span>${al.msg}</span></div>`).join('');
  // Appeals table
  document.getElementById('admAiAppeals').innerHTML=`<table class="admin-table"><thead><tr><th>Reto</th><th>Quejas</th><th>Score medio quejas</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${a.appeals.map(ap=>`<tr><td style="color:white;font-weight:600">${ap.reto}</td><td style="font-family:JetBrains Mono,monospace">${ap.quejas}</td><td style="color:${ap.score_medio<40?'var(--red-500)':'var(--amber-500)'};font-family:JetBrains Mono,monospace">${ap.score_medio}/100</td><td>${ap.status}</td><td><button class="admin-btn" onclick="toast('El editor de rúbricas todavía no está construido. Reto: ${ap.reto}')">Revisar rúbrica</button></td></tr>`).join('')}</tbody></table>`;
}

// ═══ C. MASTER LIBRARY ═══
function renderAdminLibrary(){
  const q=(document.getElementById('admLibSearch')?.value||'').toLowerCase();
  let list=COMMON_EXERCISES;
  if(q)list=list.filter(ce=>(ce.title+' '+ce.skill+' '+(ce.searchTerms||'')).toLowerCase().includes(q));
  
  const softCount=COMMON_EXERCISES.filter(c=>c.category==='soft').length;
  const sectorCount=COMMON_EXERCISES.filter(c=>c.category==='sector').length;
  const totalEx=COMMON_EXERCISES.reduce((a,c)=>a+c.exercises.length,0);
  
  document.getElementById('admLibStats').innerHTML=`
    <div class="admin-metric"><div class="am-label">Total retos</div><div class="am-val">${COMMON_EXERCISES.length}</div></div>
    <div class="admin-metric"><div class="am-label">Soft skills</div><div class="am-val">${softCount}</div></div>
    <div class="admin-metric"><div class="am-label">Sectoriales</div><div class="am-val">${sectorCount}</div></div>
    <div class="admin-metric"><div class="am-label">Total ejercicios</div><div class="am-val">${totalEx}</div></div>
  `;
  document.getElementById('admLibCount').textContent=list.length+' retos';
  
  document.getElementById('admLibBody').innerHTML=list.map(ce=>{
    const isActive=ce._disabled!==true;
    const completed=ce.exercises.length*12+(ce.id.charCodeAt(7)%30);
    const avgScore=45+(ce.id.charCodeAt(8)%35);
    const catBadge=ce.category==='soft'?'<span class="at-status" style="background:rgba(168,85,247,.1);color:#a855f7">Soft</span>':'<span class="at-status" style="background:rgba(59,130,246,.1);color:#3b82f6">Sector</span>';
    return`<tr>
      <td><button class="admin-toggle ${isActive?'on':''}" onclick="toggleReto('${ce.id}',this)"></button></td>
      <td><span style="margin-right:6px">${ce.icon}</span><span style="color:white;font-weight:600">${ce.title}</span></td>
      <td style="font-size:.7rem">${ce.skill}</td>
      <td>${catBadge}</td>
      <td style="font-family:JetBrains Mono,monospace">${ce.exercises.length}</td>
      <td style="font-family:JetBrains Mono,monospace">${completed}</td>
      <td style="font-family:JetBrains Mono,monospace;color:${avgScore>=60?'var(--emerald-400)':'var(--amber-500)'}">${avgScore}/100</td>
      <td><button class="admin-btn" onclick="toast('Editor de «${ce.title}»: aún no construido. Ahí irán escenarios, tiempos, rúbricas y dificultad.')">Editar</button></td>
    </tr>`;
  }).join('');
}

function toggleReto(id,btn){
  const ce=COMMON_EXERCISES.find(c=>c.id===id);
  if(!ce)return;
  ce._disabled=!ce._disabled;
  btn.classList.toggle('on');
  const status=ce._disabled?'DESACTIVADO':'ACTIVADO';
  console.log(`Reto ${ce.title} ${status}`);
}

// ═══ D. IMPERSONATE ═══
function renderAdminImpersonate(){
  document.getElementById('admImpersonateCompanies').innerHTML=COMPANIES.map(c=>`<button class="admin-btn" style="padding:10px;text-align:left;display:flex;align-items:center;gap:8px" onclick="impersonateCompany('${c.id}')"><span style="font-size:1.2rem">${c.logo}</span><div><div style="color:white;font-weight:600;font-size:.78rem">${c.name}</div><div style="font-size:.65rem;color:#6b7280">${c.sector} · ${c.size}</div></div></button>`).join('');
  
  document.getElementById('admImpersonateCandidates').innerHTML=ADMIN_CANDIDATES.map(c=>`<button class="admin-btn" style="padding:10px;text-align:left;display:flex;align-items:center;gap:8px" onclick="impersonateCandidate('${c.id}')"><div style="width:28px;height:28px;border-radius:6px;background:rgba(16,185,129,.1);color:var(--emerald-400);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0">${c.initials}</div><div><div style="color:white;font-weight:600;font-size:.78rem">${c.name}</div><div style="font-size:.65rem;color:#6b7280">${c.sector} · Score: ${c.score}</div></div></button>`).join('');
}

function impersonateCompany(id){
  const c=COMPANIES.find(x=>x.id===id);
  if(!c)return;
  _impersonating={type:'company',id,name:c.name};
  document.getElementById('impersonateBar').style.display='flex';
  document.getElementById('impersonateName').textContent=c.name+' (Empresa)';
  closeAdmin();
  openDashEmp();
  // La barra fija de suplantacion ya avisa de forma permanente; el cuadro
  // nativo solo obligaba a pulsar Aceptar antes de poder mirar nada.
  toast('Suplantación activa: ves el panel como '+c.name+'. Nada de lo que hagas afecta a datos reales.');
}

function impersonateCandidate(id){
  const c=ADMIN_CANDIDATES.find(x=>x.id===id);
  if(!c)return;
  _impersonating={type:'candidate',id,name:c.name};
  document.getElementById('impersonateBar').style.display='flex';
  document.getElementById('impersonateName').textContent=c.name+' (Candidato)';
  closeAdmin();
  openDashCand();
  toast('Suplantación activa: ves la plataforma como '+c.name+'.');
}

function exitImpersonate(){
  _impersonating=null;
  document.getElementById('impersonateBar').style.display='none';
  // Close any open dashboards
  document.querySelectorAll('.dash-overlay,.modal-overlay,.auth-overlay').forEach(el=>el.classList.remove('open'));
  document.body.style.overflow='';
  openAdmin();
}

// ═══ DATA PAGES ═══
function renderAdminCandidates(filter){
  const q=filter.toLowerCase();
  const list=q?ADMIN_CANDIDATES.filter(c=>(c.name+c.email+c.sector).toLowerCase().includes(q)):ADMIN_CANDIDATES;
  document.getElementById('admCandBody').innerHTML=list.map(c=>`<tr>
    <td><div style="width:28px;height:28px;border-radius:6px;background:rgba(16,185,129,.1);color:var(--emerald-400);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700">${c.initials}</div></td>
    <td class="td-name">${c.name}</td><td class="td-email">${c.email}</td><td>${c.sector}</td>
    <td style="font-family:JetBrains Mono,monospace;color:var(--emerald-400);font-weight:700">${c.score}</td>
    <td>${c.retos}</td><td style="font-size:.65rem;color:#6b7280">${c.registered}</td>
    <td><button class="admin-btn" onclick="impersonateCandidate('${c.id}')">👁️ Ver como</button></td>
  </tr>`).join('');
}

function renderAdminCompanies(filter){
  const q=filter.toLowerCase();
  const list=q?COMPANIES.filter(c=>(c.name+c.sector).toLowerCase().includes(q)):COMPANIES;
  const plans=['Free','Pro','Pro','Enterprise','Free','Pro','Pro','Free','Pro','Free','Free','Free'];
  const mrrs=[0,199,199,499,0,199,199,0,199,0,0,0];
  document.getElementById('admCompBody').innerHTML=list.map((c,i)=>{
    const plan=plans[i%plans.length];const mrr=mrrs[i%mrrs.length];
    const churnRisk=mrr===0?'<span class="at-status at-warn">No paga</span>':i%5===0?'<span class="at-status at-danger">Alto</span>':'<span class="at-status at-active">Bajo</span>';
    return`<tr>
      <td><span style="font-size:1rem">${c.logo}</span></td>
      <td class="td-name">${c.name}</td><td>${c.sector}</td><td>${c.size}</td>
      <td><span class="at-status ${plan==='Enterprise'?'at-active':plan==='Pro'?'at-active':'at-warn'}">${plan}</span></td>
      <td style="font-family:JetBrains Mono,monospace;color:${mrr>0?'var(--emerald-400)':'#6b7280'}">€${mrr}/mes</td>
      <td style="font-family:JetBrains Mono,monospace">${(i*3+2)%12}</td>
      <td>${churnRisk}</td>
      <td><button class="admin-btn" onclick="impersonateCompany('${c.id}')">👁️ Ver como</button></td>
    </tr>`;
  }).join('');
}

function renderAdminOffers(){
  document.getElementById('admOfferBody').innerHTML=JOBS.map(j=>{
    const co=COMPANIES.find(c=>c.id===j.company);
    const level=j.requiredLevel||'basico';
    const levelCls=level==='avanzado'?'at-danger':level==='intermedio'?'at-warn':'at-active';
    return`<tr>
      <td class="td-name">${escHtml(j.title)}</td>
      <td>${co?.name||''}</td>
      <td><span class="at-status ${levelCls}">${level.charAt(0).toUpperCase()+level.slice(1)}</span></td>
      <td style="font-size:.65rem">${(j.requiredSkills||[]).join(', ')}</td>
      <td style="font-family:JetBrains Mono,monospace">${5+(j.id.charCodeAt(0)%12)}</td>
      <td><span class="at-status at-active">Activa</span></td>
    </tr>`;
  }).join('');
}

function renderAdminPayments(){
  const total=ADMIN_PAYMENTS.reduce((a,p)=>a+p.amount,0);
  const contacts=ADMIN_PAYMENTS.filter(p=>p.type==='Contacto').length;
  document.getElementById('admPayMetrics').innerHTML=`
    <div class="admin-metric"><div class="am-label">Ingresos totales</div><div class="am-val">€${total.toLocaleString()}</div></div>
    <div class="admin-metric"><div class="am-label">Transacciones</div><div class="am-val">${ADMIN_PAYMENTS.length}</div></div>
    <div class="admin-metric"><div class="am-label">Contactos vendidos</div><div class="am-val">${contacts}</div></div>
    <div class="admin-metric"><div class="am-label">Ticket medio</div><div class="am-val">€${Math.round(total/ADMIN_PAYMENTS.length)}</div></div>
  `;
  document.getElementById('admPayBody').innerHTML=ADMIN_PAYMENTS.map(p=>`<tr>
    <td style="font-size:.7rem;color:#6b7280">${p.date}</td>
    <td class="td-name">${p.company}</td>
    <td>${p.type}</td>
    <td style="font-family:JetBrains Mono,monospace;color:var(--emerald-400);font-weight:700">€${p.amount}</td>
    <td style="font-size:.65rem;color:#6b7280">${p.method}</td>
    <td><span class="at-status ${p.status==='Completado'?'at-active':'at-warn'}">${p.status}</span></td>
  </tr>`).join('');
}

// ═══ PAYMENT METHOD (EMPRESA) ═══
function selectPayMethod(method,el){
  document.querySelectorAll('.pm-method').forEach(m=>{m.classList.remove('active');m.querySelector('.pm-check').textContent='';});
  el.classList.add('active');
  el.querySelector('.pm-check').textContent='✓';
}
function toggleAddPayMethod(){
  const f=document.getElementById('pmAddForm');
  f.classList.toggle('open');
}
function savePayMethod(){
  const inputs=document.querySelectorAll('#pmAddForm .pm-input');
  const vals=[...inputs].map(i=>i.value.trim());
  if(vals.some(v=>!v)){toast('Faltan campos por rellenar.');return;}
  const last4=vals[1].replace(/\s/g,'').slice(-4);
  document.getElementById('empSavedCard').innerHTML=`<span class="card-brand">💳</span><div class="card-info"><div class="card-num">Visa •••• •••• •••• ${last4}</div><div class="card-exp">Expira ${vals[2]} · Predeterminada</div></div><button class="btn btn-outline btn-sm" onclick="toggleAddPayMethod()">Cambiar</button>`;
  inputs.forEach(i=>i.value='');
  toggleAddPayMethod();
  toast('Tarjeta guardada. Los cobros futuros se harán con esta tarjeta.','ok');
}

