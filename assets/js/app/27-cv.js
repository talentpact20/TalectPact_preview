// ═══ Currículum en PDF ═══
// El candidato lo sube desde «Mi perfil»; la empresa lo abre desde la ficha de
// contacto, solo tras desbloquear. El archivo nunca pasa por el navegador de
// la empresa como dato: recibe un enlace firmado de 5 minutos (función cv).
const TP_CV_MAX=4*1024*1024;

var TPCv={
  estado:'inicial',   // inicial | cargando | listo | sin_configurar | error
  cv:null,
  msg:null,           // {tipo:'ok'|'err', txt}
  async cargar(){
    if(!tpUser){TPCv.estado='inicial';TPCv.cv=null;TPCv.pintar();return;}
    TPCv.estado='cargando';TPCv.pintar();
    let r;
    try{r=await TPCloud._postAuth('cv',{accion:'estado'});}catch(e){r={error:e.message||String(e)};}
    if(!r||r.error){TPCv.estado=r&&r.code==='not_candidate'?'inicial':'error';TPCv.msg={tipo:'err',txt:(r&&r.error)||'No se pudo cargar tu currículum.'};TPCv.pintar();return;}
    TPCv.cv=r.cv||null;
    TPCv.estado=r.disponible===false?'sin_configurar':'listo';
    TPCv.pintar();
  },
  pintar(){
    const box=document.getElementById('cvCuerpo');if(!box)return;
    const msg=TPCv.msg?'<p class="tp-cv-msg '+(TPCv.msg.tipo==='ok'?'ok':'err')+'" role="status">'+escHtml(TPCv.msg.txt)+'</p>':'';
    if(!tpUser){box.innerHTML='<p class="tp-cv-vacio">Inicia sesión o crea tu cuenta para subir tu currículum.</p>';return;}
    if(TPCv.estado==='cargando'){box.innerHTML='<p class="tp-cv-vacio">Cargando…</p>';return;}
    if(TPCv.estado==='sin_configurar'){box.innerHTML='<p class="tp-cv-vacio">La subida de currículums todavía no está disponible. Vuelve a intentarlo más adelante.</p>';return;}
    if(TPCv.estado==='error'){box.innerHTML=msg+'<button type="button" class="btn btn-outline btn-sm" onclick="TPCv.cargar()">Reintentar</button>';return;}
    const c=TPCv.cv;
    if(!c){
      box.innerHTML='<div class="tp-cv-fila"><div class="tp-cv-info"><strong>Todavía no has subido tu currículum</strong><span>PDF de hasta 4 MB. No incluyas datos que no quieras compartir, como el DNI o la foto.</span></div>'+
        '<div class="tp-cv-acc"><button type="button" class="btn btn-primary btn-sm" id="cvSubirBtn" onclick="TPCv.elegir()">Subir PDF</button></div></div>'+msg;
      return;
    }
    box.innerHTML='<div class="tp-cv-fila"><div class="tp-cv-info"><strong>'+escHtml(c.nombre)+'</strong><span>'+escHtml(tpCvTamano(c.bytes))+' · subido el '+escHtml(new Date(c.subido).toLocaleDateString('es-ES'))+'</span></div>'+
      '<div class="tp-cv-acc"><button type="button" class="btn btn-outline btn-sm" onclick="TPCv.ver()">Ver</button>'+
      '<button type="button" class="btn btn-outline btn-sm" id="cvSubirBtn" onclick="TPCv.elegir()">Sustituir</button>'+
      '<button type="button" class="btn btn-outline btn-sm tp-cv-borrar" onclick="TPCv.borrar()">Eliminar</button></div></div>'+msg;
  },
  elegir(){const i=document.getElementById('cvArchivo');if(i)i.click();},
  elegido(input){
    const f=input.files&&input.files[0];input.value='';
    if(!f)return;
    TPCv.msg=null;
    if(!/\.pdf$/i.test(f.name)&&f.type!=='application/pdf'){TPCv.msg={tipo:'err',txt:'Solo se admite el currículum en PDF.'};TPCv.pintar();return;}
    if(f.size>TP_CV_MAX){TPCv.msg={tipo:'err',txt:'El PDF pasa de 4 MB. Exporta una versión más ligera.'};TPCv.pintar();return;}
    const lector=new FileReader();
    lector.onload=()=>TPCv.subir(f.name,String(lector.result||'').split(',')[1]||'');
    lector.onerror=()=>{TPCv.msg={tipo:'err',txt:'No se ha podido abrir el archivo.'};TPCv.pintar();};
    lector.readAsDataURL(f);
  },
  async subir(nombre,base64){
    const b=document.getElementById('cvSubirBtn');if(b){b.disabled=true;b.textContent='Subiendo…';}
    let r;
    try{r=await TPCloud._postAuth('cv',{accion:'subir',nombre,base64});}catch(e){r={error:'Error de red: '+(e.message||e)};}
    if(!r||r.error){
      if(r&&r.code==='cv_sin_configurar')TPCv.estado='sin_configurar';
      TPCv.msg={tipo:'err',txt:(r&&r.error)||'No se pudo subir el currículum.'};
    }else{TPCv.cv=r.cv;TPCv.msg={tipo:'ok',txt:'Currículum guardado.'};}
    TPCv.pintar();
  },
  async ver(){
    await tpCvAbrir({accion:'ver'});
  },
  async borrar(){
    if(!(await tpConfirmar({titulo:'¿Eliminar tu currículum?',texto:'Las empresas que ya desbloquearon tu contacto dejarán de poder abrirlo. Puedes subir otro cuando quieras.',si:'Eliminar',no:'Cancelar'})))return;
    let r;
    try{r=await TPCloud._postAuth('cv',{accion:'borrar'});}catch(e){r={error:'Error de red: '+(e.message||e)};}
    if(!r||r.error){TPCv.msg={tipo:'err',txt:(r&&r.error)||'No se pudo eliminar.'};}
    else{TPCv.cv=null;TPCv.msg={tipo:'ok',txt:'Currículum eliminado.'};}
    TPCv.pintar();
  }
};

