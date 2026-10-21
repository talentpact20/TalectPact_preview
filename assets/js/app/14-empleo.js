// TalentPact · 14-empleo
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// TPEmpleo — preferencias del candidato y condiciones de cada oferta
// ═══════════════════════════════════════════════════════════════════════════
var TPEmpleo={
  filtro:{jornada:'',modalidad:'',soloEncaje:false},
  // busqueda: «open to work» (activa | abierta | no). interes: ids de empresa que le interesan.
  vacio(){return {jornadas:[],modalidades:[],contratos:[],salMin:null,disponibilidad:'',ciudad:'',horas:null,reubicacion:false,busqueda:'',interes:[]};},
  prefs(){
    const m=(tpUser&&tpUser.user_metadata&&tpUser.user_metadata.empleo)||null;
    return Object.assign(TPEmpleo.vacio(),m||TP.load('prefs:empleo',null)||{});
  },
  tiene(p){p=p||TPEmpleo.prefs();return !!(p.jornadas.length||p.modalidades.length||p.contratos.length||p.salMin||p.ciudad);},
  // Encaje de una oferta con las preferencias: cada condición es ✓, ✕ o sin dato.
  encaje(j,p){
    p=p||TPEmpleo.prefs();const out=[];
    const add=(id,txt,ok)=>out.push({id,txt,ok});
    if(j.jornada)add('jornada',TP_COND.jornadas[j.jornada]||j.jornada,p.jornadas.length?p.jornadas.includes(j.jornada):null);
    if(j.modalidad){
      let ok=p.modalidades.length?p.modalidades.includes(j.modalidad):null;
      // Presencial o híbrido en otra ciudad no encaja salvo que aceptes mudarte.
      if(ok!==false&&j.modalidad!=='remoto'&&p.ciudad&&j.ubicacion&&!p.reubicacion){
        ok=tpNorm(p.ciudad)===tpNorm(j.ubicacion);
      }
      add('modalidad',(TP_COND.modalidades[j.modalidad]||j.modalidad)+(j.ubicacion&&j.modalidad!=='remoto'?' · '+j.ubicacion:''),ok);
    }
    if(j.contrato)add('contrato',TP_COND.contratos[j.contrato]||j.contrato,p.contratos.length?p.contratos.includes(j.contrato):null);
    if(j.salMin||j.salMax){
      const t=j.salMin&&j.salMax?tpK(j.salMin)+'–'+tpK(j.salMax):j.salMax?'hasta '+tpK(j.salMax):'desde '+tpK(j.salMin);
      add('salario',t,p.salMin?((j.salMax||j.salMin)>=p.salMin):null);
    }
    return out;
  },
  cumple(j,p){return TPEmpleo.encaje(j,p).every(c=>c.ok!==false);},
  filtrar(list){
    const f=TPEmpleo.filtro,p=TPEmpleo.prefs();
    return list.filter(j=>(!f.jornada||j.jornada===f.jornada)&&(!f.modalidad||j.modalidad===f.modalidad)&&(!f.soloEncaje||TPEmpleo.cumple(j,p)));
  },
  toolbar(){
    const f=TPEmpleo.filtro,opt=(m,v)=>Object.entries(m).map(([k,t])=>`<option value="${k}"${k===v?' selected':''}>${t}</option>`).join('');
    const sinPrefs=!TPEmpleo.tiene();
    return `<div class="tp-filterbar"><label>Jornada <select onchange="TPEmpleo.filtro.jornada=this.value;renderJobMatches()"><option value="">Todas</option>${opt(TP_COND.jornadas,f.jornada)}</select></label><label>Modalidad <select onchange="TPEmpleo.filtro.modalidad=this.value;renderJobMatches()"><option value="">Todas</option>${opt(TP_COND.modalidades,f.modalidad)}</select></label><label class="tp-filter-check"><input type="checkbox"${f.soloEncaje?' checked':''}${sinPrefs?' disabled':''} onchange="TPEmpleo.filtro.soloEncaje=this.checked;renderJobMatches()"> Solo las que encajan con mis condiciones</label>${sinPrefs?`<button class="btn btn-outline btn-sm" onclick="TPEmpleo.abrirAjustes()">Indicar mis preferencias →</button>`:''}</div>`;
  },
  abrirAjustes(){if(typeof openDashCand==='function'&&!document.getElementById('dashCandidate').classList.contains('open'))openDashCand();openSettings('cand');setTimeout(()=>{const s=document.getElementById('st-cand-empleo');if(s)s.scrollIntoView({behavior:'smooth',block:'start'});},150);},
  pintarAjustes(){
    const p=TPEmpleo.prefs();
    document.querySelectorAll('#st-cand-empleo .tp-chips').forEach(box=>{
      const k=box.dataset.pref,mapa={jornadas:TP_COND.jornadas,modalidades:TP_COND.modalidades,contratos:TP_COND.contratos}[k];
      box.innerHTML=Object.entries(mapa).map(([v,t])=>`<label class="tp-chip"><input type="checkbox" value="${v}"${p[k].includes(v)?' checked':''}><span>${t}</span></label>`).join('');
    });
    const d=document.getElementById('st-pref-disp');
    if(d&&d.options.length<=1)d.insertAdjacentHTML('beforeend',Object.entries(TP_COND.disponibilidad).map(([v,t])=>`<option value="${v}">${t}</option>`).join(''));
    const set=(id,v)=>{const e=document.getElementById(id);if(e){if(e.type==='checkbox')e.checked=!!v;else e.value=v==null?'':v;}};
    set('st-pref-busqueda',p.busqueda);set('st-pref-sal',p.salMin);set('st-pref-disp',p.disponibilidad);set('st-pref-city',p.ciudad);set('st-pref-hours',p.horas);set('st-pref-reloc',p.reubicacion);
  },
  async guardarDesdeAjustes(){
    const p=TPEmpleo.vacio();
    document.querySelectorAll('#st-cand-empleo .tp-chips').forEach(box=>{p[box.dataset.pref]=[...box.querySelectorAll('input:checked')].map(i=>i.value);});
    const num=id=>{const v=Number(document.getElementById(id).value);return Number.isFinite(v)&&v>0?Math.round(v):null;};
    p.salMin=num('st-pref-sal');p.horas=num('st-pref-hours');
    p.disponibilidad=document.getElementById('st-pref-disp').value;
    const bus=document.getElementById('st-pref-busqueda');p.busqueda=bus?bus.value:'';
    p.interes=(TPEmpleo.prefs().interes||[]).slice();
    p.ciudad=(document.getElementById('st-pref-city').value||'').trim().slice(0,80);
    p.reubicacion=document.getElementById('st-pref-reloc').checked;
    if(p.horas&&!p.jornadas.includes('parcial')&&!p.jornadas.includes('horas')){stMsg('st-pref-msg','err','Las horas semanales solo aplican a media jornada o por horas.');return;}
    TP.save('prefs:empleo',p);
    const done=btnBusy('st-pref-save','Guardando…');
    try{
      if(tpUser)await TPCloud.saveMeta({empleo:p});
      stMsg('st-pref-msg','ok',tpUser?'Preferencias guardadas.':'Guardadas en este navegador. Crea una cuenta para conservarlas.');
      syncMyPoolEntry();renderJobMatches();
    }catch(e){stMsg('st-pref-msg','err','No se pudieron guardar: '+authErrorText(e));}
    finally{done();}
  }
};
function tpNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}
function tpK(n){return Math.round(n/1000)+' k€';}
function tpCondChips(j,p){
  if(!j||!j.jornada&&!j.modalidad)return '';
  // p=null → vista pública: se muestran las condiciones, sin juzgar el encaje.
  const cs=TPEmpleo.encaje(j,p===undefined?TPEmpleo.prefs():(p||TPEmpleo.vacio()));
  return `<div class="tp-cond">${cs.map(c=>`<span class="tp-cond-chip${c.ok===true?' ok':c.ok===false?' ko':''}" title="${c.ok===true?'Encaja con tus preferencias':c.ok===false?'No encaja con tus preferencias':''}">${c.ok===true?'✓ ':c.ok===false?'✕ ':''}${escHtml(c.txt)}</span>`).join('')}</div>`;
}
/** Chips de condiciones del candidato para el pool empresa (ficha RRHH). */
function tpPoolCondChips(cd){
  cd=cd||{};
  const out=[];
  const add=t=>{if(t)out.push(String(t));};
  (cd.jornadas||[]).forEach(k=>add(TP_COND.jornadas[k]));
  (cd.modalidades||[]).forEach(k=>add(TP_COND.modalidades[k]));
  (cd.contratos||[]).forEach(k=>add(TP_COND.contratos[k]));
  if(cd.ciudad)add(cd.ciudad+(cd.reubicacion?' · acepta mudarse':''));
  if(cd.disponibilidad)add(TP_COND.disponibilidad[cd.disponibilidad]||cd.disponibilidad);
  if(cd.horas)add(cd.horas+' h/sem');
  if(cd.salMin)add('Desde '+tpK(cd.salMin));
  if(!out.length)return '<div class="tp-cond"><span class="tp-cond-chip muted">Sin condiciones indicadas</span></div>';
  return '<div class="tp-cond">'+out.slice(0,6).map(t=>`<span class="tp-cond-chip">${escHtml(t)}</span>`).join('')+'</div>';
}

