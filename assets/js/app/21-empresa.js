// TalentPact · 21-empresa
// Ficha y verificación de la empresa en su panel, y el paso «Completa los datos
// de tu empresa» tras entrar con Google (o si la ficha quedó a medias).
// Script clásico: ámbito global compartido (ver assets/js/README.md).
// La verificación la decide el servidor (netlify/functions/lib/verificacion.js):
// aquí solo se enseña.

var TP_VERIF_TXT={
  google_workspace:{titulo:'Empresa verificada con Google Workspace',corto:'Empresa verificada',texto:'Google confirma que tu cuenta pertenece al dominio de la empresa. Los candidatos ven el sello en tus ofertas.'},
  email_corporativo:{titulo:'Empresa verificada por email corporativo',corto:'Empresa verificada',texto:'Tu email confirmado es del dominio de la empresa. Los candidatos ven el sello en tus ofertas.'},
  sin_verificar:{titulo:'Empresa sin verificar',corto:'',texto:'Los candidatos no ven el sello de empresa verificada en tus ofertas.'}
};

/** Sello para las ofertas (solo si está verificada). */
function tpSelloEmpresa(nivel){
  const t=TP_VERIF_TXT[nivel];
  if(!t||nivel==='sin_verificar')return '';
  return '<span class="tp-sello-emp" title="'+escHtml(t.titulo)+'">'+tpIcon('check')+'<span>'+escHtml(t.corto)+'</span></span>';
}

var TPEmpresa={ficha:null,verificacion:null,cargando:null,
  async cargar(){
    if(!tpCompany)return null;
    if(TPEmpresa.cargando)return TPEmpresa.cargando;
    TPEmpresa.cargando=(async()=>{
      try{
        const r=await TPCloud.getCompany(tpCompany);
        if(!r||r.error)return null;
        TPEmpresa.ficha=r.company||null;TPEmpresa.verificacion=r.verificacion||null;
        if(typeof applyCompanyToUI==='function'&&r.company)applyCompanyToUI(r.company,tpCompany);
        TPEmpresa.pintar();
        await TPEmpresa.completarSiFalta();
        return r;
      }catch(e){console.warn('[TP] empresa',e);return null;}
      finally{TPEmpresa.cargando=null;}
    })();
    return TPEmpresa.cargando;
  },
  pintar(){
    const box=document.getElementById('empVerificacion');if(!box)return;
    const v=TPEmpresa.verificacion;
    if(!tpCompany||!v){box.innerHTML='';return;}
    const t=TP_VERIF_TXT[v.nivel]||TP_VERIF_TXT.sin_verificar;
    const ok=v.nivel!=='sin_verificar';
    const dom=ok&&v.dominio?' · '+escHtml(v.dominio):'';
    const accion=!ok?'<div class="tp-verif-acc"><span>'+escHtml(v.ayuda||'Entra con la cuenta de Google de tu empresa para verificarla al momento.')+'</span>'+
      '<button type="button" class="btn btn-outline btn-sm" onclick="tpVerificarConGoogle()">Verificar con Google</button></div>':'';
    box.innerHTML='<div class="tp-verif '+(ok?'ok':'pendiente')+'"><div class="tp-verif-ico" aria-hidden="true">'+tpIcon(ok?'check':'alert')+'</div><div class="tp-verif-txt"><strong>'+escHtml(t.titulo)+dom+'</strong><span>'+escHtml(t.texto)+'</span>'+accion+'</div></div>';
  },
  /** Tras entrar con Google la ficha nace solo con el email: se piden los datos que faltan. */
  async completarSiFalta(){
    const c=TPEmpresa.ficha,u=tpCompany;if(!c||!u)return;
    const m=u.user_metadata||{};
    const vacia=!c.company_name||c.company_name===u.email||c.company_name===c.contact_name||!c.company_size;
    if(!vacia)return;
    // Registro con email: los datos ya están en la cuenta; solo faltaba copiarlos a la ficha pública.
    if(m.company&&m.size){
      await TPCloud.saveCompany(u,{companyName:m.company,contactName:m.contact_name||m.full_name,jobTitle:m.position,companySize:m.size}).catch(()=>{});
      return;
    }
    if(TPEmpresa._preguntado)return;TPEmpresa._preguntado=true;
    tpDialogoDatosEmpresa();
  }
};

/** Propone un nombre a partir del dominio corporativo (acme-iberica.es → Acme Iberica). */
function tpNombreDesdeDominio(email){
  const d=String(email||'').toLowerCase().split('@')[1]||'';
  const gratis=/^(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|proton|protonmail|gmx|aol)\./;
  if(!d||gratis.test(d))return '';
  return d.split('.')[0].split(/[-_]/).filter(Boolean).map(p=>p[0].toUpperCase()+p.slice(1)).join(' ');
}

