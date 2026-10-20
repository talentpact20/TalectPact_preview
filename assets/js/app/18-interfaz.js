// TalentPact · 18-interfaz
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
//
// Piezas comunes del sistema de diseño (estilos en assets/css/componentes.css):
// tema claro/oscuro, pasos, barra de nota, anillo, chips, esqueleto de carga y
// el contador con autoguardado de las respuestas.

// ═══ Tema: sistema → claro → oscuro ═══
const TPTema=(()=>{
  const ORDEN=['sistema','light','dark'];
  const TXT={sistema:'Tema del sistema',light:'Tema claro',dark:'Tema oscuro'};
  const ICO={sistema:'monitor',light:'sun',dark:'moon'};
  function actual(){try{const t=localStorage.getItem('tp-tema');return t==='light'||t==='dark'?t:'sistema';}catch(e){return 'sistema';}}
  function aplicar(t){
    const r=document.documentElement;
    if(t==='sistema')r.removeAttribute('data-theme');else r.setAttribute('data-theme',t);
    try{if(t==='sistema')localStorage.removeItem('tp-tema');else localStorage.setItem('tp-tema',t);}catch(e){}
    pintar();
  }
  function pintar(){
    const t=actual();
    document.querySelectorAll('.tp-tema-btn').forEach(b=>{
      b.innerHTML=tpIcon(ICO[t])+'<span class="tp-tema-txt">'+TXT[t]+'</span>';
      b.setAttribute('aria-label',TXT[t]+'. Pulsa para cambiar.');
      b.title=TXT[t];
    });
    const oscuro=document.documentElement.getAttribute('data-theme')==='dark'||(t==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches);
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',oscuro?'#0f1726':'#ffffff');
  }
  function siguiente(){aplicar(ORDEN[(ORDEN.indexOf(actual())+1)%ORDEN.length]);}
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',pintar);}catch(e){}
  return {actual,aplicar,siguiente,pintar};
})();
function tpCambiarTema(){TPTema.siguiente();}

// ═══ Componentes ═══
const _tpEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Chip de estado. tipo: ok | aviso | error | info | (vacío = neutro)
function tpChip(texto,tipo){return '<span class="tp-chip'+(tipo?' tp-chip-'+tipo:'')+'">'+_tpEsc(texto)+'</span>';}

// Pasos: [{txt, hecho}] — el primero sin hacer es el actual.
function tpPasos(pasos,etiqueta){
  const iActual=pasos.findIndex(p=>!p.hecho);
  return '<ol class="tp-pasos" aria-label="'+_tpEsc(etiqueta||'Progreso')+'">'+pasos.map((p,i)=>{
    const est=p.hecho?'hecho':i===iActual?'actual':'pendiente';
    const lectura=p.hecho?'completado':i===iActual?'paso actual':'pendiente';
    return '<li class="tp-paso '+est+'"'+(i===iActual?' aria-current="step"':'')+'><span class="tp-paso-punto" aria-hidden="true">'+(p.hecho?tpIcon('check'):(i+1))+'</span><span class="tp-paso-txt">'+_tpEsc(p.txt)+'<span class="sr-only">, '+lectura+'</span></span></li>';
  }).join('')+'</ol>';
}

// Barra de nota 0-100 con marca opcional del mínimo.
function tpBarraNota(o){
  const n=Math.max(0,Math.min(100,Math.round(Number(o.nota)||0)));
  const min=o.minimo==null?null:Math.max(0,Math.min(100,Number(o.minimo)));
  const bajo=min!=null?n<min:n<50;
  return '<div class="tp-nota'+(bajo?' bajo':'')+'"><span class="tp-nota-nombre">'+_tpEsc(o.nombre)+'</span><span class="tp-nota-valor">'+n+'<span class="sr-only"> sobre 100</span></span>'
    +'<div class="tp-nota-pista" role="img" aria-label="'+_tpEsc(o.nombre)+': '+n+' sobre 100'+(min!=null?', mínimo '+min:'')+'"><span class="tp-nota-relleno" style="width:'+n+'%"></span>'
    +(min!=null?'<span class="tp-nota-min" style="left:'+min+'%" title="Mínimo: '+min+'"></span>':'')+'</div>'
    +(o.comentario?'<p class="tp-nota-coment">'+_tpEsc(o.comentario)+'</p>':'')+'</div>';
}

// Anillo con la nota en el centro.
function tpAnillo(nota,etiqueta){
  const n=Math.max(0,Math.min(100,Math.round(Number(nota)||0)));
  const C=2*Math.PI*44;
  return '<div class="tp-anillo'+(n<50?' bajo':'')+'" role="img" aria-label="'+_tpEsc(etiqueta||'Nota')+': '+n+' sobre 100"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tp-anillo-pista" cx="50" cy="50" r="44"/><circle class="tp-anillo-arco" cx="50" cy="50" r="44" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-n/100)).toFixed(1)+'"/></svg><div class="tp-anillo-centro"><span class="tp-anillo-num">'+n+'</span><span class="tp-anillo-lbl">'+_tpEsc(etiqueta||'sobre 100')+'</span></div></div>';
}

