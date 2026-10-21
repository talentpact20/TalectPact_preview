// TalentPact · 25-talento
// Búsqueda de candidatos para empresas, con la estructura de LinkedIn Recruiter:
// una columna fija con los filtros de siempre, secciones plegables con «+»,
// contador en vivo, búsqueda con IA (descripción o documento) y desbloqueos
// gratis de las 3 primeras ofertas. Sustituye a renderEmpPool de 19-rrhh.js.
// Script clásico: ámbito global compartido (ver assets/js/README.md).

// ═══ Desbloqueos gratis (lib/gratis.js) ═══
var TPGratis={
  datos:null,
  poner(g){TPGratis.datos=g||null;TPGratis.pintar();},
  async cargar(){
    if(!tpCompany)return;
    try{const r=await TPCloud._postAuth('unlock-free',{});if(r&&r.gratis)TPGratis.poner(r.gratis);}catch(e){console.warn('[TP] gratis',e);}
  },
  texto(){
    const g=TPGratis.datos;if(!g)return '';
    if(!g.ofertasPublicadas)return 'Tus 3 primeras ofertas incluyen 1 desbloqueo de contacto gratis cada una. Publica la primera para probar el proceso completo.';
    if(g.restantes)return 'Te '+(g.restantes===1?'queda 1 desbloqueo gratis':'quedan '+g.restantes+' desbloqueos gratis')+' de tus primeras ofertas.'+(g.ofertasGratisPendientes?' Cada oferta nueva, hasta 3, suma uno.':'');
    if(g.ofertasGratisPendientes)return 'Has usado tus desbloqueos gratis. Publica otra oferta (te '+(g.ofertasGratisPendientes===1?'queda 1':'quedan '+g.ofertasGratisPendientes)+' con regalo) para conseguir uno más.';
    return 'Ya has usado los 3 desbloqueos gratis de tus primeras ofertas.';
  },
  pintar(){
    const t=TPGratis.texto();
    ['tpRsGratis','empGratisPlan','empGratisOfertas'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent=t;el.hidden=!t;}});
  },
  /** Bloque del modal de pago: usar uno gratis en vez de pagar. */
  pintarModal(){
    const box=document.getElementById('payGratis');if(!box)return;
    const g=TPGratis.datos;
    if(!g||!g.restantes){box.hidden=true;box.innerHTML='';return;}
    box.hidden=false;
    box.innerHTML='<div class="pay-gratis-txt"><strong>Desbloqueo gratis disponible</strong><span>'+escHtml(TPGratis.texto())+'</span></div>'+
      '<button type="button" class="btn btn-primary u-w-100pct u-jc-center" id="payGratisBtn" onclick="TPGratis.usar()">Usar un desbloqueo gratis</button>';
  },
  async usar(){
    const c=_payingForCand;if(!c)return;
    const b=document.getElementById('payGratisBtn');if(b){b.disabled=true;b.textContent='Desbloqueando…';}
    let r;
    try{r=await TPCloud._postAuth('unlock-free',{candidateRef:String(c.id)});}catch(e){r={error:e.message||String(e)};}
    if(r&&r.gratis)TPGratis.poner(r.gratis);
    if(!r||r.error){
      Pay._status('err','<strong>No se pudo usar el desbloqueo gratis.</strong> '+escHtml((r&&r.error)||'Sin respuesta del servidor.'));
      TPGratis.pintarModal();return;
    }
    Pay.paidRefs.add(String(c.id));c._unlocked=true;if(TP.saveUnlocks)TP.saveUnlocks();
    closePayModal();
    showContactCard(c);
    try{renderEmpPool();}catch(e){}
  }
};
(function(){
  const _unlock=unlockContact;
  unlockContact=function(){
    const r=_unlock.apply(this,arguments);
    TPGratis.pintarModal();
    return r;
  };
  const _open=openDashEmp;
  openDashEmp=function(){const r=_open.apply(this,arguments);TPGratis.cargar();return r;};
  const _pub=publishJob;
  publishJob=async function(){const r=await _pub.apply(this,arguments);TPGratis.cargar();return r;};
})();

// ═══ Buscador ═══
var TP_BUSCA_MIN={aceptable:{txt:'Aceptable',nota:40},bueno:{txt:'Bueno',nota:60},muy_bueno:{txt:'Muy bueno',nota:80}};
var TP_BUSCA_SITUACION={activa:'Busca empleo activamente',abierta:'Abierto a propuestas'};
var TP_BUSCA_DISP=['inmediata','quince','mes','mas'];

var TPBusca={
  f:null,
  abiertas:{cond:false,evid:false,act:false},
  campos:new Set(),       // campos «+» abiertos aunque aún no tengan valor
  ia:null,                // { origen, aplicado:[…], avisos:[…] } de la última búsqueda con IA
  iaTexto:'',
  sugQ:'',
  verMas:0,
  vacio(){return {area:'',ciudad:'',remotos:true,mudarse:true,skills:[],valorables:[],bloque:'',sector:'',clave:'',
    situacion:[],jornada:[],modalidad:[],contrato:[],salMax:null,disponibilidad:'',
    soloVerificados:false,sinRiesgoAlto:false,minRetos:0,conSoft:false,
    interesa:false,postulado:false,aceptaContacto:false,ocultarDesbloqueados:false,orden:'encaje'};},
  init(){if(!TPBusca.f)TPBusca.f=TPBusca.vacio();}
};

