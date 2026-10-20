// TalentPact · 23-clasificacion
// Estructura de los retos, en tres bloques:
//   Hard skills (la parte técnica): sector profesional → área.
//   Soft skills: dimensión (6, diccionario de la asesora) → enfoque (32 competencias).
//   Inteligencia artificial (rama especial, plan 02): rama técnica → itinerario,
//   e «IA en el trabajo» para cualquier puesto.
// Primero se elige lo general y lo concreto aparece solo al abrirlo.
// También el sector de la empresa en dos pasos (12 generales → 22 concretos).
// Datos en 01b-taxonomia.js. Script clásico: ámbito global compartido (ver assets/js/README.md).

var TPClasif={dash:{bloque:'hard',g1:'all',g2:'all'},landing:{bloque:'all',g1:'all',g2:'all'}};
var TP_CLASIF_BLOQUES=[
  {id:'hard',nombre:'Hard skills',lema:'La parte técnica',nivel1:'sector',nivel1Pl:'sectores',nivel2:'área',nivel2Pl:'áreas'},
  {id:'soft',nombre:'Soft skills',lema:'Cómo trabaja con los demás y consigo',nivel1:'dimensión',nivel1Pl:'dimensiones',nivel2:'enfoque',nivel2Pl:'enfoques'},
  {id:'ia',nombre:'Inteligencia artificial',lema:'Construir IA y usarla con criterio',nivel1:'rama',nivel1Pl:'ramas',nivel2:'itinerario',nivel2Pl:'itinerarios'}
];
const TP_IA=(TP_TAXONOMIA.ia||{grupos:[],itinerarios:[],competencias:{},skills:{}});
var TP_CLASIF_IDIOMAS={id:'idiomas',nombre:'Idiomas',corto:'Idiomas',hijos:[]};

function tpClasifBloque(id){return TP_CLASIF_BLOQUES.find(b=>b.id===id)||null;}

/** Primer nivel de un reto: su dimensión (soft) o su sector profesional (hard). */
function tpRetoNivel1(ce){
  if(tpSegmentoReto(ce)==='ia')return ce.grupo||'ia_tecnica';
  if(tpSegmentoReto(ce)==='soft'){const d=tpDimensionDeSkill(ce.skill);return d?d.id:'';}
  return tpAreaDeSkill(ce.skill)||'idiomas';
}
/** Segundo nivel: los enfoques que evalúa (soft) o su área concreta (hard). */
function tpRetoNivel2(ce){
  if(tpSegmentoReto(ce)==='ia'){const c=(TP_IA.skills[ce.skill]||{}).competencia;return TP_IA.itinerarios.filter(i=>i.competencias.includes(c)).map(i=>i.id);}
  if(tpSegmentoReto(ce)==='soft')return TP_TAXONOMIA.competenciasDeSkill[ce.skill]||[];
  const a=tpAreaConcretaDeSkill(ce.skill);return a?[a]:[];
}

/** Grupos del primer nivel de un bloque, cada uno con sus hijos (segundo nivel). */
function tpClasifGrupos(bloque){
  if(bloque==='ia')return TP_IA.grupos.map(g=>({id:g.id,nombre:g.nombre,corto:g.corto,desc:g.desc,
    hijos:g.id==='ia_tecnica'?TP_IA.itinerarios.map(i=>({id:i.id,nombre:i.nombre,desc:'Competencias: '+i.competencias.map(c=>TP_IA.competencias[c]).filter(Boolean).join(', ')+'.'})):[]}));
  if(bloque==='soft')return TP_TAXONOMIA.dimensiones.map(d=>({id:d.id,num:d.num,nombre:d.nombre,corto:d.corto,hijos:d.competencias.map(c=>({id:c.id,nombre:c.nombre,desc:c.definicion}))}));
  return TP_TAXONOMIA.areas.map(a=>({id:a.id,nombre:a.nombre,corto:a.corto,hijos:a.especialidades.map(e=>({id:e,nombre:e}))})).concat([TP_CLASIF_IDIOMAS]);
}

function tpClasifBuscar(lista,q){
  if(!q)return lista;
  const qq=q.toLowerCase();
  return lista.filter(ce=>{
    const extra=tpCompetenciasDeSkill(ce.skill).map(c=>c.nombre).join(' ')+' '+(tpAreaConcretaDeSkill(ce.skill)||'')+' '+tpClasifNombre1(ce);
    return(ce.title+' '+ce.desc+' '+(ce.searchTerms||'')+' '+ce.skill+' '+tpSkillNombre(ce.skill)+' '+extra).toLowerCase().includes(qq);
  });
}
function tpClasifNombre1(ce){
  const id=tpRetoNivel1(ce),g=tpClasifGrupos(tpSegmentoReto(ce)).find(x=>x.id===id);
  return g?g.corto:'';
}

