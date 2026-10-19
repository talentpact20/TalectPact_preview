// TalentPact · 20-requisitos
// Oferta en tres pasos, requisitos de skill (imprescindible o valorable, con
// banda mínima) y relleno automático desde el documento de la empresa.
// Script clásico: ámbito global compartido (ver assets/js/README.md).
// Espejo de netlify/functions/lib/requisitos.js: tests/requisitos.test.js
// comprueba que tpReqDeOferta y tpReqEncaje calculan lo mismo que el servidor.

var TP_REQ_MINIMOS={aceptable:{txt:'Aceptable',nota:40},bueno:{txt:'Bueno',nota:60},muy_bueno:{txt:'Muy bueno',nota:80}};
var TP_REQ_MAX=8,TP_REQ_MAX_IMP=4;
// Sugerencias por área (solo skills con reto en el catálogo). Como LinkedIn:
// se proponen unas pocas y se añaden con un clic; el resto se busca.
var TP_REQ_SUGERIDAS={
  Marketing:['Marketing Digital','SEO & Contenido','Social Media','Copywriting','Comunicación Escrita','Creatividad'],
  Sales:['Ventas B2B','Ventas y Comercial','CRM','Negociación','Atención al Cliente','Comunicación Escrita'],
  IT:['Desarrollo y Tecnología','JavaScript','Git & GitHub','Testing & QA','Resolución de Problemas','Trabajo en Equipo'],
  Data:['Data & Analytics','SQL & Bases de Datos','Python Data','Power BI','Pensamiento Analítico','Comunicación Escrita'],
  Design:['UX/UI Design','Figma','UX Research','Product Design','Creatividad','Comunicación Escrita'],
  Business:['Pensamiento Estratégico','Pensamiento Analítico','Project Management','Toma de Decisiones','Negociación','Comunicación Escrita'],
  Finance:['Finanzas y Contabilidad','Contabilidad','Tesorería','Excel Avanzado','Pensamiento Analítico','Comunicación Escrita'],
  Legal:['Contratos','RGPD','Derecho Laboral','Comunicación Escrita','Toma de Decisiones','Pensamiento Analítico'],
  RRHH:['Recruiting','People Analytics','Formación','Comunicación Escrita','Trabajo en Equipo','Gestión del Tiempo'],
  Ops:['Logística','Supply Chain','Project Management','Gestión del Tiempo','Resolución de Problemas','Trabajo en Equipo'],
  Languages:['Business English','English B1','Inglés (Speaking)','Comunicación Escrita','Atención al Cliente','Trabajo en Equipo']
};

// ── Lógica pura (mismo cálculo que el servidor) ────────────────────────────
/** Requisitos de una oferta; las antiguas (lista + nivel único) cuentan todas como imprescindibles. */
function tpReqDeOferta(job){
  const MIN={aceptable:1,bueno:1,muy_bueno:1},NIVEL={basico:'aceptable',intermedio:'bueno',avanzado:'muy_bueno'};
  const propios=[],vistos=new Set();
  ((job&&job.skillRequirements)||[]).forEach(r=>{
    if(!r||typeof r.skill!=='string')return;
    const skill=r.skill.trim().slice(0,60),k=skill.toLowerCase();
    if(!skill||vistos.has(k))return;vistos.add(k);
    propios.push({skill,peso:r.peso==='imprescindible'?'imprescindible':'valorable',minimo:MIN[r.minimo]?r.minimo:'aceptable'});
  });
  if(propios.length)return propios.slice(0,8);
  const minimo=NIVEL[job&&job.requiredLevel]||'aceptable';
  return((job&&job.requiredSkills)||[]).filter(s=>typeof s==='string'&&s.trim()).slice(0,8).map(skill=>({skill,peso:'imprescindible',minimo}));
}

