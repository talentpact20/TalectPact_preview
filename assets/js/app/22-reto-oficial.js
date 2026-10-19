// TalentPact · 22-reto-oficial
// Reto oficial: cuenta obligatoria, comprobación previa con cámara, un solo
// intento por persona y contenido que llega del servidor al empezar.
// (docs/plan_post_reunion/08_seguridad_antitrampas.md; servidor: handlers/retos-intento.js)
// Script clásico: ámbito global compartido (ver assets/js/README.md).

var TPReto={
  id:null,acepta:false,
  async api(cuerpo){return TPCloud._postAuth('retos-intento',cuerpo);},
  ce(){return COMMON_EXERCISES.find(c=>c.id===TPReto.id)||null;},
  caja(){return document.getElementById('exContent');}
};

// Abrir un reto del catálogo ya no enseña los ejercicios: primero la comprobación.
(function(){
  const _abrir=openCommonEx;
  openCommonEx=async function(id){
    const u=tpUser||(await TPCloud.currentUser().catch(()=>null));
    if(!u){
      openAuth('candidate');
      if(typeof authMsg==='function')authMsg('info','Los retos oficiales necesitan cuenta y cámara: así tu nota vale para las empresas. Crea tu cuenta o inicia sesión.','candidate');
      return;
    }
    tpUser=u;
    _abrir(id);
    TPReto.id=id;TPReto.acepta=false;
    activeJob._attemptId=null;
    // Sin intento no hay ejercicios: las pestañas se activan al empezar.
    const nav=document.getElementById('exNav');if(nav)nav.classList.add('tp-bloqueada');
    tpRetoPreparar();
  };
})();

function tpRetoPreparar(){
  const ce=TPReto.ce(),box=TPReto.caja();if(!ce||!box)return;
  const min=Math.round(ce.exercises.reduce((s,e)=>s+(e.timeLimit||300),0)/60);
  box.innerHTML=`<div class="ex-body"><div class="tp-pre">
    <h3>Antes de empezar</h3>
    <p class="tp-pre-sub">${escHtml(ce.title)} · ${ce.exercises.length} ejercicios · unos ${min} minutos. Este es tu <strong>único intento</strong>: haz la comprobación con calma.</p>
    <ol class="tp-pre-pasos">
      <li id="tpPreCam"><div class="tp-pre-n">1</div><div class="tp-pre-c"><b>Cámara</b><span>Obligatoria durante todo el reto. El vídeo no se graba ni se envía: se analiza en tu navegador y solo se guardan incidencias.</span>
        <div class="tp-pre-video" id="tpPreVideo" hidden><video autoplay muted playsinline aria-label="Vista previa de tu cámara"></video><span id="tpPreImg" role="status"></span></div>
        <button type="button" class="btn btn-outline btn-sm" id="tpPreCamBtn" onclick="tpRetoCamara()">Activar cámara</button></div></li>
      <li><div class="tp-pre-n">2</div><div class="tp-pre-c"><b>Normas</b><ul>
        <li>Solo tú delante de la pantalla, sin otras personas en la sala.</li>
        <li>Sin móvil a la vista, sin apuntes y sin otras pestañas o programas.</li>
        <li>No se puede copiar ni pegar. La pantalla completa se mantiene durante el reto.</li>
        <li>Los datos del caso son los tuyos: no sirven a nadie más ni a otro intento.</li>
        <li>Las incidencias (salir de la pestaña, otra persona, cámara tapada) las revisa una persona. Nunca descartan a nadie por sí solas.</li>
      </ul></div></li>
      <li><div class="tp-pre-n">3</div><div class="tp-pre-c"><b>Un solo intento</b>
        <label class="tp-pre-check"><input type="checkbox" id="tpPreAcepto" onchange="TPReto.acepta=this.checked;tpRetoBoton()"> Entiendo que al empezar uso mi intento: si cierro el reto, el tiempo sigue corriendo y no podré empezarlo de nuevo sin pedirlo y explicar el motivo.</label></div></li>
    </ol>
    <div class="tp-pre-msg" id="tpPreMsg" role="status" aria-live="polite"></div>
    <div class="tp-pre-acc"><button type="button" class="pj-enlace" onclick="tpRetoFormulario('sin_camara')">No puedo usar cámara</button>
      <button type="button" class="btn btn-primary" id="tpPreEmpezar" disabled onclick="tpRetoEmpezar()">Empezar el reto</button></div>
    <div id="tpPreForm"></div>
  </div></div>`;
}