// Encaje candidato-oferta (0-100) como barra con la cifra.
function tpEncaje(pct){
  const n=Math.max(0,Math.min(100,Math.round(Number(pct)||0)));
  return '<div class="tp-encaje" title="Encaje con la oferta"><span class="tp-encaje-pista" role="img" aria-label="Encaje: '+n+' %"><span class="tp-encaje-relleno" style="width:'+n+'%"></span></span><b>'+n+' %</b></div>';
}

// ── Bandas de nota ─────────────────────────────────────────────────────────
// Cuatro bandas en vez de un número de 0 a 100 (docs/plan_post_reunion,
// skills_en_la_plataforma.md). El candidato ve banda y nota; la empresa, la
// banda, con el número solo al pasar el ratón. Espejo de lib/bandas.js.
var TP_BANDAS=[
  {id:'insuficiente',txt:'Insuficiente',min:0},
  {id:'aceptable',txt:'Aceptable',min:40},
  {id:'bueno',txt:'Bueno',min:60},
  {id:'muy_bueno',txt:'Muy bueno',min:80}
];
function tpBanda(nota){
  const n=Math.max(0,Math.min(100,Math.round(Number(nota)||0)));
  let i=0;TP_BANDAS.forEach((b,k)=>{if(n>=b.min)i=k;});
  return Object.assign({nota:n,nivel:i+1},TP_BANDAS[i]);
}
/** Banda con cuatro segmentos. conNota: el número va escrito (vista del candidato). */
function tpBandaHtml(nota,conNota){
  const b=tpBanda(nota);
  return '<span class="tp-banda tp-banda-'+b.id+'" title="'+b.nota+' sobre 100"><span class="tp-banda-seg" aria-hidden="true">'+'<i></i>'.repeat(4)+'</span>'
    +'<span class="tp-banda-txt">'+b.txt+(conNota?' <b>'+b.nota+'</b>':'<span class="sr-only"> ('+b.nota+' sobre 100)</span>')+'</span></span>';
}
/** Fila «skill · banda». o: {conNota, verificada}. */
function tpSkillBanda(nombre,nota,o){
  o=o||{};
  const vis=typeof tpSkillNombre==='function'?tpSkillNombre(nombre):nombre;
  return '<div class="tp-skill-banda"><span class="tp-skill-banda-nombre">'+_tpEsc(vis)+(o.verificada?' <span class="tp-verified" title="Nota verificada por el servidor">✓</span>':'')+'</span>'+tpBandaHtml(nota,o.conNota)+'</div>';
}
/**
 * Skills agrupadas en los dos bloques (Hard / Soft), mejor banda primero.
 * skills: [{n, v, verified}]. o: {conNota, max (por bloque), vacio}.
 */
function tpBloquesSkills(skills,o){
  o=o||{};
  const fam=n=>typeof tpFamiliaAptitud==='function'?tpFamiliaAptitud(n):'hard';
  const lista=(skills||[]).filter(s=>s&&s.n).slice().sort((a,b)=>b.v-a.v);
  const bloque=(id,titulo)=>{
    const xs=lista.filter(s=>fam(s.n)===id).slice(0,o.max||99);
    return '<section class="tp-bloque-skills"><h4>'+titulo+'</h4>'+(xs.length
      ?xs.map(s=>tpSkillBanda(s.n,s.v,{conNota:o.conNota,verificada:s.verified})).join('')
      :'<p class="tp-bloque-vacio">'+_tpEsc(o.vacio||'Sin retos hechos en este bloque.')+'</p>')+'</section>';
  };
  return '<div class="tp-bloques-skills">'+bloque('hard','Hard skills')+bloque('soft','Soft skills')+'</div>';
}
/** Chips compactos «skill · banda» (tablas y tarjetas). */
function tpChipsBanda(skills,max){
  const xs=(skills||[]).filter(s=>s&&s.n).slice().sort((a,b)=>b.v-a.v).slice(0,max||3);
  if(!xs.length)return '<span class="u-c-slate-400">—</span>';
  return '<div class="tp-cond">'+xs.map(s=>{const b=tpBanda(s.v);return '<span class="tp-cond-chip tp-chip-banda tp-banda-'+b.id+'" title="'+b.nota+' sobre 100">'+_tpEsc(typeof tpSkillNombre==='function'?tpSkillNombre(s.n):s.n)+' · '+b.txt+'</span>';}).join('')+'</div>';
}