/** Estado de cada requisito (cumple · por_debajo · pendiente), recuentos y grupo de orden 1–4. */
function tpReqEncaje(requisitos,notas,condicionesOk){
  const UMBRAL={aceptable:40,bueno:60,muy_bueno:80};
  const porClave={};Object.keys(notas||{}).forEach(k=>{porClave[String(k).trim().toLowerCase()]=notas[k];});
  const estados=requisitos.map(r=>{
    const nota=porClave[String(r.skill).trim().toLowerCase()];
    const valida=typeof nota==='number'&&isFinite(nota);
    return{skill:r.skill,peso:r.peso,minimo:r.minimo,nota:valida?nota:null,estado:!valida?'pendiente':nota>=UMBRAL[r.minimo]?'cumple':'por_debajo'};
  });
  const imp=estados.filter(e=>e.peso==='imprescindible'),val=estados.filter(e=>e.peso==='valorable');
  const cuenta=l=>({cumple:l.filter(e=>e.estado==='cumple').length,total:l.length});
  let grupo;
  if(imp.some(e=>e.estado==='por_debajo'))grupo=4;
  else if(imp.some(e=>e.estado==='pendiente'))grupo=3;
  else grupo=condicionesOk===false?2:1;
  if(!imp.length&&!val.some(e=>e.estado==='cumple'))grupo=3;
  return{estados,imprescindibles:cuenta(imp),valorables:cuenta(val),grupo};
}

// ── Encaje con el pool (sustituye al de 10-paneles y 19-rrhh) ──────────────
encajeOferta=function(job,c){
  const reqs=tpReqDeOferta(job);
  const notas={};(c.skills||[]).forEach(s=>{const v=Number(s.v);if(isFinite(v))notas[s.n]=v;});
  const cd=c.cond||{};
  const ok=(lista,v)=>!v||!(lista&&lista.length)?null:lista.includes(v);
  const jor=ok(cd.jornadas,job.jornada),mod=ok(cd.modalidades,job.modalidad);
  const cond=[jor,mod].filter(x=>x!==null);
  const pctCond=cond.length?cond.filter(Boolean).length/cond.length:1;
  const req=tpReqEncaje(reqs,notas,cond.length?cond.every(Boolean):null);
  const fr=o=>o.total?o.cumple/o.total:1;
  // Sin ninguna skill cumplida no hay encaje: las condiciones solas no bastan.
  const cumpleAlguna=req.estados.some(e=>e.estado==='cumple');
  const pct=cumpleAlguna?Math.round((fr(req.imprescindibles)*0.6+fr(req.valorables)*0.1+pctCond*0.3)*100):0;
  return{pct,skills:fr(req.imprescindibles),jor,mod,req,grupo:req.grupo,demostradas:req.estados.some(e=>e.estado!=='pendiente')};
};

/** Resumen para la empresa: «3 de 3 imprescindibles · 1 de 2 valorables» y una marca por skill. */
function tpReqResumen(req){
  const i=req.imprescindibles,v=req.valorables;
  const tipoImp=!i.total?'':i.cumple===i.total?'ok':req.grupo===4?'error':'aviso';
  const marca={cumple:'✓',por_debajo:'–',pendiente:'?'};
  const titulo={cumple:'Cumple',por_debajo:'Por debajo del mínimo',pendiente:'Sin prueba todavía'};
  return '<div class="tp-req-resumen">'+(i.total?tpChip(i.cumple+' de '+i.total+' imprescindibles',tipoImp):'')+(v.total?tpChip(v.cumple+' de '+v.total+' valorables'):'')+'</div>'+
    '<div class="tp-req-estados">'+req.estados.map(e=>'<span class="tp-req-est e-'+e.estado+(e.peso==='imprescindible'?' imp':'')+'" title="'+escHtml(titulo[e.estado]+' · mínimo '+TP_REQ_MINIMOS[e.minimo].txt)+'"><b aria-hidden="true">'+marca[e.estado]+'</b>'+escHtml(e.skill)+'<span class="sr-only">: '+escHtml(titulo[e.estado])+'</span></span>').join('')+'</div>';
}

