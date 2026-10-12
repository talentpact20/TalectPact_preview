// TalentPact · 14-empleo
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// TPEmpleo — preferencias del candidato y condiciones de cada oferta
// ═══════════════════════════════════════════════════════════════════════════
var TPEmpleo={
  filtro:{jornada:'',modalidad:'',soloEncaje:false},
  vacio(){return {jornadas:[],modalidades:[],contratos:[],salMin:null,disponibilidad:'',ciudad:'',horas:null,reubicacion:false};},
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
  abrirAjustes(){openSettings('cand');setTimeout(()=>{const s=document.getElementById('st-cand-empleo');if(s)s.scrollIntoView({behavior:'smooth',block:'start'});},150);},
  pintarAjustes(){
    const p=TPEmpleo.prefs();
    document.querySelectorAll('#st-cand-empleo .tp-chips').forEach(box=>{
      const k=box.dataset.pref,mapa={jornadas:TP_COND.jornadas,modalidades:TP_COND.modalidades,contratos:TP_COND.contratos}[k];
      box.innerHTML=Object.entries(mapa).map(([v,t])=>`<label class="tp-chip"><input type="checkbox" value="${v}"${p[k].includes(v)?' checked':''}><span>${t}</span></label>`).join('');
    });
    const d=document.getElementById('st-pref-disp');
    if(d&&d.options.length<=1)d.insertAdjacentHTML('beforeend',Object.entries(TP_COND.disponibilidad).map(([v,t])=>`<option value="${v}">${t}</option>`).join(''));
    const set=(id,v)=>{const e=document.getElementById(id);if(e){if(e.type==='checkbox')e.checked=!!v;else e.value=v==null?'':v;}};
    set('st-pref-sal',p.salMin);set('st-pref-disp',p.disponibilidad);set('st-pref-city',p.ciudad);set('st-pref-hours',p.horas);set('st-pref-reloc',p.reubicacion);
  },
  async guardarDesdeAjustes(){
    const p=TPEmpleo.vacio();
    document.querySelectorAll('#st-cand-empleo .tp-chips').forEach(box=>{p[box.dataset.pref]=[...box.querySelectorAll('input:checked')].map(i=>i.value);});
    const num=id=>{const v=Number(document.getElementById(id).value);return Number.isFinite(v)&&v>0?Math.round(v):null;};
    p.salMin=num('st-pref-sal');p.horas=num('st-pref-hours');
    p.disponibilidad=document.getElementById('st-pref-disp').value;
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
  const cs=TPEmpleo.encaje(j,p===undefined?TPEmpleo.prefs():p);
  return `<div class="tp-cond">${cs.map(c=>`<span class="tp-cond-chip${c.ok===true?' ok':c.ok===false?' ko':''}" title="${c.ok===true?'Encaja con tus preferencias':c.ok===false?'No encaja con tus preferencias':''}">${c.ok===true?'✓ ':c.ok===false?'✕ ':''}${escHtml(c.txt)}</span>`).join('')}</div>`;
}

// Al abrir Ajustes del candidato se pintan también las preferencias.
(function(){
  const _open=openSettings;
  openSettings=function(type){const r=_open.apply(this,arguments);if(type==='cand')TPEmpleo.pintarAjustes();return r;};
})();

// La ficha del pool lleva condiciones e integridad: es lo que la empresa filtra.
(function(){
  const _sync=syncMyPoolEntry;
  syncMyPoolEntry=function(){
    _sync();
    const me=CANDIDATES.find(c=>c.id==='me');if(!me)return;
    const p=TPEmpleo.prefs();
    me.cond={jornadas:p.jornadas,modalidades:p.modalidades,ciudad:p.ciudad,reubicacion:p.reubicacion,disponibilidad:p.disponibilidad};
    const done=candidateProfile.completedCommon||[];
    const orden={bajo:0,medio:1,alto:2};
    me.integ=done.reduce((peor,c)=>c.integrity&&(peor===null||orden[c.integrity]>orden[peor])?c.integrity:peor,null);
    me.verified=done.length>0&&done.every(c=>c.verified);
    TP.savePool();
  };
})();

// Condiciones de demo para el pool sembrado.
(function(){
  const D={p1:[['completa'],['hibrido'],'Barcelona'],p2:[['completa'],['remoto'],''],p3:[['completa','parcial'],['hibrido','remoto'],'Madrid'],p4:[['completa'],['presencial','hibrido'],'Madrid'],p5:[['parcial','horas'],['remoto'],''],p6:[['completa'],['hibrido'],'Bilbao'],p7:[['practicas','completa'],['presencial'],'Valencia'],p8:[['completa'],['hibrido','presencial'],'Sevilla']};
  CANDIDATES.forEach(c=>{const d=D[c.id];if(d&&!c.cond)c.cond={jornadas:d[0],modalidades:d[1],ciudad:d[2]};if(c.id!=='me'&&c.integ===undefined){c.integ='bajo';c.verified=true;}});
  // Dos skills de los retos comunes por perfil de demo: son las que piden las
  // ofertas, así "Ver candidatos" puede calcular un encaje con sentido.
  const comunes=[...new Set(JOBS.flatMap(j=>j.requiredSkills||[]))];
  CANDIDATES.forEach((c,k)=>{if(!D[c.id]||c._skillsComunes||!comunes.length)return;
    c.skills=c.skills.concat([{n:comunes[k%comunes.length],v:70+(k*7)%25},{n:comunes[(k+3)%comunes.length],v:66+(k*11)%28}]);c._skillsComunes=true;});
})();

// Pool de talento de la empresa, con filtros por condiciones e integridad.
// Sustituye a la tabla anterior, que además pintaba "#NaN" para el perfil propio.
var TP_POOL_FILTRO={jornada:'',modalidad:'',soloVerificados:false,soloReales:false};
function tpAliasCand(c){
  let h=0;const s=String(c.id);for(let k=0;k<s.length;k++)h=(h*31+s.charCodeAt(k))>>>0;
  return '#'+(1000+h%9000);
}
function renderEmpPool(){
  const f=TP_POOL_FILTRO,opt=(m,v)=>Object.entries(m).map(([k,t])=>`<option value="${k}"${k===v?' selected':''}>${t}</option>`).join('');
  const lista=CANDIDATES.filter(c=>{const cd=c.cond||{};return(!f.jornada||(cd.jornadas||[]).includes(f.jornada))&&(!f.modalidad||(cd.modalidades||[]).includes(f.modalidad))&&(!f.soloVerificados||c.verified)&&(!f.soloReales||c._real);});
  let h=`<div class="tp-filterbar"><label>Jornada <select onchange="TP_POOL_FILTRO.jornada=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.jornadas,f.jornada)}</select></label><label>Modalidad <select onchange="TP_POOL_FILTRO.modalidad=this.value;renderEmpPool()"><option value="">Todas</option>${opt(TP_COND.modalidades,f.modalidad)}</select></label><label class="tp-filter-check"><input type="checkbox"${f.soloVerificados?' checked':''} onchange="TP_POOL_FILTRO.soloVerificados=this.checked;renderEmpPool()"> Solo notas verificadas</label><label class="tp-filter-check"><input type="checkbox"${f.soloReales?' checked':''} onchange="TP_POOL_FILTRO.soloReales=this.checked;renderEmpPool()"> Solo candidatos reales</label><span class="tp-filter-count">${lista.length} de ${CANDIDATES.length}</span></div>${window.TPPool&&TPPool.aviso()?`<div class="tp-pool-aviso">${escHtml(TPPool.aviso())}</div>`:''}`;
  h+='<table class="dash-table"><thead><tr><th>Candidato</th><th>Sector</th><th>Score</th><th>Condiciones</th><th>Integridad</th><th>Top Skills</th><th></th></tr></thead><tbody>';
  lista.forEach(c=>{
    const cd=c.cond||{};
    const cond=[...(cd.jornadas||[]).map(k=>TP_COND.jornadas[k]),...(cd.modalidades||[]).map(k=>TP_COND.modalidades[k])].filter(Boolean).slice(0,3).map(t=>`<span class="tp-cond-chip">${t}</span>`).join(' ')||'<span style="color:var(--slate-400)">—</span>';
    const integ=c.integ?`<span class="tp-risk r-${c.integ}">${c.integ}</span>${c.verified?' <span class="tp-verified">✓</span>':''}`:'<span style="color:var(--slate-400)">—</span>';
    h+=`<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="dash-avatar" style="background:var(--emerald-100);color:var(--emerald-600);width:28px;height:28px;font-size:.65rem">${escHtml(c.i)}</div>${c._real?escHtml(String(c.alias||'').replace(/^Candidato /,'')):tpAliasCand(c)}<span class="tp-origen ${c._real?'real':'demo'}">${c._real?'Real':'Demo'}</span></div></td><td>${escHtml(c.sector)}</td><td><strong style="color:var(--emerald-600)">${c.score}</strong></td><td>${cond}</td><td>${integ}</td><td>${c.skills.slice(0,2).map(s=>`<span class="job-tag">${escHtml(s.n)}: ${s.v}</span>`).join(' ')}</td><td><button class="btn btn-primary btn-sm" onclick="viewProfile('${escHtml(c.id)}')">${c._unlocked?'Ver contacto':'Ver perfil'}</button></td></tr>`;
  });
  if(!lista.length)h+='<tr><td colspan="7" style="text-align:center;color:var(--slate-400);padding:20px">Ningún candidato cumple esos filtros.</td></tr>';
  h+='</tbody></table>';
  document.getElementById('empPool').innerHTML=h;
}

