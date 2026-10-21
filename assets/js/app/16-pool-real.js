// TalentPact · 16-pool-real
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.

// ═══════════════════════════════════════════════════════════════════════════
// TPPool — pool de talento real (Supabase) y contacto real tras el pago
//
// · get-talent-pool: candidatos reales y anónimos (alias, notas, condiciones,
//   integridad).
// · get-contact: el contacto real, solo si esta empresa tiene un desbloqueo
//   pagado de ese candidato. Lo decide el servidor, no este código.
// ═══════════════════════════════════════════════════════════════════════════
var TPPool={
  estado:'sin cargar',   // sin cargar | cargando | ok | sin sesion | error
  error:null,
  total:0,
  _promesa:null,
  esUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''));},
  esReal(c){return !!(c&&(c._real||TPPool.esUuid(c.id)));},
  alias(c){return c&&c.alias?c.alias:('Candidato '+tpAliasCand(c));},
  async cargar(){
    if(TPPool._promesa)return TPPool._promesa;
    // Se mira el token y no `tpCompany`: al volver de Stripe la sesión aún se
    // está restaurando y la variable todavía no está puesta.
    if(!(await TPCloud.accessToken())){TPPool.estado='sin sesion';return;}
    TPPool.estado='cargando';
    TPPool._promesa=(async()=>{
      const r=await TPCloud._postAuth('get-talent-pool',{});
      if(!r||r.error){TPPool.estado='error';TPPool.error=(r&&(r.details||r.error))||'Sin respuesta del servidor';return;}
      // Sustituye la carga anterior.
      for(let k=CANDIDATES.length-1;k>=0;k--)if(CANDIDATES[k]._real)CANDIDATES.splice(k,1);
      const reales=(r.candidates||[]).map(f=>({
        id:f.ref,i:f.i,alias:f.alias,sector:f.sector,score:f.score,skills:f.skills||[],
        personas:f.personas||[],todas:f.todas||[],
        cond:f.cond||{},integ:f.integ,verified:!!f.verified,retos:f.retos,_real:true,acceptsContact:f.acceptsContact!==false,
        interesa:!!f.interesa,postulado:Number(f.postulado)||0,etapa:f.etapa||'',cv:!!f.cv,
        _unlocked:Pay.paidRefs.has(String(f.ref))
      }));
      CANDIDATES.unshift(...reales);
      if(r.gratis&&typeof TPGratis!=='undefined')TPGratis.poner(r.gratis);
      TPPool.total=reales.length;TPPool.estado='ok';TPPool.error=null;
      if(typeof tpActividadEmpresa==='function')tpActividadEmpresa();
    })().catch(e=>{TPPool.estado='error';TPPool.error=e.message||String(e);}).finally(()=>{TPPool._promesa=null;});
    return TPPool._promesa;
  },
  aviso(){
    if(TPPool.estado==='cargando')return 'Cargando candidatos…';
    if(TPPool.estado==='sin sesion')return 'Inicia sesión con tu cuenta de empresa para ver el pool de talento.';
    if(TPPool.estado==='error')return 'No se pudo cargar el pool de talento. Vuelve a intentarlo en unos minutos.';
    if(TPPool.estado==='ok')return TPPool.total+' candidato'+(TPPool.total===1?'':'s')+' en el pool';
    return '';
  }
};

// Al abrir el panel de empresa se trae el pool real y se repinta.
(function(){
  const _open=openDashEmp;
  openDashEmp=function(){
    const r=_open.apply(this,arguments);
    TPPool.cargar().then(()=>{try{renderEmpPool();}catch(e){}});
    return r;
  };
})();

// Pagar: el nombre del candidato es su alias, no un número al azar, y si ya
// está desbloqueado se enseña la ficha sin volver a cobrar.
(function(){
  const _unlock=unlockContact;
  unlockContact=function(candId){
    const c=CANDIDATES.find(p=>String(p.id)===String(candId));
    if(c&&c._unlocked){showContactCard(c);return;}
    const r=_unlock.apply(this,arguments);
    if(c){const n=document.getElementById('payName');if(n)n.textContent=TPPool.alias(c);}
    return r;
  };
})();