/** Todas las skills del candidato (top + resto + soft), sin repetir. */
function tpBuscaSkills(c){
  const m=new Map();
  [...(c.todas||[]),...(c.skills||[]),...(c.personas||[])].forEach(s=>{
    if(!s||!s.n)return;const k=String(s.n).toLowerCase();
    if(!m.has(k)||m.get(k).v<s.v)m.set(k,s);
  });
  return [...m.values()];
}
function tpBuscaNota(c,n){const k=String(n).toLowerCase();const s=tpBuscaSkills(c).find(x=>String(x.n).toLowerCase()===k);return s?Number(s.v)||0:-1;}
function tpBuscaAreas(c){return [...new Set(tpBuscaSkills(c).map(s=>tpAreaDeSkill(s.n)).filter(Boolean))];}
function tpBuscaTieneBloque(c,b){return tpBuscaSkills(c).some(s=>(tpEsPersonaSkill(s.n)?'soft':'hard')===b);}

/** Reglas activas: cada una se puede quitar sola (para el contador y la pista). */
function tpBuscaReglas(){
  const f=TPBusca.f,R=[];
  const add=(grupo,id,txt,pasa,quitar)=>R.push({grupo,id,txt,pasa,quitar});
  const cd=c=>c.cond||{};
  if(f.area)add('area','area',tpAreaNombre(f.area,true),c=>tpBuscaAreas(c).includes(f.area),()=>{f.area='';});
  const ciudad=tpNorm(f.ciudad);
  if(ciudad)add('ciudad','ciudad','En '+f.ciudad.trim()+(f.remotos||f.mudarse?' (o '+[f.remotos?'remoto':'',f.mudarse?'acepta mudarse':''].filter(Boolean).join(' o ')+')':''),
    c=>tpNorm(cd(c).ciudad).includes(ciudad)||(f.remotos&&(cd(c).modalidades||[]).includes('remoto'))||(f.mudarse&&!!cd(c).reubicacion),()=>{f.ciudad='';});
  f.skills.forEach(s=>add('skills','skill:'+s.n,tpSkillNombre(s.n)+' · '+TP_BUSCA_MIN[s.min].txt+' o más',
    c=>tpBuscaNota(c,s.n)>=TP_BUSCA_MIN[s.min].nota,()=>{f.skills=f.skills.filter(x=>x.n!==s.n);}));
  if(f.bloque)add('bloque','bloque',f.bloque==='soft'?'Con soft skills':'Con hard skills',c=>tpBuscaTieneBloque(c,f.bloque),()=>{f.bloque='';});
  if(f.sector)add('sector','sector','Sector: '+f.sector,c=>c.sector===f.sector,()=>{f.sector='';});
  const palabras=tpNorm(f.clave).split(/\s+/).filter(w=>w.length>1);
  if(palabras.length)add('clave','clave','«'+f.clave.trim()+'»',c=>{
    const hay=tpNorm([c.sector,cd(c).ciudad,...tpBuscaSkills(c).map(s=>s.n+' '+tpSkillNombre(s.n))].join(' '));
    return palabras.every(w=>hay.includes(w));
  },()=>{f.clave='';});
  const multi=(k,mapa,campo,txt)=>{if(f[k].length)add(k,k,txt+': '+f[k].map(v=>mapa[v]||v).join(', '),c=>f[k].some(v=>(campo(c)||[]).includes(v)),()=>{f[k]=[];});};
  multi('situacion',TP_BUSCA_SITUACION,c=>[cd(c).busqueda],'Situación');
  multi('jornada',TP_COND.jornadas,c=>cd(c).jornadas,'Jornada');
  multi('modalidad',TP_COND.modalidades,c=>cd(c).modalidades,'Modalidad');
  multi('contrato',TP_COND.contratos,c=>cd(c).contratos,'Contrato');
  if(f.salMax)add('salMax','salMax','Pide hasta '+tpK(f.salMax),c=>!cd(c).salMin||cd(c).salMin<=f.salMax,()=>{f.salMax=null;});
  if(f.disponibilidad){const lim=TP_BUSCA_DISP.indexOf(f.disponibilidad);
    add('disponibilidad','disponibilidad','Incorporación: '+(TP_COND.disponibilidad[f.disponibilidad]||f.disponibilidad).toLowerCase()+' o antes',
      c=>{const i=TP_BUSCA_DISP.indexOf(cd(c).disponibilidad);return i>=0&&i<=lim;},()=>{f.disponibilidad='';});}
  const bool=(k,txt,pasa)=>{if(f[k])add(k,k,txt,pasa,()=>{f[k]=false;});};
  bool('soloVerificados','Solo notas verificadas',c=>!!c.verified);
  bool('sinRiesgoAlto','Sin riesgo alto de integridad',c=>c.integ!=='alto');
  if(f.minRetos>0)add('minRetos','minRetos',f.minRetos+' retos o más',c=>(c.retos||0)>=f.minRetos,()=>{f.minRetos=0;});
  bool('conSoft','Con soft skills demostradas',c=>tpBuscaTieneBloque(c,'soft'));
  bool('interesa','Interesados en tu empresa',c=>!!c.interesa||c.postulado>0);
  bool('postulado','Se han postulado a tus ofertas',c=>c.postulado>0);
  bool('aceptaContacto','Aceptan contacto',c=>c.acceptsContact!==false);
  bool('ocultarDesbloqueados','Ocultar los ya desbloqueados',c=>!c._unlocked);
  return R;
}
function tpBuscaFiltrar(reglas,sin){return CANDIDATES.filter(c=>reglas.every(r=>r.id===sin||r.grupo===sin||r.pasa(c)));}
/** Cuántos quedan con una opción de un grupo, ignorando lo que ya hay elegido en ese grupo. */
function tpBuscaContar(reglas,grupo,pasa){return tpBuscaFiltrar(reglas,grupo).filter(pasa).length;}