function tpRetoBoton(){
  const b=document.getElementById('tpPreEmpezar');if(!b)return;
  b.disabled=!(TPReto.acepta&&TPIntegrity.camara().estado==='activa');
}

async function tpRetoCamara(){
  const btn=document.getElementById('tpPreCamBtn'),msg=document.getElementById('tpPreImg');
  if(btn){btn.disabled=true;btn.textContent='Activando…';}
  const estado=await TPIntegrity.activarCamara();
  const li=document.getElementById('tpPreCam');
  if(estado!=='activa'){
    if(btn){btn.disabled=false;btn.textContent='Volver a intentarlo';}
    const txt=estado==='denegada'?'El navegador ha bloqueado la cámara. Permítela en el icono del candado y vuelve a intentarlo.':'No encontramos ninguna cámara. Conecta una o pide una alternativa.';
    document.getElementById('tpPreMsg').innerHTML='<div class="tp-pre-aviso">'+escHtml(txt)+'</div>';
    tpRetoBoton();return;
  }
  const v=document.querySelector('#tpPreVideo video');
  document.getElementById('tpPreVideo').hidden=false;
  v.srcObject=TPIntegrity.camara().stream;
  if(btn)btn.hidden=true;
  li&&li.classList.add('hecho');
  await new Promise(r=>setTimeout(r,900));
  try{
    const c=await TPIntegrity.comprobarImagen(v);
    const avisos=[];
    if(!c.luz)avisos.push('La imagen está muy oscura: enciende una luz o destapa la cámara.');
    if(c.caras===0)avisos.push('No se te ve: colócate frente a la cámara.');
    if(c.caras>1)avisos.push('Se ve a más de una persona: durante el reto tienes que estar solo.');
    msg.textContent=avisos.length?avisos.join(' '):'Imagen correcta.';
    msg.className=avisos.length?'mal':'bien';
  }catch(e){msg.textContent='';}
  document.getElementById('tpPreMsg').innerHTML='';
  tpRetoBoton();
}

async function tpRetoEmpezar(){
  const b=document.getElementById('tpPreEmpezar');if(b){b.disabled=true;b.textContent='Preparando tu intento…';}
  try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen();}catch(e){}
  const r=await TPReto.api({accion:'empezar',challengeId:TPReto.id,camara:TPIntegrity.camara().estado,aceptaNormas:TPReto.acepta});
  if(!r||r.error){
    if(b){b.disabled=false;b.textContent='Empezar el reto';}
    if(r&&r.code==='intento_usado')return tpRetoUsado(r);
    document.getElementById('tpPreMsg').innerHTML='<div class="tp-pre-aviso">'+escHtml((r&&r.error)||'No se ha podido empezar el reto. Inténtalo de nuevo.')+'</div>';
    return;
  }
  // El contenido llega ahora, sin soluciones: se añade a los ejercicios del reto.
  const ce=TPReto.ce();
  (r.ejercicios||[]).forEach(x=>{const e=ce.exercises.find(y=>y.id===x.id);if(e)Object.assign(e,{scenario:x.scenario,data:x.data,type:x.type||e.type});});
  activeJob._attemptId=r.intento?r.intento.id:null;
  activeJob._expira=r.intento?r.intento.expiraEn:null;
  const nav=document.getElementById('exNav');if(nav)nav.classList.remove('tp-bloqueada');
  if(r.intento&&r.intento.retomado)toast('Retomas tu intento: el tiempo ha seguido corriendo.');
  renderEx(ce.exercises,0);
}