// Ficha de contacto: siempre la real, pedida a get-contact.
(function(){
  const _show=showContactCard;
  const fila=(k,v)=>'<div class="ct-row"><span class="ct-k">'+k+'</span><span class="ct-v">'+(v?escHtml(v):'<span class="u-c-slate-400">No indicado</span>')+'</span></div>';
  showContactCard=async function(c){
    if(!TPPool.esReal(c))return _show(c);
    const box=document.getElementById('contactFields');
    _lastContact=null;
    box.innerHTML='<div class="tp-integrity-note">Cargando el contacto…</div>';
    const b=document.getElementById('contactCopyBtn');if(b)b.textContent='Copiar datos de contacto';
    document.getElementById('contactModal').classList.add('open');
    let r;
    try{r=await TPCloud._postAuth('get-contact',{candidateRef:String(c.id)});}
    catch(e){r={error:'Error de red: '+(e.message||e)};}
    if(!r||r.error){
      const msg={not_unlocked:'Este contacto no está desbloqueado por tu cuenta.',candidate_deleted:'El candidato ha eliminado su cuenta: sus datos ya no existen.'}[r&&r.code]||(r&&r.error)||'No se pudo obtener el contacto.';
      box.innerHTML='<div class="tp-integrity-note warn">'+escHtml(msg)+'</div>';
      return;
    }
    const d=r.contact||{};
    _lastContact={name:d.name||'',email:d.email||'',phone:d.phone||'',linkedin:d.linkedin||''};
    box.innerHTML='<div class="tp-integrity-note u-bg-emerald-50 u-c-emerald-600 u-b-1-solid-emerald-100">Contacto real de '+escHtml(TPPool.alias(c))+
      (r.unlockedAt?' · desbloqueado el '+escHtml(new Date(r.unlockedAt).toLocaleDateString('es-ES')):'')+'</div>'+
      fila('Nombre',d.name)+fila('Email',d.email)+fila('Teléfono',d.phone)+fila('LinkedIn',d.linkedin)+
      (typeof tpCvFilaContacto==='function'?tpCvFilaContacto(c,r.cv):'');
  };
})();

// Copiar: sin líneas "null" cuando falta algún dato.
copyContact=function(){
  if(!_lastContact)return;
  const d=_lastContact;
  const txt=[d.name,d.email,d.phone,d.linkedin].filter(Boolean).join('\n');
  const b=document.getElementById('contactCopyBtn');
  const done=function(){if(b){b.textContent='✓ Copiado';setTimeout(function(){b.textContent='Copiar datos de contacto';},1600);}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done).catch(done);
  else done();
};

// Vuelta de Stripe: si el candidato pagado es real y el pool aún no se ha
// cargado (la página se acaba de recargar), se enseña igualmente su contacto.
(function(){
  const _volver=handlePaymentReturn;
  handlePaymentReturn=async function(){
    const qs=new URLSearchParams(location.search);
    if(qs.get('pay')!=='success')return _volver.apply(this,arguments);
    await TPPool.cargar();
    // Se captura la respuesta de Pay.sync para saber qué candidato se pagó.
    let pago=null;const _sync=Pay.sync;
    Pay.sync=async function(){const r=await _sync.apply(Pay,arguments);pago=r;return r;};
    try{await _volver.apply(this,arguments);}finally{Pay.sync=_sync;}
    const abierto=document.getElementById('contactModal').classList.contains('open');
    if(!abierto&&pago&&pago.paid&&TPPool.esUuid(pago.candidateRef)){
      const c=CANDIDATES.find(x=>String(x.id)===String(pago.candidateRef))||{id:pago.candidateRef,alias:'el candidato',_real:true};
      c._unlocked=true;showContactCard(c);
    }
  };
})();