function tpDialogoDatosEmpresa(){
  if(document.getElementById('tpDatosEmpresa'))return;
  const u=tpCompany||{},m=u.user_metadata||{};
  const dom=(String(u.email||'').split('@')[1]||'').toLowerCase();
  const nombre=tpNombreDesdeDominio(u.email);
  const web=nombre?'https://'+dom:'';
  const d=document.createElement('dialog');
  d.id='tpDatosEmpresa';d.className='tp-dialogo tp-dialogo-ancho';
  d.setAttribute('aria-labelledby','tpDatosEmpresaT');
  d.innerHTML='<form method="dialog" novalidate><h3 id="tpDatosEmpresaT">Completa los datos de tu empresa</h3>'+
    '<p>Es lo que verán los candidatos en tus ofertas. Lo puedes cambiar después en Ajustes.</p>'+
    '<div class="pj-grid">'+
    '<div class="pj-field pj-full"><label for="tde-empresa">Nombre de la empresa</label><input id="tde-empresa" autocomplete="organization" maxlength="120"></div>'+
    '<div class="pj-field"><label for="tde-nombre">Tu nombre</label><input id="tde-nombre" autocomplete="name" maxlength="120"></div>'+
    '<div class="pj-field"><label for="tde-cargo">Tu cargo</label><input id="tde-cargo" autocomplete="organization-title" maxlength="120" placeholder="Ej.: Responsable de selección"></div>'+
    '<div class="pj-field"><label for="tde-tam">Tamaño</label><select id="tde-tam"><option value="">Selecciona…</option><option>1-10 (Startup)</option><option>11-50</option><option>51-200</option><option>201-1000</option><option>+1000</option></select></div>'+
    '<div class="pj-field"><label for="tde-web">Web</label><input id="tde-web" type="url" inputmode="url" maxlength="200" placeholder="https://empresa.com"></div>'+
    '</div><div class="tp-dialogo-msg" id="tde-msg" role="status" aria-live="polite"></div>'+
    '<div class="tp-dialogo-acc"><button type="button" class="btn btn-outline" data-r="luego">Más tarde</button><button type="submit" class="btn btn-primary" id="tde-ok">Guardar</button></div></form>';
  document.body.appendChild(d);
  d.querySelector('#tde-empresa').value=m.company||nombre;
  d.querySelector('#tde-nombre').value=m.contact_name||m.full_name||m.name||'';
  d.querySelector('#tde-cargo').value=m.position||'';
  d.querySelector('#tde-web').value=m.web||web;
  if(m.size)d.querySelector('#tde-tam').value=m.size;
  const cerrar=()=>{try{d.close();}catch(e){}d.remove();};
  d.querySelector('[data-r=luego]').onclick=cerrar;
  d.addEventListener('cancel',e=>{e.preventDefault();cerrar();});
  d.querySelector('form').onsubmit=async e=>{
    e.preventDefault();
    const v=id=>(d.querySelector('#'+id).value||'').trim();
    const msg=d.querySelector('#tde-msg');
    if(!v('tde-empresa')){msg.textContent='Indica el nombre de la empresa.';d.querySelector('#tde-empresa').focus();return;}
    if(!v('tde-tam')){msg.textContent='Indica el tamaño de la empresa.';d.querySelector('#tde-tam').focus();return;}
    let w=v('tde-web');if(w&&!/^https?:\/\//i.test(w))w='https://'+w;
    const btn=d.querySelector('#tde-ok');btn.disabled=true;msg.textContent='Guardando…';
    try{
      await TPCloud.saveMeta({company:v('tde-empresa'),contact_name:v('tde-nombre'),position:v('tde-cargo'),size:v('tde-tam'),web:w});
      const r=await TPCloud.saveCompany(tpCompany,{companyName:v('tde-empresa'),contactName:v('tde-nombre'),jobTitle:v('tde-cargo'),companySize:v('tde-tam'),website:w});
      if(!r||r.error)throw new Error((r&&(r.details||r.error))||'error');
      TPEmpresa.ficha=r.company||TPEmpresa.ficha;TPEmpresa.verificacion=r.verificacion||TPEmpresa.verificacion;
      if(typeof applyCompanyIdentity==='function')applyCompanyIdentity();
      TPEmpresa.pintar();cerrar();
      toast('Datos de la empresa guardados.','ok');
    }catch(err){msg.textContent='No se pudo guardar: '+authErrorText(err);btn.disabled=false;}
  };
  d.showModal();
}

/** Botón «Verificar con Google»: vuelve a entrar con la cuenta de Google de la empresa. */
async function tpVerificarConGoogle(){
  const prov=await TPCloud.providers().catch(()=>({}));
  if(prov.google===false){toast('El acceso con Google todavía no está activado. Escríbenos y verificamos tu empresa a mano.');return;}
  const ok=await tpConfirmar({titulo:'Verificar con Google',texto:'Vas a entrar con Google. Usa la cuenta de tu empresa (la de Google Workspace, con el dominio de la empresa): si es la misma dirección que tu cuenta actual, quedará verificada al momento.',si:'Continuar con Google',no:'Cancelar'});
  if(ok)TPCloud.signInWithProvider('google','empresa').catch(e=>toast('No se pudo abrir Google: '+authErrorText(e)));
}

// Al abrir el panel de empresa con cuenta, se carga la ficha y su verificación.
(function(){
  const _abrir=openDashEmp;
  openDashEmp=function(){
    _abrir.apply(this,arguments);
    if(tpCompany)TPEmpresa.cargar();else TPEmpresa.pintar();
  };
})();