// ── Formulario de la oferta ────────────────────────────────────────────────
var TPReq={lista:[],paso:1,
  reset(){TPReq.lista=[];TPReq.paso=1;pjReqSkills=[];const e=document.getElementById('pjDocEstado');if(e)e.innerHTML='';document.querySelectorAll('#postJobForm .pj-auto').forEach(x=>x.classList.remove('pj-auto'));},
  nombres(){return TPReq.lista.map(r=>r.skill);},
  imprescindibles(){return TPReq.lista.filter(r=>r.peso==='imprescindible').length;},
  sincronizar(){pjReqSkills=TPReq.nombres();},
  paraEnviar(){return TPReq.lista.map(r=>({skill:r.skill,peso:r.peso,minimo:r.minimo}));}
};

function tpReqCatalogo(){
  const set=new Set();
  (typeof COMMON_EXERCISES!=='undefined'?COMMON_EXERCISES:[]).forEach(ce=>{if(ce.skill)set.add(ce.skill);});
  if(!set.size&&typeof candidateProfile!=='undefined')Object.keys(candidateProfile.skills||{}).forEach(s=>set.add(s));
  return[...set];
}
function tpReqPilar(s){
  const f=typeof tpFamiliaAptitud==='function'?tpFamiliaAptitud(s):null;
  const fam=f||(typeof getSkillCategory==='function'&&getSkillCategory(s)==='soft'?'soft':'hard');
  return{soft:'Soft',transferibles:'Transferible',hard:'Hard'}[fam]||'Hard';
}

function tpReqAnadir(skill,opts){
  if(TPReq.nombres().some(n=>n.toLowerCase()===skill.toLowerCase()))return;
  if(TPReq.lista.length>=TP_REQ_MAX){toast('Como máximo '+TP_REQ_MAX+' skills por oferta. Quita una para añadir otra.');return;}
  const o=opts||{};
  const peso=o.peso||(TPReq.imprescindibles()<3?'imprescindible':'valorable');
  TPReq.lista.push({skill,peso:peso==='imprescindible'&&TPReq.imprescindibles()>=TP_REQ_MAX_IMP?'valorable':peso,minimo:TP_REQ_MINIMOS[o.minimo]?o.minimo:'aceptable',motivo:o.motivo||''});
  TPReq.sincronizar();
}
function tpReqQuitar(i){TPReq.lista.splice(i,1);TPReq.sincronizar();tpReqPintar();}
function tpReqPeso(i,peso){
  const r=TPReq.lista[i];if(!r)return;
  if(peso==='imprescindible'&&r.peso!=='imprescindible'&&TPReq.imprescindibles()>=TP_REQ_MAX_IMP){toast('Como máximo '+TP_REQ_MAX_IMP+' imprescindibles. Pedirlo todo es no pedir nada.');return;}
  r.peso=peso;tpReqPintar();
}
function tpReqMinimo(i,m){const r=TPReq.lista[i];if(r&&TP_REQ_MINIMOS[m])r.minimo=m;}

// Sustituye a la rejilla con todas las skills: la búsqueda solo enseña coincidencias.
renderPjSkills=function(){
  const q=(document.getElementById('pjSkillSearch')?.value||'').trim().toLowerCase();
  const box=document.getElementById('pjRequiredSkills');
  if(box){
    if(!q){box.innerHTML='';}
    else{
      const elegidas=new Set(TPReq.nombres().map(n=>n.toLowerCase()));
      const res=tpReqCatalogo().filter(s=>s.toLowerCase().includes(q)&&!elegidas.has(s.toLowerCase())).slice(0,8);
      box.innerHTML=res.length?res.map(s=>'<button type="button" class="pj-sug" data-skill="'+escHtml(s)+'">+ '+escHtml(s)+'<span>'+tpReqPilar(s)+'</span></button>').join('')
        :'<span class="pj-ayuda">Ninguna skill con ese nombre tiene reto todavía. Puedes añadirla como etiqueta técnica libre.</span>';
    }
  }
  tpReqPintarLista();tpReqPintarSugeridas();
};
togglePjSkill=function(skill){
  const i=TPReq.nombres().indexOf(skill);
  if(i>=0)tpReqQuitar(i);else{tpReqAnadir(skill);tpReqPintar();}
};
function tpReqPintar(){renderPjSkills();}