/** Encaje para ordenar: media de las skills pedidas (y valorables), o la nota media. */
function tpBuscaEncaje(c){
  const f=TPBusca.f,ns=[...f.skills.map(s=>s.n),...f.valorables];
  if(!ns.length)return c.score||0;
  return Math.round(ns.reduce((t,n)=>t+Math.max(0,tpBuscaNota(c,n)),0)/ns.length);
}
function tpBuscaOrdenar(lista){
  const o=TPBusca.f.orden,sit={activa:0,abierta:1};
  const s=lista.slice();
  if(o==='situacion')s.sort((a,b)=>((sit[(a.cond||{}).busqueda]??2)-(sit[(b.cond||{}).busqueda]??2))||tpBuscaEncaje(b)-tpBuscaEncaje(a));
  else if(o==='retos')s.sort((a,b)=>(b.retos||0)-(a.retos||0)||tpBuscaEncaje(b)-tpBuscaEncaje(a));
  else s.sort((a,b)=>tpBuscaEncaje(b)-tpBuscaEncaje(a));
  return s;
}

// ── Piezas de la interfaz ──
function tpBuscaSub(opciones,activo,accion,cuenta){
  return '<div class="tp-subfiltros">'+opciones.map(([v,t])=>{
    const n=cuenta?cuenta(v):null,on=activo(v);
    return '<button type="button" class="tp-subfiltro'+(on?' activo':'')+'" aria-pressed="'+on+'"'+(n===0&&!on?' disabled':'')+' onclick="'+accion(v)+'">'+escHtml(t)+(n!=null?' <span>'+n+'</span>':'')+'</button>';
  }).join('')+'</div>';
}
function tpBuscaCampo(id,titulo,cuerpo,activo){
  const abierto=activo||TPBusca.campos.has(id);
  if(!abierto)return '<button type="button" class="tp-rs-mas" onclick="TPBusca.campos.add(\''+id+'\');tpBuscaPintar()">+ '+escHtml(titulo)+'</button>';
  return '<div class="tp-rs-campo"><div class="tp-rs-campo-cab"><span>'+escHtml(titulo)+'</span><button type="button" class="pj-enlace" onclick="tpBuscaQuitarCampo(\''+id+'\')">Quitar</button></div>'+cuerpo+'</div>';
}
function tpBuscaQuitarCampo(id){
  const f=TPBusca.f;TPBusca.campos.delete(id);
  if(Array.isArray(f[id]))f[id]=[];else if(typeof f[id]==='boolean')f[id]=false;else if(id==='minRetos')f[id]=0;else f[id]=id==='salMax'?null:'';
  tpBuscaPintar();
}
function tpBuscaToggle(k,v){const a=TPBusca.f[k];const i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);tpBuscaPintar();}
function tpBuscaPoner(k,v){TPBusca.f[k]=v;tpBuscaPintar();}
function tpBuscaSec(id,titulo,n,cuerpo){
  return '<details class="tp-rs-sec"'+(TPBusca.abiertas[id]||n?' open':'')+' ontoggle="TPBusca.abiertas.'+id+'=this.open"><summary>'+escHtml(titulo)+(n?' <span class="tp-rs-n">'+n+'</span>':'')+'</summary><div class="tp-rs-sec-cuerpo">'+cuerpo+'</div></details>';
}
function tpBuscaCheck(k,txt,reglas,pasa){
  const n=tpBuscaContar(reglas,k,pasa);
  return '<label class="tp-rs-check"><input type="checkbox"'+(TPBusca.f[k]?' checked':'')+' onchange="tpBuscaPoner(\''+k+'\',this.checked)"> '+escHtml(txt)+' <span>'+n+'</span></label>';
}

