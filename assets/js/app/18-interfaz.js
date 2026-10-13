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

// Esqueleto de carga con la forma aproximada del contenido.
function tpEsqueleto(lineas){return '<div class="tp-esqueleto" aria-hidden="true">'+'<i></i>'.repeat(lineas||3)+'</div><span class="sr-only" role="status">Cargando…</span>';}

// Tarjeta "Lo siguiente": una sola acción destacada.
function tpSiguiente(o){
  return '<div class="tp-siguiente"><span class="tp-siguiente-ico">'+tpIcon(o.icono||'arrow-right')+'</span><div class="tp-siguiente-txt"><div class="tp-siguiente-eti">Lo siguiente</div><div class="tp-siguiente-tit">'+_tpEsc(o.titulo)+'</div>'+(o.sub?'<div class="tp-siguiente-sub">'+_tpEsc(o.sub)+'</div>':'')+'</div>'+(o.boton?'<button type="button" class="btn btn-primary" onclick="'+o.accion+'">'+_tpEsc(o.boton)+'</button>':'')+'</div>';
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
document.addEventListener('DOMContentLoaded',()=>TPTema.pintar());
if(document.readyState!=='loading')TPTema.pintar();