function tpReqPintarLista(){
  const box=document.getElementById('pjReqLista');if(!box)return;
  if(!TPReq.lista.length){box.innerHTML='<div class="pj-req-vacio">Todavía no has elegido ninguna skill. Empieza por las sugeridas o busca una.</div>';return;}
  const imp=TPReq.imprescindibles();
  const pilares=new Set(TPReq.lista.map(r=>tpReqPilar(r.skill)));
  const opcionesMin=m=>Object.keys(TP_REQ_MINIMOS).map(k=>'<option value="'+k+'"'+(k===m?' selected':'')+'>'+TP_REQ_MINIMOS[k].txt+'</option>').join('');
  let h='<div class="pj-req-cab"><span>'+TPReq.lista.length+' de '+TP_REQ_MAX+' skills · '+imp+' de '+TP_REQ_MAX_IMP+' imprescindibles</span></div><ul class="pj-req-lista">';
  TPReq.lista.forEach((r,i)=>{
    const id='pjMin'+i;
    h+='<li class="pj-req-fila'+(r.peso==='imprescindible'?' imp':'')+'"><div class="pj-req-nombre"><b>'+escHtml(r.skill)+'</b><span class="pj-req-pilar">'+tpReqPilar(r.skill)+'</span>'+(r.motivo?'<span class="pj-req-motivo">Del documento: '+escHtml(r.motivo)+'</span>':'')+'</div>'+
      '<div class="pj-req-peso" role="group" aria-label="Peso de '+escHtml(r.skill)+'"><button type="button" class="'+(r.peso==='imprescindible'?'activo':'')+'" aria-pressed="'+(r.peso==='imprescindible')+'" onclick="tpReqPeso('+i+',\'imprescindible\')">Imprescindible</button><button type="button" class="'+(r.peso==='valorable'?'activo':'')+'" aria-pressed="'+(r.peso==='valorable')+'" onclick="tpReqPeso('+i+',\'valorable\')">Valorable</button></div>'+
      '<div class="pj-req-min"><label for="'+id+'">Mínimo</label><select id="'+id+'" onchange="tpReqMinimo('+i+',this.value)">'+opcionesMin(r.minimo)+'</select></div>'+
      '<button type="button" class="pj-req-quitar" aria-label="Quitar '+escHtml(r.skill)+'" onclick="tpReqQuitar('+i+')">×</button></li>';
  });
  h+='</ul>';
  if(!pilares.has('Soft')&&!pilares.has('Transferible'))h+='<div class="pj-req-aviso">Solo pides skills técnicas. Recomendamos al menos una soft skill o una transferible: es lo primero que se pregunta una empresa, cómo es la persona con los demás.</div>';
  box.innerHTML=h;
}

function tpReqPintarSugeridas(){
  const box=document.getElementById('pjReqSugeridas');if(!box)return;
  const area=document.getElementById('pj-sector')?.value||'';
  const cat=new Set(tpReqCatalogo());
  const elegidas=new Set(TPReq.nombres().map(n=>n.toLowerCase()));
  const sug=(TP_REQ_SUGERIDAS[area]||[]).filter(s=>cat.has(s)&&!elegidas.has(s.toLowerCase())).slice(0,6);
  if(!sug.length||TPReq.lista.length>=TP_REQ_MAX){box.innerHTML='';return;}
  box.innerHTML='<div class="pj-sug-cab"><span>Sugeridas para este puesto</span><button type="button" class="pj-enlace" onclick="tpReqAnadirSugeridas()">Añadir todas</button></div><div class="pj-sug-lista">'+
    sug.map(s=>'<button type="button" class="pj-sug" data-skill="'+escHtml(s)+'">+ '+escHtml(s)+'<span>'+tpReqPilar(s)+'</span></button>').join('')+'</div>';
}
function tpReqAnadirSugeridas(){
  document.querySelectorAll('#pjReqSugeridas .pj-sug').forEach(b=>tpReqAnadir(b.dataset.skill));
  tpReqPintar();
}
// Un solo manejador para los botones «+ skill» (sugeridas y búsqueda): el nombre
// viaja en data-skill, nunca dentro de un onclick con comillas.
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('#postJobForm .pj-sug');
  if(!b)return;
  tpReqAnadir(b.dataset.skill);
  const s=document.getElementById('pjSkillSearch');if(s&&b.closest('#pjRequiredSkills'))s.value='';
  tpReqPintar();
});