/** Columna fija: los filtros que se usan siempre. */
function tpBuscaColumna(reglas){
  const f=TPBusca.f;
  const areas=TP_TAXONOMIA.areas.map(a=>{const n=tpBuscaContar(reglas,'area',c=>tpBuscaAreas(c).includes(a.id));return '<option value="'+a.id+'"'+(f.area===a.id?' selected':'')+'>'+escHtml(a.corto)+' ('+n+')</option>';}).join('');
  const sectores=[...new Set(CANDIDATES.map(c=>c.sector).filter(s=>s&&s!=='Sin sector'))].sort();
  const skills=f.skills.map((s,i)=>'<div class="tp-rs-skill"><span>'+escHtml(tpSkillNombre(s.n))+'</span><label class="sr-only" for="tpRsMin'+i+'">Banda mínima en '+escHtml(tpSkillNombre(s.n))+'</label><select id="tpRsMin'+i+'" onchange="TPBusca.f.skills['+i+'].min=this.value;tpBuscaPintar()">'+
    Object.entries(TP_BUSCA_MIN).map(([k,m])=>'<option value="'+k+'"'+(s.min===k?' selected':'')+'>'+m.txt+' o más</option>').join('')+'</select><button type="button" class="pj-enlace" aria-label="Quitar '+escHtml(tpSkillNombre(s.n))+'" onclick="TPBusca.f.skills.splice('+i+',1);tpBuscaPintar()">Quitar</button></div>').join('');
  return '<button type="button" class="btn btn-outline btn-sm tp-rs-col-btn" aria-controls="tpRsCol" aria-expanded="'+(TPBusca.colMovil?'true':'false')+'" onclick="tpBuscaColMovil()">'+(TPBusca.colMovil?'Ocultar filtros principales':'Mostrar filtros principales')+'</button>'+
    '<aside class="tp-rs-col'+(TPBusca.colMovil?' abierta':'')+'" id="tpRsCol" aria-label="Filtros principales">'+
    '<div class="tp-rs-grupo"><label for="tpRsArea">Puesto o área</label><select id="tpRsArea" onchange="tpBuscaPoner(\'area\',this.value)"><option value="">Todas las áreas</option>'+areas+'</select></div>'+
    '<div class="tp-rs-grupo"><label for="tpRsCiudad">Ubicación</label><input type="text" id="tpRsCiudad" maxlength="80" placeholder="Ciudad o provincia" value="'+escHtml(f.ciudad)+'" oninput="TPBusca.f.ciudad=this.value;tpBuscaRefrescar()">'+
      '<label class="tp-rs-check"><input type="checkbox"'+(f.remotos?' checked':'')+' onchange="tpBuscaPoner(\'remotos\',this.checked)"> Incluir quien trabaja en remoto</label>'+
      '<label class="tp-rs-check"><input type="checkbox"'+(f.mudarse?' checked':'')+' onchange="tpBuscaPoner(\'mudarse\',this.checked)"> Incluir quien acepta mudarse</label></div>'+
    '<div class="tp-rs-grupo"><label for="tpRsSkill">Skills demostradas</label>'+skills+
      '<input type="text" id="tpRsSkill" autocomplete="off" placeholder="Añadir skill: negociación, SQL…" value="'+escHtml(TPBusca.sugQ)+'" oninput="TPBusca.sugQ=this.value;tpBuscaSugerir()"><div id="tpRsSugs" class="tp-rs-sugs"></div></div>'+
    '<div class="tp-rs-grupo"><span class="tp-rs-et">Tipo de skill</span>'+tpBuscaSub([['hard','Hard skills'],['soft','Soft skills']],v=>f.bloque===v,v=>"tpBuscaPoner('bloque',TPBusca.f.bloque==='"+v+"'?'':'"+v+"')",v=>tpBuscaContar(reglas,'bloque',c=>tpBuscaTieneBloque(c,v)))+'</div>'+
    '<div class="tp-rs-grupo"><span class="tp-rs-et">Situación de búsqueda</span>'+tpBuscaSub(Object.entries(TP_BUSCA_SITUACION),v=>f.situacion.includes(v),v=>"tpBuscaToggle('situacion','"+v+"')",v=>tpBuscaContar(reglas,'situacion',c=>(c.cond||{}).busqueda===v))+'</div>'+
    (sectores.length>1?'<div class="tp-rs-grupo"><label for="tpRsSector">Sector del candidato</label><select id="tpRsSector" onchange="tpBuscaPoner(\'sector\',this.value)"><option value="">Todos</option>'+
      sectores.map(s=>'<option value="'+escHtml(s)+'"'+(f.sector===s?' selected':'')+'>'+escHtml(s)+' ('+tpBuscaContar(reglas,'sector',c=>c.sector===s)+')</option>').join('')+'</select></div>':'')+
    '<div class="tp-rs-grupo"><label for="tpRsClave">Palabras clave</label><input type="text" id="tpRsClave" maxlength="120" placeholder="En skills, sector o ciudad" value="'+escHtml(f.clave)+'" oninput="TPBusca.f.clave=this.value;tpBuscaRefrescar()"></div>'+
  '</aside>';
}

function tpBuscaColMovil(){
  TPBusca.colMovil=!TPBusca.colMovil;
  const col=document.getElementById('tpRsCol'),btn=document.querySelector('.tp-rs-col-btn');
  if(col)col.classList.toggle('abierta',TPBusca.colMovil);
  if(btn){btn.setAttribute('aria-expanded',TPBusca.colMovil?'true':'false');btn.textContent=TPBusca.colMovil?'Ocultar filtros principales':'Mostrar filtros principales';}
}

/** Sugerencias de skills con su recuento real en el pool. */
function tpBuscaSugerir(){
  const box=document.getElementById('tpRsSugs');if(!box)return;
  const q=TPBusca.sugQ.trim();
  if(q.length<2){box.innerHTML='';return;}
  const cuenta=new Map();
  CANDIDATES.forEach(c=>tpBuscaSkills(c).forEach(s=>cuenta.set(s.n,(cuenta.get(s.n)||0)+1)));
  (typeof COMMON_EXERCISES!=='undefined'?COMMON_EXERCISES:[]).forEach(ce=>{if(ce&&ce.skill&&!cuenta.has(ce.skill))cuenta.set(ce.skill,0);});
  const ya=new Set(TPBusca.f.skills.map(s=>s.n));
  TPBusca._sugs=[...cuenta.entries()].filter(([n])=>!ya.has(n)&&tpSkillCoincide(n,q)).sort((a,b)=>b[1]-a[1]).slice(0,8);
  box.innerHTML=TPBusca._sugs.length?TPBusca._sugs.map(([n,k],i)=>'<button type="button" class="tp-rs-sug" onclick="tpBuscaAddSkill('+i+')">'+escHtml(tpSkillNombre(n))+' <span>'+k+'</span></button>').join('')
    :'<p class="tp-rs-nada">Ninguna skill del catálogo coincide.</p>';
}
function tpBuscaAddSkill(i){
  const s=(TPBusca._sugs||[])[i];if(!s)return;
  TPBusca.f.skills.push({n:s[0],min:'aceptable'});TPBusca.sugQ='';tpBuscaPintar();
  const el=document.getElementById('tpRsSkill');if(el)el.focus();
}