function tpClasifFiltrar(lista,st){
  if(st.bloque!=='all')lista=lista.filter(ce=>tpSegmentoReto(ce)===st.bloque);
  if(st.g1!=='all')lista=lista.filter(ce=>tpRetoNivel1(ce)===st.g1);
  if(st.g2!=='all')lista=lista.filter(ce=>tpRetoNivel2(ce).includes(st.g2));
  return lista;
}

// ── Acciones ────────────────────────────────────────────────────────────────
function tpClasifRepintar(donde){if(donde==='dash')filterDashCommonEx();else filterCommonExLanding();}
function tpClasifElegirBloque(donde,b){const st=TPClasif[donde];st.bloque=b;st.g1='all';st.g2='all';tpClasifRepintar(donde);}
function tpClasifElegir1(donde,id){const st=TPClasif[donde];st.g1=st.g1===id?'all':id;st.g2='all';tpClasifRepintar(donde);}
function tpClasifElegir2(donde,id){const st=TPClasif[donde];st.g2=st.g2===id?'all':id;tpClasifRepintar(donde);}

// ── Piezas visuales ─────────────────────────────────────────────────────────
/** Los dos bloques grandes. */
function tpClasifBloques(donde,base){
  const st=TPClasif[donde];
  return '<div class="tp-bloques" role="group" aria-label="Tipo de skill">'+TP_CLASIF_BLOQUES.map(b=>{
    const n=base.filter(ce=>tpSegmentoReto(ce)===b.id).length,g=tpClasifGrupos(b.id).length;
    const on=st.bloque===b.id;
    return '<button type="button" class="tp-bloque'+(on?' activo':'')+'" aria-pressed="'+on+'" onclick="tpClasifElegirBloque(\''+donde+'\',\''+b.id+'\')"><b>'+b.nombre+'</b><span>'+b.lema+'</span><small>'+g+' '+b.nivel1Pl+' · '+n+' reto'+(n!==1?'s':'')+'</small></button>';
  }).join('')+'</div>';
}
function tpClasifCuentas(lista){
  const c1={},c2={};
  lista.forEach(ce=>{const a=tpRetoNivel1(ce);c1[a]=(c1[a]||0)+1;tpRetoNivel2(ce).forEach(b=>{c2[b]=(c2[b]||0)+1;});});
  return{c1,c2};
}
/** Tarjetas del primer nivel y, si hay una abierta, sus hijos. */
function tpClasifNavegacion(donde,lista){
  const st=TPClasif[donde],b=tpClasifBloque(st.bloque);
  if(!b)return '';
  const grupos=tpClasifGrupos(b.id),{c1,c2}=tpClasifCuentas(lista);
  let h='<div class="tp-nivel-titulo">'+(b.id==='soft'?'Dimensiones':(b.id==='ia'?'Ramas':'Sectores'))+'</div><div class="tp-tiles">'+grupos.map(g=>{
    const n=c1[g.id]||0,on=st.g1===g.id;
    const det=(g.hijos.length>1?g.hijos.length+' '+b.nivel2Pl+' · ':'')+(n?n+' reto'+(n!==1?'s':''):'Sin retos todavía');
    return '<button type="button" class="tp-tile'+(on?' activo':'')+(n?'':' vacio')+'" aria-pressed="'+on+'" title="'+escHtml(g.nombre)+'" onclick="tpClasifElegir1(\''+donde+'\',\''+g.id+'\')">'+(g.num?'<i>'+g.num+'</i>':'')+'<b>'+escHtml(g.corto)+'</b><span>'+det+'</span></button>';
  }).join('')+'</div>';
  const g=grupos.find(x=>x.id===st.g1);
  if(g&&g.hijos.length>1){
    const tit=b.id==='soft'?'Enfoques de «'+g.nombre+'»':(b.id==='ia'?'Itinerarios de «'+g.nombre+'»':'Áreas de «'+g.nombre+'»');
    h+='<div class="tp-nivel-titulo">'+escHtml(tit)+'</div><div class="tp-subfiltros" role="group" aria-label="'+escHtml(tit)+'">'+
      '<button type="button" class="tp-subfiltro'+(st.g2==='all'?' activo':'')+'" aria-pressed="'+(st.g2==='all')+'" onclick="tpClasifElegir2(\''+donde+'\',\'all\')">Todas <span>'+(c1[g.id]||0)+'</span></button>'+
      g.hijos.map(x=>{const n=c2[x.id]||0,on=st.g2===x.id;return '<button type="button" class="tp-subfiltro'+(on?' activo':'')+'" aria-pressed="'+on+'"'+(n?'':' disabled')+(x.desc?' title="'+escHtml(x.desc)+'"':'')+' onclick="tpClasifElegir2(\''+donde+'\',\''+escHtml(x.id)+'\')">'+escHtml(x.nombre)+' <span>'+(n||'sin reto')+'</span></button>';}).join('')+'</div>';
    const sel=g.hijos.find(x=>x.id===st.g2);
    if(sel&&sel.desc)h+='<p class="tp-nivel-def"><b>'+escHtml(sel.nombre)+'.</b> '+escHtml(sel.desc)+'</p>';
  }
  return h;
}
/** Dónde estás: «Soft skills › Colaboración e influencia › Negociación · 1 reto». */
function tpClasifMigas(donde,n){
  const st=TPClasif[donde],b=tpClasifBloque(st.bloque);
  if(!b)return '';
  const g=tpClasifGrupos(b.id).find(x=>x.id===st.g1),h2=g&&g.hijos.find(x=>x.id===st.g2);
  const partes=[b.nombre].concat(g?[g.corto]:[]).concat(h2?[h2.nombre]:[]);
  return '<div class="tp-migas">'+partes.map(escHtml).join(' <span aria-hidden="true">›</span> ')+' · '+n+' reto'+(n!==1?'s':'')+'</div>';
}
function tpClasifEtiquetas(ce){
  if(tpSegmentoReto(ce)==='ia'){const g=TP_IA.grupos.find(x=>x.id===ce.grupo);return '<span class="cex-tag">Inteligencia artificial</span>'+(g?'<span class="cex-tag">'+escHtml(g.corto)+'</span>':'');}
  const soft=tpSegmentoReto(ce)==='soft';
  const area=!soft?tpAreaConcretaDeSkill(ce.skill):'';
  const n1=tpClasifNombre1(ce);
  return '<span class="cex-tag'+(soft?' universal':'')+'">'+(soft?'Soft skills':'Hard skills')+'</span>'+(n1?'<span class="cex-tag">'+escHtml(n1)+'</span>':'')+(area&&area!==n1&&area!==tpAreaNombre(tpAreaDeSkill(ce.skill))?'<span class="cex-tag">'+escHtml(area)+'</span>':'');
}
function tpClasifCompetencias(ce){
  const c=tpCompetenciasDeSkill(ce.skill);
  return c.length?'<div class="cex-comp">Enfoques: '+c.map(x=>escHtml(x.nombre)).join(' · ')+'</div>':'';
}

