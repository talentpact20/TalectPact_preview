// TalentPact · 28-resumen-empresa
// Resumen del panel de empresa: KPIs + gráficos con datos reales (ofertas,
// pool anónimo, desbloqueos). Sin cifras inventadas: vacío profesional si aún
// no hay datos. Script clásico: ámbito global compartido (ver assets/js/README.md).

/** Mejor nota del candidato (skills demostradas). */
function tpEmpMejorNota(c){
  const skills=(c&&c.skills)||[];
  if(!skills.length)return null;
  return Math.max.apply(null,skills.map(s=>Number(s.v)||0));
}

/** Recuento del pool por banda de la mejor skill. */
function tpEmpBandasPool(cands){
  const out={insuficiente:0,aceptable:0,bueno:0,muy_bueno:0,sin:0};
  (cands||[]).forEach(c=>{
    const n=tpEmpMejorNota(c);
    if(n==null){out.sin++;return;}
    out[tpBanda(n).id]++;
  });
  return out;
}

/** Ofertas propias: abiertas / cerradas. */
function tpEmpOfertasEstado(mias){
  const lista=mias||[];
  let abiertas=0,cerradas=0;
  lista.forEach(j=>{if(j.status==='open')abiertas++;else cerradas++;});
  return {total:lista.length,abiertas,cerradas};
}

/** Encaje ≥50 % por oferta abierta (máx. 8 filas). */
function tpEmpEncajePorOferta(mias,poolOk){
  if(!poolOk||typeof encajeOferta!=='function')return [];
  return (mias||[]).filter(j=>j.status==='open').map(j=>({
    id:j.id,titulo:j.title||'Oferta',
    n:typeof TPOfertas!=='undefined'&&TPOfertas.candidatosPara?TPOfertas.candidatosPara(j):0
  })).sort((a,b)=>b.n-a.n).slice(0,8);
}

/** Situación de búsqueda en el pool (si el candidato la ha indicado). */
function tpEmpBusquedaPool(cands){
  const out={activa:0,abierta:0,no:0,sin:0};
  (cands||[]).forEach(c=>{
    const b=(c.cond&&c.cond.busqueda)||'';
    if(b==='activa')out.activa++;
    else if(b==='abierta')out.abierta++;
    else if(b==='no')out.no++;
    else out.sin++;
  });
  return out;
}

function _empRsEsc(s){return typeof escHtml==='function'?escHtml(String(s==null?'':s)):String(s==null?'':s);}

/** Donut SVG de dos valores (a / b). */
function tpEmpDonut(a,b,etqA,etqB){
  const tot=Math.max(0,Number(a)||0)+Math.max(0,Number(b)||0);
  if(!tot)return '<p class="emp-rs-vacio">Todavía no hay datos para este gráfico.</p>';
  const R=42,C=2*Math.PI*R,pa=(Number(a)||0)/tot,pb=1-pa;
  const dashA=(C*pa).toFixed(1),gapA=(C-dashA).toFixed(1);
  const dashB=(C*pb).toFixed(1),gapB=(C-dashB).toFixed(1);
  const offB=(-C*pa).toFixed(1);
  return '<div class="emp-rs-donut-wrap">'+
    '<div class="emp-rs-donut-box" role="img" aria-label="'+_empRsEsc(etqA)+': '+(Number(a)||0)+'. '+_empRsEsc(etqB)+': '+(Number(b)||0)+'.">'+
    '<svg class="emp-rs-donut" viewBox="0 0 100 100" aria-hidden="true">'+
    '<circle class="emp-rs-donut-pista" cx="50" cy="50" r="'+R+'"/>'+
    '<circle class="emp-rs-donut-a" cx="50" cy="50" r="'+R+'" stroke-dasharray="'+dashA+' '+gapA+'" stroke-dashoffset="0"/>'+
    (pb>0.001?'<circle class="emp-rs-donut-b" cx="50" cy="50" r="'+R+'" stroke-dasharray="'+dashB+' '+gapB+'" stroke-dashoffset="'+offB+'"/>':'')+
    '</svg><div class="emp-rs-donut-centro"><strong>'+tot+'</strong><span>ofertas</span></div></div>'+
    '<ul class="emp-rs-leyenda">'+
    '<li><span class="emp-rs-swatch emp-rs-swatch-a"></span>'+_empRsEsc(etqA)+' <b>'+(Number(a)||0)+'</b></li>'+
    '<li><span class="emp-rs-swatch emp-rs-swatch-b"></span>'+_empRsEsc(etqB)+' <b>'+(Number(b)||0)+'</b></li>'+
    '</ul></div>';
}

/** Barras horizontales: [{etiqueta,n,clase?}]. */
function tpEmpBarras(filas,opciones){
  const lista=(filas||[]).filter(f=>f&&(Number(f.n)||0)>=0);
  if(!lista.length)return '<p class="emp-rs-vacio">'+(opciones&&opciones.vacio||'Todavía no hay datos para este gráfico.')+'</p>';
  const max=Math.max(1,Math.max.apply(null,lista.map(f=>Number(f.n)||0)));
  return '<ul class="emp-rs-barras" role="list">'+lista.map(f=>{
    const n=Number(f.n)||0,pct=Math.round(100*n/max);
    const cls=f.clase?' emp-rs-bar-'+f.clase:'';
    return '<li class="emp-rs-bar-fila">'+
      '<div class="emp-rs-bar-meta"><span class="emp-rs-bar-etq">'+_empRsEsc(f.etiqueta)+'</span><b class="emp-rs-bar-n">'+n+'</b></div>'+
      '<div class="emp-rs-bar-pista" role="img" aria-label="'+_empRsEsc(f.etiqueta)+': '+n+'"><span class="emp-rs-bar-relleno'+cls+'" style="width:'+pct+'%"></span></div>'+
      '</li>';
  }).join('')+'</ul>';
}