/** Secciones plegables con «+ campo», como en Recruiter. */
function tpBuscaSecciones(reglas){
  const f=TPBusca.f,cd=c=>c.cond||{};
  const multi=(k,mapa,campo)=>tpBuscaSub(Object.entries(mapa),v=>f[k].includes(v),v=>"tpBuscaToggle('"+k+"','"+v+"')",v=>tpBuscaContar(reglas,k,c=>(campo(c)||[]).includes(v)));
  const nSec=ids=>reglas.filter(r=>ids.includes(r.grupo)).length;
  const cond=tpBuscaCampo('jornada','Jornada',multi('jornada',TP_COND.jornadas,c=>cd(c).jornadas),f.jornada.length)+
    tpBuscaCampo('modalidad','Modalidad',multi('modalidad',TP_COND.modalidades,c=>cd(c).modalidades),f.modalidad.length)+
    tpBuscaCampo('contrato','Tipo de contrato',multi('contrato',TP_COND.contratos,c=>cd(c).contratos),f.contrato.length)+
    tpBuscaCampo('salMax','Salario que ofreces',
      '<label class="sr-only" for="tpRsSal">Salario máximo que ofreces (€ brutos/año)</label><input type="number" id="tpRsSal" min="0" step="1000" inputmode="numeric" placeholder="Hasta, en € brutos/año" value="'+(f.salMax||'')+'" onchange="tpBuscaPoner(\'salMax\',Number(this.value)>0?Math.round(Number(this.value)):null)"><p class="tp-rs-nota">Incluye a quien no ha indicado salario.</p>',!!f.salMax)+
    tpBuscaCampo('disponibilidad','Incorporación',
      '<label class="sr-only" for="tpRsDisp">Incorporación como muy tarde</label><select id="tpRsDisp" onchange="tpBuscaPoner(\'disponibilidad\',this.value)"><option value="">Sin límite</option>'+
      TP_BUSCA_DISP.map(k=>'<option value="'+k+'"'+(f.disponibilidad===k?' selected':'')+'>'+escHtml(TP_COND.disponibilidad[k])+' o antes ('+tpBuscaContar(reglas,'disponibilidad',c=>{const i=TP_BUSCA_DISP.indexOf(cd(c).disponibilidad);return i>=0&&i<=TP_BUSCA_DISP.indexOf(k);})+')</option>').join('')+'</select>',!!f.disponibilidad);
  const evid=tpBuscaCheck('soloVerificados','Solo notas verificadas por el servidor',reglas,c=>!!c.verified)+
    tpBuscaCheck('sinRiesgoAlto','Sin riesgo alto de integridad',reglas,c=>c.integ!=='alto')+
    tpBuscaCheck('conSoft','Con soft skills demostradas',reglas,c=>tpBuscaTieneBloque(c,'soft'))+
    tpBuscaCampo('minRetos','Mínimo de retos hechos','<label class="sr-only" for="tpRsRetos">Mínimo de retos hechos</label><select id="tpRsRetos" onchange="tpBuscaPoner(\'minRetos\',Number(this.value))">'+
      [0,2,3,5,8].map(n=>'<option value="'+n+'"'+(f.minRetos===n?' selected':'')+'>'+(n?n+' o más ('+tpBuscaContar(reglas,'minRetos',c=>(c.retos||0)>=n)+')':'Sin mínimo')+'</option>').join('')+'</select>',f.minRetos>0);
  const act=tpBuscaCheck('interesa','Interesados en tu empresa',reglas,c=>!!c.interesa||c.postulado>0)+
    tpBuscaCheck('postulado','Se han postulado a tus ofertas',reglas,c=>c.postulado>0)+
    tpBuscaCheck('aceptaContacto','Aceptan solicitudes de contacto',reglas,c=>c.acceptsContact!==false)+
    tpBuscaCheck('ocultarDesbloqueados','Ocultar los que ya has desbloqueado',reglas,c=>!c._unlocked);
  return tpBuscaSec('cond','Condiciones del puesto',nSec(['jornada','modalidad','contrato','salMax','disponibilidad']),cond)+
    tpBuscaSec('evid','Evidencia',nSec(['soloVerificados','sinRiesgoAlto','conSoft','minRetos']),evid)+
    tpBuscaSec('act','Interés y actividad',nSec(['interesa','postulado','aceptaContacto','ocultarDesbloqueados']),act);
}

/** Caja de IA: descripción libre, documento o los requisitos de una oferta propia. */
function tpBuscaCajaIA(){
  const mias=(window.TPOfertas&&TPOfertas.mias||[]).filter(j=>j&&j.status!=='closed');
  const ia=TPBusca.ia;
  let estado='';
  if(ia&&ia.cargando)estado='<div class="tp-rs-ia-estado">'+escHtml(ia.cargando)+'</div>';
  else if(ia&&ia.error)estado='<div class="tp-rs-ia-estado err">'+escHtml(ia.error)+'</div>';
  else if(ia&&ia.aplicado){
    estado='<div class="tp-rs-ia-estado ok"><strong>'+escHtml(ia.origen)+'</strong> '+(ia.aplicado.length?'Filtros aplicados: '+escHtml(ia.aplicado.join(' · '))+'.':'No se ha podido sacar ningún filtro: prueba a describir skills, ubicación o condiciones.')+
      (ia.avisos&&ia.avisos.length?'<ul>'+ia.avisos.slice(0,4).map(a=>'<li>'+escHtml(a)+'</li>').join('')+'</ul>':'')+
      ' <button type="button" class="pj-enlace" onclick="tpBuscaLimpiar()">Deshacer</button></div>';
  }
  return '<section class="tp-rs-ia" aria-labelledby="tpRsIaTit"><div class="tp-rs-ia-cab"><h4 id="tpRsIaTit">Buscar con IA</h4><span>Describe el perfil o importa la descripción del puesto. Lo convertimos en filtros que puedes revisar y cambiar.</span></div>'+
    '<label class="sr-only" for="tpRsIaTexto">Describe el perfil que buscas</label><textarea id="tpRsIaTexto" rows="3" maxlength="4000" placeholder="Ej.: técnico/a de selección en Madrid o en remoto, que sepa entrevistar y negociar. Jornada completa, hasta 30.000 €." oninput="TPBusca.iaTexto=this.value">'+escHtml(TPBusca.iaTexto)+'</textarea>'+
    '<div class="tp-rs-ia-acc"><button type="button" class="btn btn-primary btn-sm" onclick="tpBuscaIATexto()"'+(ia&&ia.cargando?' disabled':'')+'>Buscar con IA</button>'+
      '<label class="btn btn-outline btn-sm">Importar documento<input type="file" class="sr-only" accept=".pdf,.docx,.txt,.md" aria-label="Importar documento con el perfil o la oferta (PDF, Word o texto)" onchange="tpBuscaIAArchivo(this)"></label>'+
      (mias.length?'<label class="sr-only" for="tpRsOferta">Buscar con los requisitos de una de tus ofertas</label><select id="tpRsOferta" onchange="tpBuscaDesdeOferta(this.value)"><option value="">Usar una de mis ofertas…</option>'+mias.map(j=>'<option value="'+escHtml(j.id)+'">'+escHtml(j.title)+'</option>').join('')+'</select>':'')+
    '</div>'+estado+'</section>';
}

