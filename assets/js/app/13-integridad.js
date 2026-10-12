// TalentPact · 13-integridad
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// TPIntegrity — integridad de las pruebas
// Anti-copia, bloqueo de pegado, registro de salidas de pestaña y supervisión
// por cámara con consentimiento. Nada de esto descarta a nadie de forma
// automática: produce un informe para la revisión humana (AI Act, art. 14).
// El vídeo nunca sale del navegador: se analiza aquí y se descarta.
// ═══════════════════════════════════════════════════════════════════════════
var TPIntegrity=(function(){
  const sessions={};
  let cur=null;
  const runs=new WeakMap();let runSeq=0;
  // Cada apertura de un reto crea un objeto exResults nuevo: sirve de id de intento.
  function keyOf(i){if(!runs.has(exResults))runs.set(exResults,++runSeq);return runs.get(exResults)+':'+i;}
  const cam={stream:null,state:'no solicitada',consent:null,timer:null,video:null,canvas:null,dark:0,noFace:0,multi:0,detector:null};
  try{cam.consent=sessionStorage.getItem('tp_cam_consent');}catch(e){}

  function log(type,detail){
    if(!cur)return;
    cur.events.push({t:Math.round((Date.now()-cur.start)/1000),type,detail:detail==null?null:String(detail).slice(0,60)});
    if(cur.events.length>200)cur.events.shift();
    cur.counts[type]=(cur.counts[type]||0)+1;
  }
  let lastWarn=0;
  function warn(m){const n=Date.now();if(n-lastWarn>2500){lastWarn=n;toast(m);}}
  const enModal=e=>!!(e&&e.target&&e.target.closest&&e.target.closest('#jobModal'));

  const H={
    copy(e){if(!cur)return;e.preventDefault();log('copia_bloqueada');warn('Copiar está desactivado durante la prueba.');},
    cut(e){if(!cur)return;e.preventDefault();log('copia_bloqueada');warn('Cortar está desactivado durante la prueba.');},
    paste(e){if(!cur)return;e.preventDefault();log('pegado_bloqueado');warn('Pegar está desactivado: escribe la respuesta con tus palabras.');},
    beforeinput(e){if(cur&&/^insertFrom(Paste|Drop|Yank)/.test(e.inputType||'')){e.preventDefault();log('pegado_bloqueado',e.inputType);}},
    drop(e){if(!cur)return;e.preventDefault();log('pegado_bloqueado','arrastrar');},
    dragstart(e){if(cur)e.preventDefault();},
    contextmenu(e){if(cur&&enModal(e)){e.preventDefault();log('menu_contextual');}},
    keydown(e){
      if(!cur)return;
      const k=(e.key||'').toLowerCase(),mod=e.ctrlKey||e.metaKey;
      if(mod&&['c','x','v','p','s','u'].includes(k)){
        e.preventDefault();
        log(k==='v'?'pegado_bloqueado':k==='p'?'imprimir_bloqueado':k==='c'||k==='x'?'copia_bloqueada':'atajo_bloqueado',k);
        warn('Ese atajo está desactivado durante la prueba.');return;
      }
      if(k==='printscreen'){log('captura_pantalla');warn('Las capturas de pantalla quedan registradas en el informe.');}
      if(e.key&&e.key.length===1&&!mod)cur.keys++;
    },
    input(e){
      if(!cur)return;const t=e.target;
      if(!t||!t.matches||!t.matches('textarea,input[type=text]'))return;
      const id=t.id||'campo',prev=cur.lens[id]||0,now=t.value.length;cur.lens[id]=now;
      // Texto que aparece de golpe sin teclearlo: autocompletado, dictado o un pegado que se escapó.
      if(now-prev>40&&e.inputType!=='insertText'){log('insercion_masiva',now-prev);warn('Se ha detectado texto insertado de golpe. Queda registrado.');}
    },
    visibilitychange(){
      if(!cur)return;
      if(document.hidden){cur.hiddenAt=Date.now();log('salida_pestana');}
      else if(cur.hiddenAt){cur.hiddenMs+=Date.now()-cur.hiddenAt;cur.hiddenAt=null;warn('Has salido de la prueba: queda registrado en el informe.');}
    },
    blur(){if(!cur||document.hidden)return;log('ventana_sin_foco');document.body.classList.add('tp-exam-blur');},
    focus(){document.body.classList.remove('tp-exam-blur');},
    beforeprint(){if(cur)log('imprimir_bloqueado');}
  };
  const DOC=['copy','cut','paste','beforeinput','drop','dragstart','contextmenu','keydown','input','visibilitychange'];
  const WIN=['blur','focus','beforeprint'];
  let attached=false;
  function attach(){if(attached)return;attached=true;DOC.forEach(t=>document.addEventListener(t,H[t],true));WIN.forEach(t=>window.addEventListener(t,H[t]));document.body.classList.add('tp-exam');marcaDeAgua(true);}
  function detach(){if(!attached)return;attached=false;DOC.forEach(t=>document.removeEventListener(t,H[t],true));WIN.forEach(t=>window.removeEventListener(t,H[t]));document.body.classList.remove('tp-exam','tp-exam-blur');marcaDeAgua(false);}

  // Marca de agua con el alias y la hora: una captura filtrada del reto lleva su origen.
  function marcaDeAgua(on){
    const ct=document.getElementById('exContent');if(!ct)return;
    if(!on){ct.classList.remove('tp-wm');return;}
    const alias=tpUser?('Candidato #'+String(tpUser.id||'').replace(/-/g,'').slice(0,4).toUpperCase()):'Invitado';
    const txt=(alias+' · '+new Date().toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})).replace(/[<&>"]/g,'');
    const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140'><text x='10' y='80' transform='rotate(-20 130 70)' font-family='sans-serif' font-size='13' fill='%2394a3b8'>${txt}</text></svg>`;
    ct.style.setProperty('--tp-wm',`url("data:image/svg+xml;utf8,${svg.replace(/#/g,'%23')}")`);
    ct.classList.add('tp-wm');
  }

  // ── Cámara ────────────────────────────────────────────────────────────────
  function consentimiento(){
    return new Promise(resolve=>{
      const ov=document.createElement('div');
      ov.className='tp-consent';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','tpConsentTitle');
      ov.innerHTML=`<div class="tp-consent-card">
        <h3 id="tpConsentTitle">Supervisión por cámara</h3>
        <p>Para que tu resultado cuente como <strong>prueba supervisada</strong>, la cámara comprueba que estás delante durante el ejercicio.</p>
        <ul><li>El vídeo <strong>no se graba ni se envía</strong>: se analiza en tu navegador y se descarta.</li>
        <li>Solo se guardan incidencias (cámara tapada, nadie en pantalla, varias personas).</li>
        <li>Una persona revisa siempre esas incidencias: nunca descartan a nadie por sí solas.</li></ul>
        <p class="tp-consent-small">Puedes continuar sin cámara: la prueba vale igual, pero el informe dirá «sin supervisión». Base legal: tu consentimiento (art. 6.1.a RGPD), que puedes retirar cerrando la prueba.</p>
        <div class="tp-consent-actions"><button class="btn btn-outline" data-r="no">Continuar sin cámara</button><button class="btn btn-primary" data-r="si">Activar cámara</button></div>
      </div>`;
      document.body.appendChild(ov);
      const prev=document.activeElement;
      ov.querySelector('[data-r=si]').focus();
      ov.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!b)return;ov.remove();if(prev&&prev.focus)prev.focus();resolve(b.dataset.r==='si');});
      ov.addEventListener('keydown',e=>{if(e.key==='Escape'){ov.remove();resolve(false);}});
    });
  }
  async function prepare(){
    if(cam.stream)return;
    if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){cam.state='no disponible';return;}
    if(cam.consent===null){
      const si=await consentimiento();
      cam.consent=si?'si':'no';
      try{sessionStorage.setItem('tp_cam_consent',cam.consent);}catch(e){}
    }
    if(cam.consent!=='si'){cam.state='rechazada';return;}
    try{
      cam.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:320},height:{ideal:240},facingMode:'user'},audio:false});
      cam.state='activa';
      montarVista();
    }catch(err){
      // La decisión de la persona se respeta: no se le vuelve a preguntar en cada
      // ejercicio. Solo se reintenta abrir la cámara, en silencio.
      const antes=cam.state;
      cam.state=(err&&err.name==='NotAllowedError')?'denegada':'no disponible';
      if(antes!==cam.state)toast(cam.state==='denegada'?'El navegador ha bloqueado la cámara. Puedes permitirla en el icono del candado.':'No se ha encontrado ninguna cámara. La prueba sigue sin supervisión.');
    }
  }
  function montarVista(){
    let box=document.getElementById('tpProctor');
    if(!box){
      box=document.createElement('div');box.id='tpProctor';box.className='tp-proctor';
      box.innerHTML='<video autoplay muted playsinline aria-label="Vista previa de tu cámara"></video><span><i></i>Supervisión activa · no se graba</span>';
      document.body.appendChild(box);
    }
    cam.video=box.querySelector('video');cam.video.srcObject=cam.stream;
    cam.stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{cam.state='interrumpida';log('camara_incidencia','cámara desconectada');warn('La cámara se ha desconectado.');}));
    if(!cam.canvas){cam.canvas=document.createElement('canvas');cam.canvas.width=32;cam.canvas.height=24;}
    if('FaceDetector' in window&&!cam.detector){try{cam.detector=new window.FaceDetector({fastMode:true,maxDetectedFaces:3});}catch(e){cam.detector=null;}}
    clearInterval(cam.timer);
    cam.timer=setInterval(muestrear,2500);
  }
  async function muestrear(){
    if(!cam.video||cam.video.readyState<2||!cur)return;
    try{
      const ctx=cam.canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(cam.video,0,0,32,24);
      const px=ctx.getImageData(0,0,32,24).data;let lum=0;
      for(let k=0;k<px.length;k+=4)lum+=0.2126*px[k]+0.7152*px[k+1]+0.0722*px[k+2];
      lum/=px.length/4;
      cam.dark=lum<16?cam.dark+1:0;
      if(cam.dark===3){log('camara_incidencia','tapada u oscura');warn('La cámara parece tapada.');}
      // Detección de caras solo donde el navegador la trae de serie (Chrome con la API activada).
      if(cam.detector){
        const caras=await cam.detector.detect(cam.video);
        cam.noFace=caras.length===0?cam.noFace+1:0;
        cam.multi=caras.length>1?cam.multi+1:0;
        if(cam.noFace===4)log('camara_incidencia','nadie frente a la cámara');
        if(cam.multi===2)log('camara_incidencia','varias personas');
      }
    }catch(e){}
  }
  function stopCamera(){
    clearInterval(cam.timer);cam.timer=null;
    if(cam.stream){cam.stream.getTracks().forEach(t=>t.stop());cam.stream=null;}
    const box=document.getElementById('tpProctor');if(box)box.remove();
    cam.video=null;
  }

  // ── Informe ───────────────────────────────────────────────────────────────
  function riesgo(r){
    const pts=r.tabSwitches*2+r.bulkInserts*3+r.pasteBlocked+r.relaunches*2+r.cameraIncidents*2+r.screenshots
      +(r.hiddenSeconds>30?2:0)+(['denegada','rechazada','no disponible','interrumpida'].includes(r.camera)?1:0);
    return pts<=1?'bajo':pts<=5?'medio':'alto';
  }
  function summarize(s){
    const c=s.counts,hid=s.hiddenMs+(s.hiddenAt?Date.now()-s.hiddenAt:0);
    const r={version:1,exercise:s.title,durationS:Math.round((Date.now()-s.start)/1000),
      tabSwitches:c.salida_pestana||0,hiddenSeconds:Math.round(hid/1000),blurs:c.ventana_sin_foco||0,
      pasteBlocked:c.pegado_bloqueado||0,copyBlocked:c.copia_bloqueada||0,bulkInserts:c.insercion_masiva||0,
      relaunches:c.relanzado||0,screenshots:c.captura_pantalla||0,keystrokes:s.keys,
      camera:s.camera||cam.state,cameraIncidents:c.camara_incidencia||0,events:s.events.slice(-30)};
    r.risk=riesgo(r);
    return r;
  }
  const NUM=['durationS','tabSwitches','hiddenSeconds','blurs','pasteBlocked','copyBlocked','bulkInserts','relaunches','screenshots','keystrokes','cameraIncidents'];
  const PEOR=['activa','no solicitada','rechazada','no disponible','denegada','interrumpida'];
  function aggregate(list){
    const v=(list||[]).filter(Boolean);if(!v.length)return null;
    const r={version:1,exercises:v.length};
    NUM.forEach(k=>r[k]=v.reduce((n,x)=>n+(Number(x[k])||0),0));
    r.camera=v.map(x=>x.camera).sort((a,b)=>PEOR.indexOf(b)-PEOR.indexOf(a))[0];
    r.risk=riesgo(r);
    return r;
  }
  function html(r,grande){
    if(!r)return '';
    const camTxt={activa:'Cámara activa','no solicitada':'Sin cámara',rechazada:'Sin supervisión (elegido)',denegada:'Cámara bloqueada','no disponible':'Sin cámara disponible',interrumpida:'Cámara interrumpida'}[r.camera]||r.camera;
    const chip=(t,mal)=>`<span class="tp-ichip${mal?' bad':''}">${escHtml(t)}</span>`;
    return `<div class="tp-integrity${grande?' big':''}"><div class="tp-integrity-head"><span class="tp-risk r-${r.risk}">Integridad: riesgo ${r.risk}</span>${grande?'<span class="tp-integrity-hint">Indicadores para la revisión humana. Por sí solos no descartan a nadie.</span>':''}</div><div class="tp-ichips">${chip(camTxt,r.camera!=='activa')}${chip(r.tabSwitches+' salida'+(r.tabSwitches===1?'':'s')+' de pestaña',r.tabSwitches>0)}${chip(r.pasteBlocked+' pegado'+(r.pasteBlocked===1?'':'s')+' bloqueado'+(r.pasteBlocked===1?'':'s'),r.pasteBlocked>0)}${r.bulkInserts?chip(r.bulkInserts+' inserción masiva',true):''}${r.cameraIncidents?chip(r.cameraIncidents+' incidencia'+(r.cameraIncidents===1?'':'s')+' de cámara',true):''}${r.relaunches?chip('Reabierto '+r.relaunches+(r.relaunches===1?' vez':' veces'),true):''}</div></div>`;
  }

  return {
    prepare,stopCamera,html,aggregate,
    begin(i,ex){
      const k=keyOf(i);
      if(cur&&cur.key!==k)detach();
      if(sessions[k]&&!sessions[k].ended){cur=sessions[k];log('relanzado');}
      else cur=sessions[k]={key:k,title:ex&&ex.title,start:Date.now(),events:[],counts:{},keys:0,lens:{},hiddenMs:0,hiddenAt:null};
      cur.camera=cam.state;
      attach();
    },
    // Tiempo que queda contando desde la primera vez que se reveló el escenario:
    // salir y volver a entrar ya no reinicia el cronómetro.
    remaining(i,limit){const s=sessions[keyOf(i)];if(!s)return limit;return Math.max(1,limit-Math.floor((Date.now()-s.start)/1000));},
    end(i){const s=sessions[keyOf(i)];if(!s)return null;s.ended=true;if(cur===s){cur.camera=cam.state==='activa'?(s.camera==='activa'?'activa':cam.state):cam.state;detach();cur=null;}return summarize(s);},
    pause(){if(cur){detach();cur=null;}},
    abort(){if(cur){log('abandono');detach();cur=null;}stopCamera();},
    current(){return cur?summarize(cur):null;}
  };
})();

// Enganches con el flujo de ejercicios existente.
(function(){
  const _launch=launchExercise;
  launchExercise=async function(i){
    const ex=getExercises(activeJob)[i];
    await TPIntegrity.prepare();
    TPIntegrity.begin(i,ex);
    _launch(i);
  };
  const _switch=switchEx;
  switchEx=function(i){TPIntegrity.pause();return _switch(i);};
  const _submit=submitEx;
  submitEx=async function(i){
    const antes=exResults[i];
    await _submit(i);
    const r=exResults[i];
    if(r&&r!==antes&&!r.integrity){
      r.integrity=TPIntegrity.end(i);
      if(currentEx===i)_switch(i);
    }
  };
  const _close=closeJobModal;
  closeJobModal=function(){TPIntegrity.abort();return _close();};
  const _final=showFinal;
  showFinal=function(){TPIntegrity.stopCamera();return _final.apply(this,arguments);};
})();