function tpCvTamano(b){
  const n=Number(b)||0;
  return n>=1024*1024?(n/1024/1024).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';
}

/** Pide el enlace firmado y lo abre en otra pestaña. La pestaña se abre antes
 *  de la petición: abrirla después la bloquean los navegadores. */
async function tpCvAbrir(cuerpo){
  const w=window.open('','_blank');
  if(w){try{w.opener=null;w.document.title='Currículum';w.document.body.textContent='Cargando el currículum…';}catch(e){}}
  let r;
  try{r=await TPCloud._postAuth('cv',cuerpo);}catch(e){r={error:'Error de red: '+(e.message||e)};}
  if(!r||r.error||!r.url){
    if(w)w.close();
    toast((r&&r.error)||'No se pudo abrir el currículum.');
    return false;
  }
  if(w)w.location.href=r.url;else location.assign(r.url);
  return true;
}

/** Fila extra en la ficha de contacto (16-pool-real.js). */
function tpCvFilaContacto(c,cv){
  if(!cv)return '<div class="ct-row"><span class="ct-k">Currículum</span><span class="ct-v"><span class="u-c-slate-400">No ha subido currículum</span></span></div>';
  return '<div class="ct-row"><span class="ct-k">Currículum</span><span class="ct-v tp-cv-ct">'+escHtml(cv.nombre)+
    ' <button type="button" class="btn btn-outline btn-sm" onclick="tpCvAbrir({candidateRef:\''+escHtml(String(c.id))+'\'})">Abrir PDF</button></span></div>';
}

(function(){
  const _open=openDashCand;
  openDashCand=function(){const r=_open.apply(this,arguments);TPCv.msg=null;TPCv.cargar();return r;};
})();