function tpBuscaActivos(reglas){
  if(!reglas.length)return '';
  return '<div class="tp-rs-activos" aria-label="Filtros aplicados">'+reglas.map((r,i)=>'<button type="button" class="tp-rs-activo" onclick="tpBuscaQuitarRegla('+i+')" aria-label="Quitar filtro '+escHtml(r.txt)+'">'+escHtml(r.txt)+' <span aria-hidden="true">×</span></button>').join('')+
    '<button type="button" class="pj-enlace" onclick="tpBuscaLimpiar()">Limpiar todo</button></div>';
}
function tpBuscaQuitarRegla(i){const r=tpBuscaReglas()[i];if(r){r.quitar();TPBusca.campos.delete(r.grupo);}tpBuscaPintar();}
function tpBuscaLimpiar(){const o=TPBusca.f.orden;TPBusca.f=TPBusca.vacio();TPBusca.f.orden=o;TPBusca.campos.clear();TPBusca.ia=null;tpBuscaPintar();}

/** Señales de cada candidato: situación de búsqueda e interés por tu empresa. */
function tpBuscaSenales(c){
  const out=[],b=(c.cond||{}).busqueda;
  if(b==='activa')out.push(tpChip('Busca empleo activamente','ok'));
  else if(b==='abierta')out.push(tpChip('Abierto a propuestas','info'));
  if(c.interesa)out.push(tpChip('Le interesa tu empresa','info'));
  if(c.postulado)out.push(tpChip(c.etapa&&c.etapa!=='aplicado'?'En tu proceso: '+(TP_APP_ESTADOS[c.etapa]||c.etapa):'Se ha postulado a '+(c.postulado===1?'tu oferta':c.postulado+' de tus ofertas'),c.etapa==='descartado'?'error':'aviso'));
  if(c._unlocked)out.push(tpChip('Contacto desbloqueado','ok'));
  return out.join('');
}
function tpBuscaFila(c){
  const f=TPBusca.f,cd=c.cond||{};
  const pedidas=[...f.skills.map(s=>s.n),...f.valorables];
  const rel=pedidas.length?pedidas.map(n=>({n,v:tpBuscaNota(c,n)})).filter(s=>s.v>=0):tpBuscaSkills(c);
  const areas=tpBuscaAreas(c).slice(0,2).map(a=>tpAreaNombre(a,true));
  const donde=[cd.ciudad,...(cd.modalidades||[]).map(m=>TP_COND.modalidades[m])].filter(Boolean).join(' · ');
  const contacto=c.acceptsContact===false?'<span class="tp-rs-nota">No acepta contacto ahora</span>'
    :'<button type="button" class="btn btn-outline btn-sm" onclick="'+(c._unlocked?'showContactCard(CANDIDATES.find(x=>String(x.id)===\''+escHtml(c.id)+'\'))':'unlockContact(\''+escHtml(c.id)+'\')')+'">'+(c._unlocked?'Ver contacto':'Desbloquear contacto')+'</button>';
  return '<article class="tp-rs-fila"><div class="tp-rs-quien"><div class="dash-avatar u-bg-emerald-100 u-c-emerald-600">'+escHtml(c.i)+'</div><div><strong>'+escHtml(String(c.alias||'').replace(/^Candidato /,'Candidato '))+'</strong>'+
      '<div class="tp-rs-sub">'+escHtml([areas.join(', ')||c.sector,donde].filter(Boolean).join(' · '))+'</div></div>'+
      (pedidas.length?'<span class="tp-rs-encaje" title="Media de las skills que buscas">Encaje '+tpBuscaEncaje(c)+'</span>':'')+'</div>'+
    '<div class="tp-rs-senales">'+tpBuscaSenales(c)+'</div>'+
    '<div class="tp-rs-skills">'+tpChipsBanda(rel,4)+'</div>'+
    '<div class="tp-rs-cond">'+tpPoolCondChips(cd)+'</div>'+
    '<div class="tp-rs-pie"><div class="tp-rs-integ">'+tpIntegridadDetalle(c)+'</div><div class="tp-rs-acc"><button type="button" class="btn btn-primary btn-sm" onclick="viewProfile(\''+escHtml(c.id)+'\')">Ver perfil</button>'+contacto+'</div></div></article>';
}