// ── Panel del candidato ─────────────────────────────────────────────────────
renderCommonExercises=function(filter,cat){
  const estado=cat!=null?cat:_dashExCat,q=filter||'',st=TPClasif.dash;
  const hecho=ce=>candidateProfile.completedCommon.find(x=>x.id===ce.id);
  let base=COMMON_EXERCISES;
  if(estado==='done')base=base.filter(hecho);
  else if(estado==='pending')base=base.filter(ce=>!hecho(ce));
  const bloques=document.getElementById('dashBloques'),nav=document.getElementById('dashExNav'),migas=document.getElementById('dashExMigas');
  if(bloques)bloques.innerHTML=tpClasifBloques('dash',base);
  let list;
  if(q){
    list=tpClasifBuscar(base,q);
    if(nav)nav.innerHTML='';
    if(migas)migas.innerHTML='<div class="tp-migas">Resultados en todos los retos · '+list.length+'</div>';
  }else{
    const delBloque=base.filter(ce=>tpSegmentoReto(ce)===st.bloque);
    if(nav)nav.innerHTML=tpClasifNavegacion('dash',delBloque);
    list=tpClasifFiltrar(base,st);
    if(migas)migas.innerHTML=tpClasifMigas('dash',list.length);
  }
  const box=document.getElementById('commonExGrid');if(!box)return;
  if(!list.length){box.innerHTML='<div class="tp-empty u-p-24 u-grid-column-1--1">'+(q?'No hay retos que coincidan con tu búsqueda.':estado!=='all'?'No hay retos '+(estado==='done'?'completados':'pendientes')+' aquí.':'Todavía no hay retos aquí. Los iremos añadiendo.')+'</div>';return;}
  box.innerHTML=list.map(ce=>{
    const done=hecho(ce);
    const otras=ce.tags.filter(t=>t!=='Universal'&&t!=='Sector').map(t=>'<span class="cex-tag">'+escHtml(t)+'</span>').join('');
    return '<div class="common-ex-card '+(done?'completed':'')+'" onclick="openCommonEx(\''+ce.id+'\')"><span class="cex-icon">'+tpMonograma(ce.title,ce.category)+'</span><div class="cex-title">'+ce.title+'</div><div class="cex-desc">'+ce.desc+'</div>'+tpClasifCompetencias(ce)+
      '<div class="cex-meta">'+tpClasifEtiquetas(ce)+otras+(done?'<span class="cex-tag u-bg-emerald-50 u-c-emerald-600 u-b-1-solid-emerald-100">✓ '+tpBanda(done.score).txt+' · '+tpBanda(done.score).nota+'</span>':'')+'</div></div>';
  }).join('');
};