// ── Pasos ───────────────────────────────────────────────────────────────────
function tpReqValidarPaso(n){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  if(n===1){
    if(v('pj-title').length<3){toast('Escribe el título del puesto.');document.getElementById('pj-title')?.focus();return false;}
    if(!v('pj-sector')){toast('Elige el área del puesto.');document.getElementById('pj-sector')?.focus();return false;}
    if(v('pj-desc').length<20){toast('Describe el puesto en al menos 20 caracteres.');document.getElementById('pj-desc')?.focus();return false;}
  }
  if(n===2&&!TPReq.lista.length){toast('Elige al menos una skill que tenga que demostrar.');return false;}
  return true;
}
function tpReqIr(n,sinValidar){
  n=Math.max(1,Math.min(3,n));
  if(!sinValidar)for(let p=TPReq.paso;p<n;p++)if(!tpReqValidarPaso(p))return;
  TPReq.paso=n;
  document.querySelectorAll('#postJobForm .pj-paso').forEach(s=>s.classList.toggle('activo',Number(s.dataset.paso)===n));
  const pasos=document.getElementById('pjPasos');
  if(pasos)pasos.innerHTML=tpPasos([{txt:'El puesto',hecho:n>1},{txt:'Qué tiene que demostrar',hecho:n>2},{txt:'Condiciones',hecho:false}],'Pasos de la oferta');
  document.getElementById('pjAtras')?.classList.toggle('pj-oculto',n===1);
  document.getElementById('pjSiguiente')?.classList.toggle('pj-oculto',n===3);
  document.getElementById('pjPublicar')?.classList.toggle('pj-oculto',n!==3);
  document.getElementById('pjDoc')?.classList.toggle('pj-oculto',n!==1);
  if(n===2)tpReqPintar();
  if(n===3)tpReqContar();
}
function tpReqContar(){
  const n=pref=>[1,2,3].filter(i=>(document.getElementById(pref+i)?.value||'').trim()).length;
  const q=document.getElementById('pjCuentaQ'),d=document.getElementById('pjCuentaD');
  if(q)q.textContent=n('pj-q')+' de 3';
  if(d)d.textContent=n('pj-d')+' de 3';
}
(function(){
  const _toggle=togglePostJob;
  togglePostJob=function(){
    _toggle.apply(this,arguments);
    const f=document.getElementById('postJobForm');
    if(f&&f.style.display!=='none'){tpReqIr(TPReq.paso||1,true);tpReqPintar();}
  };
})();

// ── Rellenar desde un documento ─────────────────────────────────────────────
function tpReqMostrarPegar(){document.getElementById('pjDocPegar')?.classList.toggle('abierto');document.getElementById('pjDocTexto')?.focus();}
function tpReqEstado(html,tipo){const e=document.getElementById('pjDocEstado');if(e)e.innerHTML=html?'<div class="pj-doc-estado'+(tipo?' '+tipo:'')+'">'+html+'</div>':'';}