/** Contador, pista si sale 0 y lista. Se llama al escribir, sin repintar los filtros. */
function tpBuscaRefrescar(){
  const box=document.getElementById('tpRsResultados');if(!box)return;
  const reglas=tpBuscaReglas(),lista=tpBuscaOrdenar(tpBuscaFiltrar(reglas));
  const tot=document.getElementById('tpRsTotal');
  if(tot)tot.innerHTML='<strong>'+lista.length+'</strong> '+(lista.length===1?'candidato encaja':'candidatos encajan')+' <span>de '+CANDIDATES.length+' en el pool</span>';
  const act=document.getElementById('tpRsActivosBox');if(act)act.innerHTML=tpBuscaActivos(reglas);
  const aviso=window.TPPool&&TPPool.estado!=='ok'&&TPPool.aviso()?'<div class="tp-pool-aviso">'+escHtml(TPPool.aviso())+(TPPool.estado==='error'?' <button type="button" class="btn btn-outline btn-sm" onclick="tpReintentarPool()">Reintentar</button>':'')+'</div>':'';
  if(!CANDIDATES.length){box.innerHTML=aviso+(TPPool.estado==='cargando'?tpEsqueleto(4):'<div class="tp-empty">Todavía no hay candidatos visibles en el pool.</div>');return;}
  if(!lista.length){
    // Pista real: qué filtro, quitado solo, devuelve más candidatos.
    let mejor=null;
    reglas.forEach((r,i)=>{const n=tpBuscaFiltrar(reglas,r.id).length;if(n&&(!mejor||n>mejor.n))mejor={n,i,txt:r.txt};});
    box.innerHTML=aviso+'<div class="tp-empty">Ningún candidato cumple todos los filtros.'+(mejor?' <button type="button" class="pj-enlace" onclick="tpBuscaQuitarRegla('+mejor.i+')">Si quitas «'+escHtml(mejor.txt)+'», aparecen '+mejor.n+'.</button>':'')+'</div>';
    return;
  }
  const max=30+TPBusca.verMas;
  box.innerHTML=aviso+lista.slice(0,max).map(tpBuscaFila).join('')+
    (lista.length>max?'<button type="button" class="btn btn-outline btn-sm tp-rs-vermas" onclick="TPBusca.verMas+=30;tpBuscaRefrescar()">Ver '+Math.min(30,lista.length-max)+' más</button>':'');
}