function tpEmpPanel(titulo,sub,cuerpo){
  return '<section class="emp-rs-panel"><h3 class="emp-rs-panel-tit">'+_empRsEsc(titulo)+'</h3>'+
    (sub?'<p class="emp-rs-panel-sub">'+_empRsEsc(sub)+'</p>':'')+cuerpo+'</section>';
}

function tpResumenEmpresa(){
  const meta=document.getElementById('empRsMeta');
  const box=document.getElementById('empRsGraficos');
  if(!box)return;

  const mias=(typeof TPOfertas!=='undefined'&&TPOfertas.mias)||[];
  const cands=(typeof CANDIDATES!=='undefined'?CANDIDATES:[]).filter(c=>c&&c._real!==false);
  const poolOk=typeof TPPool!=='undefined'&&TPPool.estado==='ok';
  const poolCargando=typeof TPPool!=='undefined'&&TPPool.estado==='cargando';
  const of=tpEmpOfertasEstado(mias);
  const bandas=poolOk?tpEmpBandasPool(cands):null;
  const encaje=tpEmpEncajePorOferta(mias,poolOk);
  const busq=poolOk?tpEmpBusquedaPool(cands):null;
  const unlocks=cands.filter(c=>c._unlocked).length;
  const gratis=(typeof TPGratis!=='undefined'&&TPGratis.datos)||null;

  // KPIs (misma lógica que antes, centralizada aquí).
  const pon=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  pon('empStatOffers',tpCompany?String(of.abiertas):'—');
  pon('empStatPool',poolOk?String(typeof TPPool.total==='number'?TPPool.total:cands.length):'—');
  pon('empStatTop',poolOk&&bandas?String(bandas.muy_bueno):'—');
  pon('empStatUnlocks',String(unlocks));

  if(meta){
    if(poolCargando)meta.textContent='Cargando el pool…';
    else if(typeof TPPool!=='undefined'&&TPPool.estado==='error')meta.textContent='El pool no se ha podido cargar.';
    else meta.textContent='Actualizado '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  }

  let html='';
  html+=tpEmpPanel('Tus ofertas','Abiertas frente a cerradas.',
    of.total?tpEmpDonut(of.abiertas,of.cerradas,'Abiertas','Cerradas')
      :'<p class="emp-rs-vacio">Todavía no has publicado ninguna oferta. Usa «Publicar una oferta» para empezar.</p>');

  if(poolOk&&bandas){
    const filas=[
      {etiqueta:'Muy bueno (≥ 80)',n:bandas.muy_bueno,clase:'muy'},
      {etiqueta:'Bueno (60–79)',n:bandas.bueno,clase:'bueno'},
      {etiqueta:'Aceptable (40–59)',n:bandas.aceptable,clase:'acept'},
      {etiqueta:'Insuficiente (< 40)',n:bandas.insuficiente,clase:'insuf'},
      {etiqueta:'Sin skills aún',n:bandas.sin,clase:'sin'}
    ].filter(f=>f.n>0);
    html+=tpEmpPanel('Nivel del pool','Mejor skill demostrada de cada candidato visible.',
      tpEmpBarras(filas,{vacio:'El pool está vacío por ahora.'}));
  }else if(poolCargando){
    html+=tpEmpPanel('Nivel del pool','','<p class="emp-rs-vacio">Cargando candidatos del pool…</p>');
  }else{
    html+=tpEmpPanel('Nivel del pool','','<p class="emp-rs-vacio">No se ha podido cargar el pool. Entra en Talento y reintenta.</p>');
  }

  html+=tpEmpPanel('Quién encaja con tus ofertas abiertas','Candidatos del pool con encaje del 50 % o más.',
    of.abiertas
      ?(encaje.length?tpEmpBarras(encaje.map(e=>({etiqueta:e.titulo,n:e.n})),{vacio:'Ningún candidato del pool llega al 50 % de encaje con tus ofertas abiertas.'})
        :'<p class="emp-rs-vacio">'+(poolOk?'Ningún candidato del pool llega al 50 % de encaje con tus ofertas abiertas.':'Carga el pool para ver el encaje.')+'</p>')
      :'<p class="emp-rs-vacio">No tienes ofertas abiertas. Publica o reabre una para ver el encaje.</p>');

  if(poolOk&&busq){
    const filasB=[
      {etiqueta:'Busca activamente',n:busq.activa,clase:'muy'},
      {etiqueta:'Abierto a propuestas',n:busq.abierta,clase:'bueno'},
      {etiqueta:'No busca ahora',n:busq.no,clase:'sin'},
      {etiqueta:'Sin indicar',n:busq.sin,clase:'acept'}
    ].filter(f=>f.n>0);
    html+=tpEmpPanel('Situación de búsqueda','Lo que el candidato ha declarado (open to work).',
      tpEmpBarras(filasB,{vacio:'Nadie del pool ha indicado aún su situación de búsqueda.'}));
  }

  // Pie de desbloqueos / gratis
  let pie='Has desbloqueado <strong>'+unlocks+'</strong> contacto'+(unlocks===1?'':'s')+' en esta cuenta.';
  if(gratis&&gratis.restantes!=null)pie+=' Te quedan <strong>'+gratis.restantes+'</strong> desbloqueo'+(gratis.restantes===1?'':'s')+' gratis.';
  html+='<p class="emp-rs-pie">'+pie+'</p>';

  box.innerHTML=html;
}

// Sustituye el resumen numérico mínimo por el panel con gráficos.
tpActividadEmpresa=function(){tpResumenEmpresa();};