// El candidato: sus condiciones de empleo y su visibilidad viajan a su perfil
// en Supabase, que es de donde las lee el pool real.
(function(){
  const _guardar=TPEmpleo.guardarDesdeAjustes;
  TPEmpleo.guardarDesdeAjustes=async function(){
    await _guardar.apply(this,arguments);
    if(tpUser){try{await TPCloud._postAuth('save-profile',{empleo:TPEmpleo.prefs()});}catch(e){console.warn('[TP] empleo → perfil',e);}}
  };
  const _setPref=setPref;
  setPref=async function(role,key,val){
    const r=await _setPref.apply(this,arguments);
    // Visibilidad y consentimiento a ser contactado viajan al perfil: los
    // comprueba el servidor antes de cobrar y antes de entregar un contacto.
    if(role==='cand'&&tpUser&&(key==='poolVisible'||key==='allowContact')){
      try{await TPCloud._postAuth('save-profile',key==='poolVisible'?{poolVisible:!!val}:{allowContact:!!val});}
      catch(e){console.warn('[TP] preferencia → perfil',e);}
    }
    return r;
  };
})();

// ═══════════════════════════════════════════════════════════════════════════
// TPRanking — ranking real: posición anónima entre los candidatos del pool.
// Quien se oculta del pool tampoco aparece aquí. El propio candidato se
// reconoce por su alias (las 4 primeras cifras de su id), igual que el servidor.
// ═══════════════════════════════════════════════════════════════════════════
var TPRanking={
  SECTORES:{IT:['it','dev'],Design:['diseñ','design'],Finance:['finan'],Marketing:['marketing'],Data:['data'],Business:['business','negocio'],RRHH:['rrhh','recursos']},
  miAlias(){return tpUser?'Candidato #'+String(tpUser.id||'').replace(/-/g,'').slice(0,4).toUpperCase():null;},
  enSector(c,sector){if(!sector||sector==='all')return true;const s=tpNorm(c.sector);return (TPRanking.SECTORES[sector]||[sector.toLowerCase()]).some(k=>s.includes(k));},
  lista(sector){return CANDIDATES.filter(c=>c._real&&TPRanking.enSector(c,sector)).sort((a,b)=>b.score-a.score);},
  posicionTexto(){const a=TPRanking.miAlias();if(!a||TPPool.estado!=='ok')return '';const l=TPRanking.lista('all');const i=l.findIndex(c=>c.alias===a);return i<0?'':'#'+(i+1)+' de '+l.length;}
};
renderRanking=function(sector,btn){
  if(btn){document.querySelectorAll('#rankingSectorFilters .filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
  const box=document.getElementById('rankingList');if(!box)return;
  const msg=t=>'<div class="tp-empty">'+t+'</div>';
  if(!tpUser){box.innerHTML=msg('Inicia sesión para ver tu posición entre los candidatos del pool.');return;}
  if(TPPool.estado==='error'){
    // Antes se quedaba en «No se pudo cargar» sin forma de reintentar.
    const s=String(sector||'all').replace(/[^\w-]/g,'');
    box.innerHTML=tpVacio({error:true,icono:'alert',titulo:'No se ha podido cargar el ranking',texto:'Puede ser un problema momentáneo. Tus notas no se han perdido.',acciones:[{txt:'Reintentar',accion:"TPPool.estado='sin cargar';renderRanking('"+s+"')"}]});
    return;
  }
  if(TPPool.estado!=='ok'){
    box.innerHTML=tpEsqueleto(5);
    // Se vuelve a pintar acabe como acabe: antes, sin token, se quedaba en «Cargando…».
    TPPool.cargar().then(()=>{
      if(TPPool.estado==='ok'||TPPool.estado==='error')renderRanking(sector);
      else box.innerHTML=msg('Inicia sesión para ver tu posición entre los candidatos del pool.');
    });
    return;
  }
  const yo=TPRanking.miAlias();
  const lista=TPRanking.lista(sector);
  if(!lista.length){box.innerHTML=msg('Todavía no hay candidatos con notas en este sector.');return;}
  box.innerHTML=lista.slice(0,50).map((c,i)=>{
    const es=c.alias===yo;
    return `<div class="ranking-row ${es?'is-you':''}"><div class="ranking-pos ${i<3?['gold','silver','bronze'][i]:'normal'}">${i+1}</div>
      <div class="ranking-name">${es?'<strong>Tú</strong>':escHtml(c.alias)} <span>${escHtml(c.sector)} · ${c.retos||c.skills.length} skills${c.verified?' · verificado':''}</span></div>
      <div class="ranking-score">${tpBandaHtml(c.score,es)}</div></div>`;
  }).join('');
};