async function tpReqEnviarDoc(cuerpo){
  if(!tpCompany){toast('Inicia sesión con tu cuenta de empresa para leer documentos.');return;}
  const btns=document.querySelectorAll('#pjDoc button, #pjDoc .pj-doc-btn');
  btns.forEach(b=>b.setAttribute('aria-disabled','true'));
  tpReqEstado('Leyendo el documento… suele tardar entre 10 y 30 segundos.','cargando');
  let r;
  try{r=await TPCloud._postAuth('parse-job-doc',cuerpo);}
  finally{btns.forEach(b=>b.removeAttribute('aria-disabled'));}
  if(!r||r.error||!r.propuesta){tpReqEstado(escHtml((r&&r.error)||'No se ha podido leer el documento. Rellena la oferta a mano.'),'error');return;}
  tpReqAplicarPropuesta(r.propuesta);
}
function tpReqLeerArchivo(input){
  const f=input.files&&input.files[0];input.value='';
  if(!f)return;
  if(f.size>3*1024*1024){tpReqEstado('El archivo pasa de 3 MB. Sube solo el documento de requisitos.','error');return;}
  const lector=new FileReader();
  lector.onload=()=>{const b64=String(lector.result||'').split(',')[1]||'';tpReqEnviarDoc({nombre:f.name,base64:b64});};
  lector.onerror=()=>tpReqEstado('No se ha podido abrir el archivo.','error');
  lector.readAsDataURL(f);
}
function tpReqLeerTexto(){
  const t=(document.getElementById('pjDocTexto')?.value||'').trim();
  if(t.length<40){toast('Pega un poco más de texto: al menos la descripción y los requisitos.');return;}
  tpReqEnviarDoc({texto:t});
}

/** Vuelca la propuesta en el formulario. No publica nada: la empresa revisa paso a paso. */
function tpReqAplicarPropuesta(p){
  const rellenados=[];
  const poner=(id,valor,nombre)=>{
    const el=document.getElementById(id);
    if(!el||valor==null||valor==='')return;
    if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===String(valor)))return;
    el.value=valor;el.classList.add('pj-auto');
    el.addEventListener('input',()=>el.classList.remove('pj-auto'),{once:true});
    if(nombre&&!rellenados.includes(nombre))rellenados.push(nombre);
  };
  poner('pj-title',p.title,'título');poner('pj-sector',p.sector,'área');poner('pj-desc',p.description,'descripción');
  poner('pj-jornada',p.jornada,'condiciones');poner('pj-mode',p.modalidad,'condiciones');poner('pj-contrato',p.contrato,'condiciones');
  poner('pj-city',p.ubicacion,'condiciones');poner('pj-sal-min',p.salMin,'salario');poner('pj-sal-max',p.salMax,'salario');
  (p.cultureQuestions||[]).slice(0,3).forEach((q,i)=>poner('pj-q'+(i+1),q,'preguntas'));
  (p.dilemmas||[]).slice(0,3).forEach((d,i)=>poner('pj-d'+(i+1),d,'dilemas'));
  if(Array.isArray(p.skillRequirements)&&p.skillRequirements.length){
    TPReq.lista=[];
    p.skillRequirements.forEach(r=>tpReqAnadir(r.skill,{peso:r.peso,minimo:r.minimo,motivo:r.motivo}));
    rellenados.push(TPReq.lista.length+' skills');
  }
  if(Array.isArray(p.tags)&&p.tags.length&&typeof pjSkills!=='undefined'){
    p.tags.forEach(t=>{if(!pjSkills.includes(t))pjSkills.push(t);});
    if(typeof renderPjTags==='function')renderPjTags();
  }
  const avisos=(p.avisos||[]).map(a=>'<li>'+escHtml(a)+'</li>').join('');
  tpReqEstado('<strong>Hemos rellenado '+escHtml(rellenados.join(', ')||'lo que hemos podido')+'.</strong> Revisa cada paso antes de publicar: los campos rellenados van marcados.'+(avisos?'<ul>'+avisos+'</ul>':''),'ok');
  document.getElementById('pjDocPegar')?.classList.remove('abierto');
  tpReqIr(1,true);tpReqPintar();tpReqContar();
}