function tpBuscaPintar(){
  TPBusca.init();
  const box=document.getElementById('empPool');if(!box)return;
  const reglas=tpBuscaReglas();
  TPBusca.verMas=0;
  box.innerHTML='<div class="tp-rs">'+
    '<p class="tp-rs-gratis" id="tpRsGratis" hidden></p>'+
    '<div class="tp-rs-cab"><div class="tp-rs-total" id="tpRsTotal" role="status" aria-live="polite"></div>'+
      '<label class="tp-rs-orden">Ordenar por <select onchange="tpBuscaPoner(\'orden\',this.value)">'+[['encaje','Mejor encaje'],['situacion','Buscan empleo primero'],['retos','Más retos hechos']].map(([v,t])=>'<option value="'+v+'"'+(TPBusca.f.orden===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div>'+
    '<div id="tpRsActivosBox"></div>'+
    '<div class="tp-rs-grid">'+tpBuscaColumna(reglas)+
      '<div class="tp-rs-main">'+tpBuscaCajaIA()+tpBuscaSecciones(reglas)+'<div id="tpRsResultados" class="tp-rs-lista"></div></div>'+
    '</div></div>';
  TPGratis.pintar();
  tpBuscaSugerir();
  tpBuscaRefrescar();
}
renderEmpPool=tpBuscaPintar;

// ═══ Búsqueda con IA ═══
/** Propuesta (de la IA, de una oferta o del lector local) → filtros. */
function tpBuscaAplicar(p,origen){
  const o=TPBusca.f?TPBusca.f.orden:'encaje';
  const f=TPBusca.vacio();f.orden=o;
  if(p.area&&tpArea(p.area))f.area=p.area;
  const reqs=(p.skillRequirements||[]).filter(r=>r&&r.skill);
  const imp=reqs.filter(r=>r.peso==='imprescindible');
  f.skills=(imp.length?imp:reqs.slice(0,3)).map(r=>({n:r.skill,min:TP_BUSCA_MIN[r.minimo]?r.minimo:'aceptable'}));
  f.valorables=reqs.map(r=>r.skill).filter(n=>!f.skills.some(s=>s.n===n));
  if(p.jornada&&TP_COND.jornadas[p.jornada])f.jornada=[p.jornada];
  if(p.modalidad&&TP_COND.modalidades[p.modalidad])f.modalidad=[p.modalidad];
  if(p.contrato&&TP_COND.contratos[p.contrato])f.contrato=[p.contrato];
  if(p.ubicacion&&p.modalidad!=='remoto')f.ciudad=String(p.ubicacion).slice(0,80);
  const sal=Number(p.salMax||p.salMin);if(sal>0)f.salMax=Math.round(sal);
  if(p.disponibilidad&&TP_COND.disponibilidad[p.disponibilidad])f.disponibilidad=p.disponibilidad;
  if(Array.isArray(p.situacion))f.situacion=p.situacion.filter(v=>TP_BUSCA_SITUACION[v]);
  if(p.soloVerificados)f.soloVerificados=true;
  TPBusca.f=f;TPBusca.campos.clear();
  const aplicado=tpBuscaReglas().map(r=>r.txt).concat(f.valorables.length?['valorables para ordenar: '+f.valorables.map(tpSkillNombre).join(', ')]:[]);
  TPBusca.ia={origen,aplicado,avisos:(p.avisos||[]).filter(a=>typeof a==='string')};
  tpBuscaPintar();
}

/** Lector local: lo que se lee directamente en el texto, sin IA. Respaldo si la IA no está. */
function tpBuscaLeerTexto(texto){
  const t=' '+tpNorm(texto).replace(/[^a-z0-9€ ]+/g,' ')+' ';
  const tiene=re=>re.test(t);
  const p={skillRequirements:[],avisos:[]};
  const nombres=new Set();
  CANDIDATES.forEach(c=>tpBuscaSkills(c).forEach(s=>nombres.add(s.n)));
  (typeof COMMON_EXERCISES!=='undefined'?COMMON_EXERCISES:[]).forEach(ce=>ce&&ce.skill&&nombres.add(ce.skill));
  nombres.forEach(n=>{
    const cands=[n,tpSkillNombre(n)].map(x=>tpNorm(x).replace(/[^a-z0-9 ]+/g,' ').trim()).filter(x=>x.length>=3);
    if(cands.some(x=>t.includes(' '+x+' ')||(x.length>=6&&t.includes(' '+x.slice(0,-1)))))p.skillRequirements.push({skill:n,peso:'imprescindible',minimo:tiene(/experto|avanzad|senior|muy buen/)?'bueno':'aceptable'});
  });
  p.skillRequirements=p.skillRequirements.slice(0,6);
  const AREAS={juridica:/juridic|legal|abogad|cumplimiento|compliance/,direccion:/direccion|estrategia|consultor/,finanzas:/finanz|contab|financier|auditor/,
    marketing:/marketing|ventas|comercial|comunicacion/,operaciones:/operacion|logistic|cadena de suministro|compras/,rrhh:/rrhh|recursos humanos|seleccion|talento/,
    sanidad_educacion:/sanidad|sanitari|educacion|docente|investigacion/,sostenibilidad:/sostenib|medio ambiente|esg/,tecnologia:/tecnolog|desarroll|programad|software|datos|informatic/};
  // El área que sale antes en el texto: suele ser la del puesto («técnico de selección… y contabilidad»).
  let area=null,pos=Infinity;
  Object.keys(AREAS).forEach(k=>{const m=t.match(AREAS[k]);if(m&&m.index<pos){pos=m.index;area=k;}});
  if(area)p.area=area;
  if(tiene(/remot|teletrabaj/))p.modalidad='remoto';else if(tiene(/hibrid/))p.modalidad='hibrido';else if(tiene(/presencial/))p.modalidad='presencial';
  if(tiene(/media jornada|parcial/))p.jornada='parcial';else if(tiene(/jornada completa|tiempo completo/))p.jornada='completa';else if(tiene(/por horas|flexible/))p.jornada='horas';
  if(tiene(/practicas|becari/)){p.jornada=p.jornada||'practicas';p.contrato='practicas';}
  else if(tiene(/indefinid/))p.contrato='indefinido';else if(tiene(/temporal/))p.contrato='temporal';else if(tiene(/freelance|autonom/))p.contrato='freelance';
  const ciudades=new Set(CANDIDATES.map(c=>(c.cond||{}).ciudad).filter(Boolean));
  ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Málaga','Zaragoza','Alicante','Murcia','Valladolid','Vigo','A Coruña','Palma','Las Palmas','Granada','San Sebastián','Pamplona','Santander','Oviedo','Córdoba'].forEach(x=>ciudades.add(x));
  const ciudad=[...ciudades].find(x=>t.includes(' '+tpNorm(x)+' '));if(ciudad)p.ubicacion=ciudad;
  const sal=t.match(/(\d{2,3})\s?(k|mil)\b|(\d{2,3})[ .]?000\s?(€|eur)/);
  if(sal)p.salMax=Number(sal[1]||sal[3])*1000;
  if(tiene(/inmediat|cuanto antes/))p.disponibilidad='inmediata';else if(tiene(/15 dias|quince dias/))p.disponibilidad='quince';else if(tiene(/un mes|1 mes/))p.disponibilidad='mes';
  if(tiene(/busca activamente|buscando empleo|open to work/))p.situacion=['activa'];
  if(tiene(/verificad/))p.soloVerificados=true;
  return p;
}

async function tpBuscaIA(cuerpo,textoLocal){
  TPBusca.ia={cargando:cuerpo.base64?'Leyendo el documento…':'Interpretando la descripción…'};tpBuscaPintar();
  let r;
  try{r=await TPCloud._postAuth('parse-job-doc',Object.assign({modo:'busqueda'},cuerpo));}catch(e){r={error:'Error de red: '+(e.message||e)};}
  if(r&&r.propuesta){tpBuscaAplicar(r.propuesta,'Búsqueda con IA.');return;}
  // Sin IA (no configurada, límite o caída): con texto, se aplica lo que se lee directamente.
  if(textoLocal){
    const p=tpBuscaLeerTexto(textoLocal);
    p.avisos=['La IA no está disponible ahora'+(r&&r.error?' ('+r.error+')':'')+'. Hemos aplicado los filtros que se leen directamente en el texto: revísalos.'];
    tpBuscaAplicar(p,'Lectura directa del texto.');return;
  }
  TPBusca.ia={error:(r&&r.error)||'No se ha podido leer el documento. Prueba a pegar el texto en la descripción.'};tpBuscaPintar();
}
function tpBuscaIATexto(){
  const t=(TPBusca.iaTexto||'').trim();
  if(t.length<15){toast('Describe un poco más el perfil: skills, ubicación o condiciones.');return;}
  tpBuscaIA({texto:t},t);
}
function tpBuscaIAArchivo(input){
  const f=input.files&&input.files[0];input.value='';
  if(!f)return;
  if(f.size>3*1024*1024){TPBusca.ia={error:'El archivo pasa de 3 MB. Sube solo la descripción del puesto o del perfil.'};tpBuscaPintar();return;}
  const lector=new FileReader();
  lector.onload=()=>{
    const res=String(lector.result||'');
    const b64=res.split(',')[1]||'';
    // Si es texto plano, también sirve para el lector local de respaldo.
    let plano='';if(/\.(txt|md)$/i.test(f.name)){try{plano=decodeURIComponent(escape(atob(b64)));}catch(e){plano='';}}
    tpBuscaIA({nombre:f.name,base64:b64},plano);
  };
  lector.onerror=()=>{TPBusca.ia={error:'No se ha podido abrir el archivo.'};tpBuscaPintar();};
  lector.readAsDataURL(f);
}
function tpBuscaDesdeOferta(id){
  if(!id)return;
  const j=(window.TPOfertas&&TPOfertas.mias||[]).find(x=>String(x.id)===String(id));
  if(!j)return;
  const p=Object.assign({},j);
  if(!(p.skillRequirements||[]).length)p.skillRequirements=(j.requiredSkills||[]).map(s=>({skill:s,peso:'imprescindible',minimo:'aceptable'}));
  tpBuscaAplicar(p,'Requisitos de «'+j.title+'».');
}