// ── Portada: lista lateral ──────────────────────────────────────────────────
renderLandingCommon=function(filter,cat,level){
  level=level||'all';
  const el=document.getElementById('landingCommonGrid');
  if(!el)return;
  const st=TPClasif.landing;
  st.bloque=cat==='hard'||cat==='soft'||cat==='ia'?cat:'all';
  if(st.bloque==='all'){st.g1='all';st.g2='all';}
  let base=COMMON_EXERCISES.filter(ce=>Array.isArray(ce.exercises)&&ce.exercises.length);
  if(level!=='all')base=base.filter(ce=>ce.exercises.some(e=>e.difficulty===level));
  base=tpClasifBuscar(base,filter||'');
  const subBox=document.getElementById('exSubFilters');
  if(subBox)subBox.innerHTML=st.bloque==='all'?'':tpClasifNavCompacta('landing',base.filter(ce=>tpSegmentoReto(ce)===st.bloque));
  const list=tpClasifFiltrar(base,st);
  const countEl=document.getElementById('exResultsCount');
  if(countEl)countEl.textContent=list.length+' reto'+(list.length!==1?'s':'');
  if(!list.length){
    el.innerHTML='<div class="u-p-20 u-ta-center u-c-slate-400 u-fs-micro">'+(filter?'No hay retos que coincidan.':'Todavía no hay retos aquí.')+'</div>';
    const prev=document.getElementById('rplPreview');
    if(prev)prev.innerHTML='<div class="rpl-preview-empty"><span>'+tpIcon('search')+'</span><p>Sin resultados.</p></div>';
    return;
  }
  const PUNTO={basico:'u-bg-emerald-500',intermedio:'u-bg-amber-500',avanzado:'u-bg-red-500'};
  const NOMBRE={basico:'básico',intermedio:'intermedio',avanzado:'avanzado'};
  const ORDEN={basico:0,intermedio:1,avanzado:2};
  const fila=(ce,sub)=>{
    const niveles=[...new Set(ce.exercises.map(e=>e.difficulty))].sort((a,b)=>(ORDEN[a]??9)-(ORDEN[b]??9));
    const txt='Niveles disponibles: '+niveles.map(l=>NOMBRE[l]||l).join(', ');
    return '<div class="rpl-item" id="rplItem_'+ce.id+'" onclick="selectLandingReto(\''+ce.id+'\')"><div class="rpl-item-icon">'+tpMonograma(ce.title,ce.category)+'</div><div class="rpl-item-info"><div class="rpl-item-title">'+ce.title+'</div><div class="rpl-item-sub">'+escHtml(sub)+'</div></div><div class="rpl-dots" title="'+txt+'" aria-label="'+txt+'">'+niveles.map(l=>'<span class="rpl-dot '+(PUNTO[l]||'')+'"></span>').join('')+'</div></div>';
  };
  // Sin bloque: Hard y Soft. Con bloque: por sector o dimensión.
  let grupos;
  if(st.bloque==='all'){
    grupos=TP_CLASIF_BLOQUES.map(b=>({nombre:b.nombre,items:list.filter(ce=>tpSegmentoReto(ce)===b.id)})).filter(g=>g.items.length);
  }else{
    grupos=tpClasifGrupos(st.bloque).map(g=>({nombre:(g.num?g.num+' · ':'')+g.corto,items:list.filter(ce=>tpRetoNivel1(ce)===g.id)})).filter(g=>g.items.length);
  }
  const subDe=ce=>{
    if(tpSegmentoReto(ce)==='ia'){const c=(TP_IA.skills[ce.skill]||{}).competencia;return st.bloque==='all'?tpClasifNombre1(ce):(TP_IA.competencias[c]||'Para cualquier puesto');}
    if(tpSegmentoReto(ce)==='soft'){const c=tpCompetenciasDeSkill(ce.skill)[0];return st.bloque==='all'?tpClasifNombre1(ce):(c?c.nombre:'');}
    return st.bloque==='all'?tpClasifNombre1(ce):(tpAreaConcretaDeSkill(ce.skill)||tpClasifNombre1(ce));
  };
  el.innerHTML=grupos.map((g,i)=>'<div class="rpl-group-label'+(i?' u-mt-6':'')+'">'+escHtml(g.nombre)+'</div>'+g.items.map(ce=>fila(ce,subDe(ce))).join('')).join('');
  const sigue=_selectedLandingRetoId&&list.find(x=>x.id===_selectedLandingRetoId);
  selectLandingReto(sigue?_selectedLandingRetoId:list[0].id);
};
/** En la columna estrecha de la portada: chips del primer nivel y, si hay uno abierto, del segundo. */
function tpClasifNavCompacta(donde,lista){
  const st=TPClasif[donde],b=tpClasifBloque(st.bloque),{c1,c2}=tpClasifCuentas(lista);
  const chip=(fn,id,txt,n,on,titulo)=>'<button type="button" class="tp-subfiltro'+(on?' activo':'')+'" aria-pressed="'+on+'"'+(n?'':' disabled')+(titulo?' title="'+escHtml(titulo)+'"':'')+' onclick="'+fn+'(\''+donde+'\',\''+escHtml(id)+'\')">'+escHtml(txt)+' <span>'+n+'</span></button>';
  const grupos=tpClasifGrupos(b.id);
  let h='<div class="tp-nivel-titulo">'+(b.id==='soft'?'Dimensión':(b.id==='ia'?'Rama':'Sector'))+'</div><div class="tp-subfiltros">'+grupos.map(g=>chip('tpClasifElegir1',g.id,g.corto,c1[g.id]||0,st.g1===g.id,g.nombre)).join('')+'</div>';
  const g=grupos.find(x=>x.id===st.g1);
  if(g&&g.hijos.length>1)h+='<div class="tp-nivel-titulo">'+(b.id==='soft'?'Enfoque':(b.id==='ia'?'Itinerario':'Área'))+'</div><div class="tp-subfiltros">'+g.hijos.filter(x=>c2[x.id]).map(x=>chip('tpClasifElegir2',x.id,x.nombre,c2[x.id],st.g2===x.id,x.desc)).join('')+'</div>';
  return h;
}
(function(){
  const _set=setExCategory;
  setExCategory=function(cat,btn){TPClasif.landing.g1='all';TPClasif.landing.g2='all';return _set.apply(this,arguments);};
})();

