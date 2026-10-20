// TalentPact · 24-verificar
// Verificación de un SkillPass con los cinco estados del plan 03 (válida,
// caducada, revocada, alterada, no encontrada). Lo usan el panel de empresa,
// la portada y verify.html: es autónomo (no necesita otros scripts de la app),
// por eso verify.html lo carga solo.
// Script clásico: ámbito global compartido (ver assets/js/README.md).

var TPVerificar=(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fecha=d=>{if(!d)return '';const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});};
  const corto=h=>h&&h.length>18?h.slice(0,10)+'…'+h.slice(-6):(h||'');
  const ESTADOS={
    valida:{tit:'Válida y vigente',cls:'ok'},
    caducada:{tit:'Válida, caducada',cls:'aviso'},
    revocada:{tit:'Revocada',cls:'error'},
    alterada:{tit:'Alterada',cls:'error'},
    no_encontrada:{tit:'No encontrada',cls:'neutro'}
  };
  const ID_BANDA={'Insuficiente':'insuficiente','Aceptable':'aceptable','Bueno':'bueno','Muy bueno':'muy_bueno'};

  /** Lo que pega la persona → cuerpo para verify-credential (o {error}). */
  function interpretar(raw){
    const t=String(raw||'').trim();
    if(!t)return {error:'Pega el enlace del SkillPass, su código o el archivo .json.'};
    if(t[0]==='{'){try{JSON.parse(t);return {vc:t};}catch(e){return {error:'Lo que has pegado no es un JSON válido.'};}}
    const id=t.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if(id)return {credentialId:id[0]};
    const h=t.match(/0x[a-fA-F0-9]{64}/);
    if(h)return {cvHash:h[0]};
    return {error:'No reconozco ese formato. Pega el enlace (verify.html?c=…), el código del SkillPass o el archivo .json.'};
  }

  async function consultar(cuerpo){
    const r=await fetch('/.netlify/functions/verify-credential',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(cuerpo)});
    let d=null;try{d=await r.json();}catch(e){}
    if(!d)throw new Error('El verificador no responde ('+r.status+')');
    return d;
  }

  function banda(b){
    const id=ID_BANDA[b]||'insuficiente';
    return '<span class="tp-banda tp-banda-'+id+'"><span class="tp-banda-seg" aria-hidden="true">'+'<i></i>'.repeat(4)+'</span><span class="tp-banda-txt">'+esc(b||'—')+'</span></span>';
  }

  function skills(lista){
    const bloque=(id,tit)=>{
      const xs=(lista||[]).filter(s=>(s.bloque||'hard')===id).sort((a,b)=>(b.nivel||0)-(a.nivel||0));
      return '<section class="tp-bloque-skills"><h4>'+tit+'</h4>'+(xs.length?xs.map(s=>
        '<div class="tp-skill-banda"><span class="tp-skill-banda-nombre">'+esc(s.skill)+
        '<span class="vf-skill-meta">'+(s.evaluadoEl?'Evaluada el '+esc(fecha(s.evaluadoEl)):'')+(s.verificada?' · nota verificada':' · sin verificar')+(s.rubrica?' · rúbrica '+esc(s.rubrica):'')+(s.revisionHumana?' · revisión humana':'')+'</span></span>'+banda(s.banda)+'</div>').join('')
        :'<p class="tp-bloque-vacio">Ninguna en este bloque.</p>')+'</section>';
    };
    return '<div class="tp-bloques-skills">'+bloque('hard','Hard skills')+bloque('soft','Soft skills')+'</div>';
  }

  function sello(s){
    if(!s||s.estado==='no')return '<p class="vf-linea">Sello público: no. El titular no lo ha añadido (es opcional); la firma de TalentPact basta para comprobarla aquí.</p>';
    if(s.estado==='en_cola')return '<p class="vf-linea">Sello público: pagado. Se publica en '+esc(s.red||'la red')+' en el lote de esta noche.</p>';
    const c=s.comprobar||{};
    const red=s.confirmadoEnRed===true?' · comprobado ahora en la red':(s.confirmadoEnRed===false?' · la red aún no lo muestra':'');
    let h='<details class="vf-detalles"><summary>Sello público: '+(s.estado==='sellado'?esc(fecha(s.fecha)||'publicado'):'enviado, pendiente de confirmar')+' · '+esc(s.red||'')+red+'</summary><div class="vf-detalles-cuerpo">';
    if(s.lote)h+='<div>Lote: '+esc(s.lote)+'</div>';
    if(s.txHash)h+='<div>Transacción: '+(s.explorerUrl?'<a href="'+esc(s.explorerUrl)+'" target="_blank" rel="noopener">'+esc(corto(s.txHash))+'</a>':esc(corto(s.txHash)))+'</div>';
    h+='<p class="vf-paso"><strong>Comprobarlo sin TalentPact.</strong> ';
    if(s.version===2){
      h+='1) Rehaz la hoja: keccak256(sal ‖ JSON canónico de la credencial). 2) En el explorador, abre el contrato y llama a <code>'+esc(c.funcion||'verifyLeaf')+'</code> con la hoja, la prueba y la raíz. 3) Debe devolver <code>true</code> y la fecha del lote.</p>';
      h+='<dl class="vf-datos"><dt>Contrato</dt><dd><code>'+esc(c.contrato||'—')+'</code></dd><dt>Raíz</dt><dd><code>'+esc(c.raiz||'—')+'</code></dd><dt>Hoja</dt><dd><code>'+esc(c.hoja||'—')+'</code></dd><dt>Sal</dt><dd><code>'+esc(c.sal||'—')+'</code></dd><dt>Prueba</dt><dd><code>'+esc(JSON.stringify(c.prueba||[]))+'</code></dd></dl>';
    }else{
      h+='En el explorador, abre el contrato y llama a <code>'+esc(c.funcion||'isAnchored')+'</code> con la huella: debe devolver <code>true</code> y la fecha.</p>';
      h+='<dl class="vf-datos"><dt>Contrato</dt><dd><code>'+esc(c.contrato||'—')+'</code></dd><dt>Huella</dt><dd><code>'+esc(c.huella||'—')+'</code></dd></dl>';
    }
    return h+'</div></details>';
  }

  /** HTML del resultado. */
  function html(d){
    if(!d||d.error)return '<div class="vf-estado vf-error" role="alert"><strong>No se ha podido verificar.</strong> '+esc((d&&(d.error||d.details))||'Inténtalo de nuevo.')+'</div>';
    const e=ESTADOS[d.estado]||ESTADOS.no_encontrada;
    let h='<div class="vf-estado vf-'+e.cls+'" role="status"><strong>'+e.tit+'.</strong> '+esc(d.explicacion||'')+(d.motivo?' '+esc(d.motivo):'')+'</div>';
    if(!d.skills)return h;
    h+='<dl class="vf-meta"><dt>Emisor</dt><dd>TalentPact <code>'+esc(d.emisor||'')+'</code></dd>'+
      '<dt>Titular</dt><dd><code>'+esc(d.titular||'')+'</code> (seudónimo; la identidad no viaja en la credencial)</dd>'+
      '<dt>Emitida</dt><dd>'+esc(fecha(d.emitidaEl))+'</dd>'+
      '<dt>Válida hasta</dt><dd>'+esc(fecha(d.validaHasta))+'</dd>'+
      (d.revocadaEl?'<dt>Revocada</dt><dd>'+esc(fecha(d.revocadaEl))+'</dd>':'')+
      '<dt>Firma</dt><dd>'+esc(d.firma||'')+'</dd></dl>';
    h+=skills(d.skills);
    h+=sello(d.sello);
    return h;
  }

  /** Verifica lo escrito en `entrada` y pinta en `salida`. */
  async function ejecutar(entrada,salida,boton){
    const el=document.getElementById(entrada),out=document.getElementById(salida),btn=boton&&document.getElementById(boton);
    if(!el||!out)return;
    const cuerpo=interpretar(el.value);
    out.hidden=false;
    if(cuerpo.error){out.innerHTML='<div class="vf-estado vf-neutro" role="alert">'+esc(cuerpo.error)+'</div>';return;}
    const txt=btn?btn.textContent:'';
    if(btn){btn.disabled=true;btn.textContent='Verificando…';}
    out.innerHTML='<div class="vf-estado vf-neutro" role="status">Comprobando la firma y el registro…</div>';
    try{out.innerHTML=html(await consultar(cuerpo));}
    catch(e){out.innerHTML=html({error:e.message||String(e)});}
    finally{if(btn){btn.disabled=false;btn.textContent=txt;}}
  }

  /** Un .json subido: se pega su contenido y se verifica. */
  function leerArchivo(input,entrada,salida,boton){
    const f=input&&input.files&&input.files[0];if(!f)return;
    if(f.size>200000){const out=document.getElementById(salida);if(out){out.hidden=false;out.innerHTML=html({error:'El archivo es demasiado grande para ser un SkillPass.'});}return;}
    const r=new FileReader();
    r.onload=()=>{const el=document.getElementById(entrada);if(el){el.value=String(r.result||'');ejecutar(entrada,salida,boton);}};
    r.readAsText(f);
  }

  // verify.html: rellena con ?c= (o ?h=) y verifica sola.
  function iniciarPagina(){
    const el=document.getElementById('vfEntrada');if(!el||!document.body.classList.contains('vf-pagina'))return;
    const q=new URLSearchParams(location.search);
    const v=q.get('c')||q.get('h');
    document.getElementById('vfBoton').addEventListener('click',()=>ejecutar('vfEntrada','vfResultado','vfBoton'));
    document.getElementById('vfArchivo').addEventListener('change',e=>leerArchivo(e.target,'vfEntrada','vfResultado','vfBoton'));
    if(v){el.value=v;ejecutar('vfEntrada','vfResultado','vfBoton');}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarPagina);else iniciarPagina();

  return {interpretar,consultar,html,ejecutar,leerArchivo};
})();
