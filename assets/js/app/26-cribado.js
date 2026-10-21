// TalentPact · 26-cribado
// Preguntas de cribado de la oferta (contrato y descarte) y «Me interesa esta
// empresa». Nadie queda descartado de forma automática: el candidato ve el aviso
// antes de enviar y la empresa lo ve marcado y decide (lib/cribado.js).
// Script clásico: ámbito global compartido (ver assets/js/README.md).

// Misma expresión que lib/cribado.js: el servidor descarta estas preguntas.
var TP_CRIBADO_PROHIBIDO=/\b(edad|cu[aá]ntos a[nñ]os tienes|naciste|sexo|g[eé]nero|nacionalidad|origen [eé]tnico|raza|embaraz|hijos|casad[oa]|estado civil|religi[oó]n|discapacidad|enfermedad|sindica|ideolog|pol[ií]tic)/i;
var TP_CRIBADO_MAX=6;
var TP_CRIBADO_GRUPO={contrato:'Contrato',requisito:'Descarte'};

// ═══ Empresa: preguntas al publicar ═══
var TPCribadoOferta={
  lista:[],
  reset(){TPCribadoOferta.lista=[];TPCribadoOferta.pintar();},
  paraEnviar(){return TPCribadoOferta.lista.filter(q=>q.texto.trim().length>=5&&!TP_CRIBADO_PROHIBIDO.test(q.texto)).slice(0,TP_CRIBADO_MAX)
    .map(q=>({grupo:q.grupo,texto:q.texto.trim(),esperada:q.esperada,eliminatoria:!!q.eliminatoria&&!!q.esperada}));},
  /** Sugerencias a partir de lo que ya pone el formulario (contrato, jornada, modalidad, salario). */
  sugeridas(){
    const v=id=>((document.getElementById(id)||{}).value||'').trim();
    const contrato=v('pj-contrato'),jornada=v('pj-jornada'),modo=v('pj-mode'),ciudad=v('pj-city');
    const sMin=Number(v('pj-sal-min'))||0,sMax=Number(v('pj-sal-max'))||0;
    const s=[];
    const c=(texto)=>s.push({grupo:'contrato',texto,esperada:'si',eliminatoria:false});
    if(contrato)c('¿Aceptas un contrato '+({indefinido:'indefinido',temporal:'temporal',freelance:'como freelance o autónomo',practicas:'de prácticas'}[contrato]||contrato)+'?');
    if(jornada)c('¿Puedes trabajar '+({completa:'a jornada completa',parcial:'a media jornada',horas:'por horas, con horario flexible',practicas:'en horario de prácticas'}[jornada]||jornada)+'?');
    if(modo==='presencial'||modo==='hibrido')c('¿Puedes trabajar '+(modo==='presencial'?'de forma presencial':'en modalidad híbrida')+(ciudad?' en '+ciudad:'')+'?');
    if(sMin||sMax)c('¿La banda salarial de '+(sMin&&sMax?tpK(sMin)+' a '+tpK(sMax):sMax?'hasta '+tpK(sMax):'desde '+tpK(sMin))+' brutos al año encaja con lo que buscas?');
    c('¿Puedes incorporarte en el plazo de un mes?');
    const r=(texto)=>s.push({grupo:'requisito',texto,esperada:'si',eliminatoria:true});
    r('¿Tienes permiso para trabajar en España?');
    r('¿Tienes carné de conducir B?');
    r('¿Puedes viajar por trabajo cuando el puesto lo requiera?');
    const ya=new Set(TPCribadoOferta.lista.map(q=>q.texto.toLowerCase()));
    return s.filter(q=>!ya.has(q.texto.toLowerCase()));
  },
  anadir(i){
    if(TPCribadoOferta.lista.length>=TP_CRIBADO_MAX){toast('Como máximo '+TP_CRIBADO_MAX+' preguntas de cribado.');return;}
    const q=i==null?{grupo:'requisito',texto:'',esperada:'si',eliminatoria:false}:TPCribadoOferta._sug[i];
    if(!q)return;
    TPCribadoOferta.lista.push(Object.assign({},q));TPCribadoOferta.pintar();
    if(i==null){const el=document.getElementById('pjCrib'+(TPCribadoOferta.lista.length-1));if(el)el.focus();}
  },
  quitar(i){TPCribadoOferta.lista.splice(i,1);TPCribadoOferta.pintar();},
  cambiar(i,k,v){
    const q=TPCribadoOferta.lista[i];if(!q)return;
    q[k]=v;
    if(k==='esperada'&&!v)q.eliminatoria=false;
    if(k==='texto'){const av=document.getElementById('pjCribAviso'+i);if(av)av.hidden=!TP_CRIBADO_PROHIBIDO.test(v);TPCribadoOferta.contar();return;}
    TPCribadoOferta.pintar();
  },
  contar(){const n=document.getElementById('pjCuentaCrib');if(n)n.textContent=TPCribadoOferta.paraEnviar().length+' de '+TP_CRIBADO_MAX;},
  pintar(){
    const box=document.getElementById('pjCribado');if(!box){return;}
    const L=TPCribadoOferta.lista;
    TPCribadoOferta._sug=TPCribadoOferta.sugeridas();
    const fila=(q,i)=>'<div class="pj-crib-fila">'+
      '<label class="sr-only" for="pjCrib'+i+'">Pregunta '+(i+1)+'</label><input type="text" class="search-bar" id="pjCrib'+i+'" maxlength="200" value="'+escHtml(q.texto)+'" placeholder="Pregunta de sí o no" oninput="TPCribadoOferta.cambiar('+i+',\'texto\',this.value)">'+
      '<div class="pj-crib-opc">'+
        '<label>Tipo <select onchange="TPCribadoOferta.cambiar('+i+',\'grupo\',this.value)">'+Object.entries(TP_CRIBADO_GRUPO).map(([k,t])=>'<option value="'+k+'"'+(q.grupo===k?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
        '<label>Respuesta que buscas <select onchange="TPCribadoOferta.cambiar('+i+',\'esperada\',this.value)"><option value="si"'+(q.esperada==='si'?' selected':'')+'>Sí</option><option value="no"'+(q.esperada==='no'?' selected':'')+'>No</option><option value=""'+(!q.esperada?' selected':'')+'>Cualquiera</option></select></label>'+
        '<label class="tp-rs-check"><input type="checkbox"'+(q.eliminatoria?' checked':'')+(q.esperada?'':' disabled')+' onchange="TPCribadoOferta.cambiar('+i+',\'eliminatoria\',this.checked)"> Eliminatoria</label>'+
        '<button type="button" class="pj-enlace" onclick="TPCribadoOferta.quitar('+i+')">Quitar</button>'+
      '</div><p class="pj-crib-aviso" id="pjCribAviso'+i+'"'+(TP_CRIBADO_PROHIBIDO.test(q.texto)?'':' hidden')+'>Esta pregunta toca datos que no se pueden usar para cribar (edad, origen, familia, salud, creencias…). No se publicará.</p></div>';
    const sug=TPCribadoOferta._sug;
    const grupoSug=g=>sug.map((q,i)=>q.grupo===g?'<button type="button" class="tp-rs-mas" onclick="TPCribadoOferta.anadir('+i+')">+ '+escHtml(q.texto)+'</button>':'').join('');
    box.innerHTML=(L.length?L.map(fila).join(''):'<p class="pj-ayuda">Todavía no hay preguntas. Añade alguna de las sugeridas o escribe la tuya.</p>')+
      (L.length<TP_CRIBADO_MAX?'<div class="pj-crib-sug"><span class="tp-rs-et">Contrato</span>'+grupoSug('contrato')+'<span class="tp-rs-et">Descarte</span>'+grupoSug('requisito')+
        '<button type="button" class="btn btn-outline btn-sm" onclick="TPCribadoOferta.anadir()">Escribir una pregunta propia</button></div>':'');
    TPCribadoOferta.contar();
  }
};

// ═══ Candidato: responder al postularse ═══
var TPCribado={
  porOferta:{},           // jobId → ['si'|'no', …] ya confirmadas
  listo(id){return !!TPCribado.porOferta[id];},
  respuestas(id){return TPCribado.porOferta[id]||[];}
};
function tpPintarCribado(j){
  const box=document.getElementById('exContent');
  const qs=(j&&j.screening)||[];
  if(!box||!qs.length)return;
  const fila=(q,i)=>'<fieldset class="tp-crib-q" id="tpCribQ'+i+'"><legend>'+escHtml(q.texto)+(q.eliminatoria?' <span class="tp-crib-elim">Requisito</span>':'')+'</legend>'+
    '<div class="tp-crib-resp"><label><input type="radio" name="tpCrib'+i+'" value="si" onchange="tpCribadoRevisar('+i+')"> Sí</label><label><input type="radio" name="tpCrib'+i+'" value="no" onchange="tpCribadoRevisar('+i+')"> No</label></div>'+
    '<p class="tp-crib-aviso" id="tpCribAviso'+i+'" hidden>Esta empresa pide «'+(q.esperada==='si'?'Sí':'No')+'» aquí. Puedes postularte igualmente: verá que no cumples este requisito y decidirá una persona.</p></fieldset>';
  const grupo=(g,tit)=>{const xs=qs.map((q,i)=>[q,i]).filter(([q])=>q.grupo===g);return xs.length?'<div class="apply-section-title">'+tit+'</div>'+xs.map(([q,i])=>fila(q,i)).join(''):'';};
  box.innerHTML='<div class="apply-screen"><p class="u-fs-peq u-c-slate-500 u-mb-16">La empresa hace estas preguntas a todas las personas que se postulan. Responde con sinceridad: lo que contestes se guarda con tu postulación.</p>'+
    grupo('contrato','Condiciones del puesto')+grupo('requisito','Requisitos')+
    '<div class="u-d-flex u-gap-10 u-mt-16"><button class="btn btn-primary" onclick="tpCribadoSeguir()">Continuar</button><button class="btn btn-outline" onclick="closeJobModal()">Cancelar</button></div></div>';
}
function tpCribadoLeer(){
  const qs=(activeJob&&activeJob.screening)||[];
  return qs.map((_,i)=>{const r=document.querySelector('input[name="tpCrib'+i+'"]:checked');return r?r.value:'';});
}
function tpCribadoRevisar(i){
  const q=((activeJob&&activeJob.screening)||[])[i];if(!q)return;
  const r=tpCribadoLeer()[i];
  const av=document.getElementById('tpCribAviso'+i);
  if(av)av.hidden=!(q.eliminatoria&&q.esperada&&r&&r!==q.esperada);
}
function tpCribadoSeguir(){
  const j=activeJob,rs=tpCribadoLeer();
  const falta=rs.findIndex(r=>!r);
  if(falta>=0){toast('Responde todas las preguntas antes de continuar.');const el=document.getElementById('tpCribQ'+falta);if(el)el.scrollIntoView({block:'center'});return;}
  TPCribado.porOferta[j.id]=rs;
  applyDirectly(false);
}

// ═══ Candidato: «Me interesa esta empresa» ═══
function tpInteresRef(j){return j&&j.companyInfo&&j.companyInfo.ref?String(j.companyInfo.ref):'';}
function tpInteresa(ref){return !!ref&&(TPEmpleo.prefs().interes||[]).includes(ref);}
function tpInteresBoton(j){
  const ref=tpInteresRef(j);
  if(!ref||tpCompany)return '';
  const on=tpInteresa(ref);
  return '<button type="button" class="btn btn-outline btn-sm tp-interes'+(on?' activo':'')+'" aria-pressed="'+on+'" onclick="tpInteresCambiar(\''+escHtml(ref)+'\',this)">'+(on?'Te interesa esta empresa':'Me interesa esta empresa')+'</button>';
}
async function tpInteresCambiar(ref,btn){
  if(!tpUser){closeJobModal();openAuth('candidate');return;}
  const p=TPEmpleo.prefs();
  const i=p.interes.indexOf(ref);
  if(i>=0)p.interes.splice(i,1);else p.interes.unshift(ref);
  p.interes=p.interes.slice(0,50);
  TP.save('prefs:empleo',p);
  if(btn){btn.disabled=true;}
  try{
    await TPCloud.saveMeta({empleo:p});
    await TPCloud._postAuth('save-profile',{empleo:p});
    toast(i>=0?'Ya no aparece tu interés por esta empresa.':'La empresa verá en su buscador que te interesa, sin saber quién eres.','ok');
  }catch(e){toast('No se ha podido guardar: '+(e.message||e));}
  if(btn){btn.disabled=false;const on=tpInteresa(ref);btn.classList.toggle('activo',on);btn.setAttribute('aria-pressed',String(on));btn.textContent=on?'Te interesa esta empresa':'Me interesa esta empresa';}
}
(function(){
  const _open=openJob;
  openJob=function(id){
    const r=_open.apply(this,arguments);
    const j=activeJob;
    if(j)delete TPCribado.porOferta[j.id];
    const cab=document.querySelector('#exContent .apply-company');
    const b=j&&tpInteresBoton(j);
    if(cab&&b)cab.insertAdjacentHTML('beforeend','<div class="tp-interes-box">'+b+'</div>');
    // Aviso de que la oferta tiene preguntas de cribado.
    const qs=(j&&j.screening)||[];
    const sum=document.querySelector('#exContent .apply-summary');
    if(sum&&qs.length)sum.insertAdjacentHTML('afterend','<p class="tp-crib-nota">Al postularte responderás '+(qs.length===1?'1 pregunta':qs.length+' preguntas')+' de sí o no de la empresa'+(qs.some(q=>q.eliminatoria)?', algunas sobre requisitos del puesto':'')+'.</p>');
    return r;
  };
})();

// ═══ Empresa: respuestas en «Ver candidatos» ═══
(function(){
  const _show=showOfferCandidates;
  showOfferCandidates=async function(jobId){
    const r=await _show.apply(this,arguments);
    const list=document.getElementById('empOfferCandList');
    if(!list)return r;
    list.querySelectorAll('.offer-cand-card').forEach(card=>{
      const ref=card.dataset.ref;if(!ref)return;
      const app=(TPApps.byJob[jobId]||[]).find(x=>String(x.candidateRef)===String(ref));
      const rs=app&&app.screeningAnswers||[];
      let box=card.querySelector('.tp-crib-res');
      if(!rs.length){if(box)box.remove();return;}
      if(!box){box=document.createElement('div');box.className='tp-crib-res tp-culture-qs u-mt-8';(card.querySelector('.oc-actions')||card).insertAdjacentElement('beforebegin',box);}
      const no=app.noCumple||[];
      const si=t=>t==='si'?'Sí':t==='no'?'No':'—';
      box.innerHTML='<div class="tp-crib-cab"><span class="u-fs-micro u-fw-600">Cribado</span>'+(no.length?tpChip('No cumple '+(no.length===1?'1 requisito':no.length+' requisitos'),'error'):tpChip('Cumple el cribado','ok'))+'</div>'+
        '<ul class="tp-crib-lista">'+rs.map(x=>'<li class="'+(x.eliminatoria&&!x.cumple?'ko':'')+'"><span>'+escHtml(x.texto)+'</span><strong>'+si(x.respuesta)+'</strong></li>').join('')+'</ul>'+
        (no.length&&app.status!=='descartado'?'<button type="button" class="btn btn-outline btn-sm" data-crib-desc="1">Descartar por cribado</button>':'');
      const b=box.querySelector('[data-crib-desc]');
      if(b)b.onclick=()=>TPApps.set(jobId,ref,'descartado','No cumple: '+no.join(' / '));
    });
    return r;
  };
})();