// ── Sector de la empresa en dos pasos ──────────────────────────────────────
// El primer desplegable lleva los 12 sectores generales; el segundo
// («Concretamente») solo aparece si ese sector se divide en varios.
function tpSectorPreparar(id){
  const g=document.getElementById(id);
  if(!g||g.dataset.tpSector)return;
  g.dataset.tpSector='1';
  const vacio=(g.querySelector('option[value=""]')||{}).textContent||'Selecciona…';
  g.innerHTML='<option value="">'+escHtml(vacio)+'</option>'+TP_TAXONOMIA.sectores.map(s=>'<option value="'+s.id+'">'+escHtml(s.nombre)+'</option>').join('');
  g.addEventListener('change',()=>tpSectorDetalle(id));
}
function tpSectorDetalle(id,valor){
  const g=document.getElementById(id),det=document.getElementById(id+'-det'),campo=document.getElementById(id+'-det-campo');
  if(!g)return;
  const s=TP_TAXONOMIA.sectores.find(x=>x.id===g.value);
  const varios=!!(s&&s.ampliados.length>1);
  if(campo)campo.hidden=!varios;
  if(!det)return;
  det.innerHTML=varios?s.ampliados.map((x,i)=>'<option value="'+x.id+'">'+escHtml(i===0?x.nombre+' (en general)':x.nombre)+'</option>').join(''):'';
  if(varios)det.value=valor&&s.ampliados.some(x=>x.id===valor)?valor:s.id;
}
function tpSectorPoner(id,valor){
  tpSectorPreparar(id);
  const g=document.getElementById(id);if(!g)return;
  g.value=tpSectorGrupo(valor)||'';
  tpSectorDetalle(id,valor);
}
/** Valor a guardar: el sector concreto si se ha elegido, si no el general. */
function tpSectorValor(id){
  const g=document.getElementById(id),det=document.getElementById(id+'-det'),campo=document.getElementById(id+'-det-campo');
  if(!g||!g.value)return '';
  return det&&campo&&!campo.hidden&&det.value?det.value:g.value;
}