// Al abrir Ajustes del candidato se pintan también las preferencias.
(function(){
  const _open=openSettings;
  openSettings=function(type){const r=_open.apply(this,arguments);if(type==='cand')TPEmpleo.pintarAjustes();return r;};
})();

// Pool de talento de la empresa, con filtros por condiciones e integridad.
// Sustituye a la tabla anterior, que además pintaba "#NaN" para el perfil propio.
var TP_POOL_FILTRO={jornada:'',modalidad:'',soloVerificados:false};
function tpAliasCand(c){
  let h=0;const s=String(c.id);for(let k=0;k<s.length;k++)h=(h*31+s.charCodeAt(k))>>>0;
  return '#'+(1000+h%9000);
}
function renderEmpPool(){
  const f=TP_POOL_FILTRO,opt=(m,v)=>Object.entries(m).map(([k,t])=>`<option value="${k}"${k===v?' selected':''}>${t}</option>`).join('');
  const lista=CANDIDATES.filter(c=>{const cd=c.cond||{};return(!f.jornada||(cd.jornadas||[]).includes(f.jornada))&&(!f.modalidad||(cd.modalidades||[]).includes(f.modalidad))&&(!f.soloVerificados||c.verified);});
  let h=`<div class="tp-filterbar"><label>Jornada <select onchange="TP_POOL_FILTRO.jornada=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.jornadas,f.jornada)}</select></label><label>Modalidad <select onchange="TP_POOL_FILTRO.modalidad=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.modalidades,f.modalidad)}</select></label><label class="tp-filter-check"><input type="checkbox"${f.soloVerificados?' checked':''} onchange="TP_POOL_FILTRO.soloVerificados=this.checked;renderEmpPool()"> Solo notas verificadas</label><span class="tp-filter-count">${lista.length} de ${CANDIDATES.length}</span></div>${window.TPPool&&TPPool.aviso()?`<div class="tp-pool-aviso">${escHtml(TPPool.aviso())}</div>`:''}`;
  h+='<table class="dash-table"><thead><tr><th>Candidato</th><th>Sector</th><th>Score</th><th>Condiciones</th><th>Integridad</th><th>Top Skills</th><th></th></tr></thead><tbody>';
  lista.forEach(c=>{
    const integ=c.integ?`<span class="tp-risk r-${c.integ}">${c.integ}</span>${c.verified?' <span class="tp-verified">✓</span>':''}`:'<span class="u-c-slate-400">—</span>';
    h+=`<tr><td><div class="u-d-flex u-ai-center u-gap-8"><div class="dash-avatar u-bg-emerald-100 u-c-emerald-600">${escHtml(c.i)}</div>${escHtml(String(c.alias||'').replace(/^Candidato /,''))}</div></td><td>${escHtml(c.sector)}</td><td><strong class="u-c-emerald-600">${c.score}</strong></td><td>${tpPoolCondChips(c.cond)}</td><td>${integ}</td><td>${c.skills.slice(0,2).map(s=>`<span class="job-tag">${escHtml(s.n)}: ${s.v}</span>`).join(' ')}</td><td><button class="btn btn-primary btn-sm" onclick="viewProfile('${escHtml(c.id)}')">${c._unlocked?'Ver contacto':'Ver perfil'}</button></td></tr>`;
  });
  if(!lista.length)h+='<tr><td colspan="7"><div class="tp-empty">'+(CANDIDATES.length?'Ningún candidato cumple esos filtros.':'Todavía no hay candidatos en el pool.')+'</div></td></tr>';
  h+='</tbody></table>';
  document.getElementById('empPool').innerHTML=h;
}