// Enunciado de un reto o guía de respuesta: texto escapado, en párrafos, y los
// bloques ```lenguaje … ``` como código. Antes el enunciado se pintaba tal cual:
// el código de un ejercicio (p. ej. un <input> de JSX) se convertía en HTML real.
function tpFormatoEnunciado(texto){
  const partes=String(texto||'').split(/```[A-Za-z0-9_-]*[ \t]*\n?/);
  return partes.map((p,i)=>i%2===1
    ?'<pre class="ex-codigo"><code>'+_tpEsc(p.replace(/\n$/,''))+'</code></pre>'
    :p.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean).map(x=>'<p>'+_tpEsc(x).replace(/\n/g,'<br>')+'</p>').join('')
  ).join('');
}

// Esqueleto de carga con la forma aproximada del contenido.
function tpEsqueleto(lineas){return '<div class="tp-esqueleto" aria-hidden="true">'+'<i></i>'.repeat(lineas||3)+'</div><span class="sr-only" role="status">Cargando…</span>';}

// Tarjeta "Lo siguiente": una sola acción destacada.
function tpSiguiente(o){
  return '<div class="tp-siguiente"><span class="tp-siguiente-ico">'+tpIcon(o.icono||'arrow-right')+'</span><div class="tp-siguiente-txt"><div class="tp-siguiente-eti">Lo siguiente</div><div class="tp-siguiente-tit">'+_tpEsc(o.titulo)+'</div>'+(o.sub?'<div class="tp-siguiente-sub">'+_tpEsc(o.sub)+'</div>':'')+'</div>'+(o.boton?'<button type="button" class="btn btn-primary" onclick="'+o.accion+'">'+_tpEsc(o.boton)+'</button>':'')+'</div>';
}

// Estado vacío grande: icono, título, texto y hasta dos acciones [{txt, accion, tipo}].
function tpVacio(o){
  return '<div class="tp-vacio'+(o.error?' error':'')+'"><span class="tp-vacio-ico">'+tpIcon(o.icono||'search')+'</span><h3>'+_tpEsc(o.titulo)+'</h3>'+(o.texto?'<p>'+_tpEsc(o.texto)+'</p>':'')
    +((o.acciones||[]).length?'<div class="tp-vacio-acc">'+o.acciones.map(a=>'<button type="button" class="btn '+(a.tipo||'btn-outline')+'" onclick="'+a.accion+'">'+_tpEsc(a.txt)+'</button>').join('')+'</div>':'')+'</div>';
}

// Portada: la cifra de retos sale del catálogo real, no de un número escrito a mano.
function tpPintarPruebaPortada(){
  const el=document.getElementById('heroProof');
  if(!el||typeof COMMON_EXERCISES==='undefined'||!COMMON_EXERCISES.length)return;
  const total=COMMON_EXERCISES.length,soft=COMMON_EXERCISES.filter(c=>c.category==='soft').length,ia=COMMON_EXERCISES.filter(c=>c.rama==='ia').length;
  el.innerHTML='<strong>'+total+' retos</strong> ('+soft+' transversales, '+(total-soft-ia)+' de sector y '+ia+' de inteligencia artificial) · corrección con IA criterio a criterio · <a href="/verify.html" class="hero-proof-link">comprueba un SkillPass →</a>';
}

// ═══ Respuesta en curso: palabras y autoguardado en este navegador ═══
// El borrador se guarda en sessionStorage (se borra al cerrar la pestaña) para
// no perder lo escrito si se cierra el ejercicio sin querer. El cronómetro no se
// reinicia por volver: lo controla TPIntegrity.
const TPBorrador={
  clave(k){return 'tp-borrador:'+k;},
  leer(k){try{return sessionStorage.getItem(this.clave(k))||'';}catch(e){return '';}},
  guardar(k,v){try{if(v)sessionStorage.setItem(this.clave(k),v);else sessionStorage.removeItem(this.clave(k));return true;}catch(e){return false;}},
  borrar(k){try{sessionStorage.removeItem(this.clave(k));}catch(e){}}
};
function tpRespuestaViva(clave){
  const ta=document.getElementById('exAns');
  if(!ta||ta.dataset.viva)return;
  ta.dataset.viva='1';
  const previo=TPBorrador.leer(clave);
  if(previo&&!ta.value)ta.value=previo;
  const meta=document.createElement('div');
  meta.className='tp-resp-meta';
  meta.innerHTML='<span class="tp-resp-guardado no" aria-live="polite">'+tpIcon('check')+'<span>Guardado en este navegador</span></span><span class="tp-resp-palabras"></span>';
  ta.insertAdjacentElement('afterend',meta);
  const guard=meta.querySelector('.tp-resp-guardado'),pal=meta.querySelector('.tp-resp-palabras');
  let t=null;
  const contar=()=>{const n=(ta.value.trim().match(/\S+/g)||[]).length;pal.textContent=n===1?'1 palabra':n+' palabras';};
  contar();
  if(previo)guard.classList.remove('no');
  ta.addEventListener('input',()=>{
    contar();guard.classList.add('no');
    clearTimeout(t);t=setTimeout(()=>{if(TPBorrador.guardar(clave,ta.value))guard.classList.toggle('no',!ta.value);},600);
  });
}

// Los botones de tema se pintan cuando el DOM existe.
document.addEventListener('DOMContentLoaded',()=>{TPTema.pintar();tpPintarPruebaPortada();});
if(document.readyState!=='loading'){TPTema.pintar();tpPintarPruebaPortada();}