function tpRetoUsado(r){
  const box=TPReto.caja();if(!box)return;
  const s=r.solicitud;
  const est=!s?'':s.estado==='pendiente'?'<p class="tp-pre-sub">Tu solicitud está <strong>pendiente</strong>: te avisaremos en tu bandeja.</p>'
    :s.estado==='rechazada'?'<p class="tp-pre-sub">Tu última solicitud fue <strong>rechazada</strong>'+(s.nota?': '+escHtml(s.nota):'.')+'</p>':'';
  box.innerHTML=`<div class="ex-body"><div class="tp-pre"><h3>Ya has usado tu intento en este reto</h3>
    <p class="tp-pre-sub">Cada reto oficial tiene un intento por persona, para que la nota valga lo mismo para todos. Si tuviste un problema (se cortó la conexión, se apagó el ordenador…), puedes pedir otra oportunidad explicando qué pasó. Lo revisa una persona.</p>
    ${est}<div id="tpPreForm"></div></div></div>`;
  if(!s||s.estado!=='pendiente')tpRetoFormulario('reapertura');
}

function tpRetoFormulario(tipo){
  const box=document.getElementById('tpPreForm');if(!box)return;
  const titulo=tipo==='reapertura'?'Pedir otra oportunidad':'Pedir una alternativa a la cámara';
  const ayuda=tipo==='reapertura'?'Cuéntanos qué pasó y cuándo. No hace falta adjuntar nada.':'Cuéntanos por qué no puedes usar cámara (no tienes, motivos de salud o de accesibilidad…). Te proponemos otra forma: por ejemplo, una videollamada breve.';
  box.innerHTML=`<div class="tp-pre-form"><label for="tpPreMotivo"><b>${titulo}</b></label><p class="tp-pre-sub">${ayuda}</p>
    <textarea id="tpPreMotivo" rows="4" maxlength="1500" placeholder="Explica el motivo (mínimo 30 caracteres)"></textarea>
    <div class="tp-pre-acc"><button type="button" class="btn btn-primary btn-sm" onclick="tpRetoEnviar('${tipo}')">Enviar solicitud</button></div>
    <div class="tp-pre-msg" id="tpPreFormMsg" role="status" aria-live="polite"></div></div>`;
  document.getElementById('tpPreMotivo').focus();
}

async function tpRetoEnviar(tipo){
  const m=(document.getElementById('tpPreMotivo')?.value||'').trim(),out=document.getElementById('tpPreFormMsg');
  if(m.length<30){out.textContent='Explica el motivo con al menos 30 caracteres: lo lee una persona.';return;}
  const r=await TPReto.api({accion:'solicitar',tipo,challengeId:TPReto.id,motivo:m});
  if(!r||r.error){out.textContent=(r&&r.error)||'No se ha podido enviar. Inténtalo de nuevo.';return;}
  document.getElementById('tpPreForm').innerHTML='<div class="tp-pre-ok">Solicitud enviada'+(r.yaPendiente?' (ya tenías una pendiente)':'')+'. Te responderemos en tu bandeja.</div>';
}

// Cerrar a mitad de un intento: se avisa de que el tiempo sigue.
(function(){
  const _cerrar=closeJobModal;
  closeJobModal=async function(){
    const enCurso=activeJob&&activeJob._attemptId&&getExercises(activeJob).some((_,i)=>exResults[i]===undefined);
    if(enCurso){
      const salir=await tpConfirmar({titulo:'¿Salir del reto?',texto:'Tu intento sigue en marcha y el tiempo sigue corriendo. Puedes volver mientras quede tiempo, pero no empezar de nuevo.',si:'Salir',no:'Seguir con el reto'});
      if(!salir)return;
    }
    try{if(document.fullscreenElement)await document.exitFullscreen();}catch(e){}
    return _cerrar.apply(this,arguments);
  };
})();
