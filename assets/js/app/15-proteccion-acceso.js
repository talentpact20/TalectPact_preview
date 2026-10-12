// TalentPact · 15-proteccion-acceso
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══════════════════════════════════════════════════════════════════════════
// TPAuthGuard — capas de protección del acceso
// · Bloqueo progresivo tras intentos fallidos (además del límite de Supabase).
// · Política de contraseñas común a registro, recuperación y cambio.
// · Cierre de sesión por inactividad: el panel de empresa muestra datos
//   personales desbloqueados y no debe quedar abierto en un equipo compartido.
// ═══════════════════════════════════════════════════════════════════════════
var TPAuthGuard={
  MAX:5,BASE_S:30,TOPE_S:900,INACTIVIDAD_MS:30*60*1000,
  _st(){return TP.load('authGuard',{fails:0,until:0,locks:0});},
  bloqueado(){const s=TPAuthGuard._st();const r=Math.ceil((s.until-Date.now())/1000);return r>0?r:0;},
  fallo(){
    const s=TPAuthGuard._st();s.fails++;
    if(s.fails>=TPAuthGuard.MAX){s.locks++;s.fails=0;s.until=Date.now()+Math.min(TPAuthGuard.TOPE_S,TPAuthGuard.BASE_S*Math.pow(2,s.locks-1))*1000;}
    TP.save('authGuard',s);
    return TPAuthGuard.MAX-s.fails;
  },
  ok(){TP.save('authGuard',{fails:0,until:0,locks:0});},
  mensajeBloqueo(seg){return 'Demasiados intentos fallidos. Por seguridad, espera '+(seg>=60?Math.ceil(seg/60)+' min':seg+' s')+' antes de volver a intentarlo o recupera tu contraseña.';},
  _ultima:Date.now(),
  vigilarInactividad(){
    ['pointerdown','keydown','scroll','touchstart'].forEach(t=>document.addEventListener(t,()=>{TPAuthGuard._ultima=Date.now();},{passive:true}));
    setInterval(async()=>{
      if(!(tpUser||tpCompany))return;
      if(Date.now()-TPAuthGuard._ultima<TPAuthGuard.INACTIVIDAD_MS)return;
      TPAuthGuard._ultima=Date.now();
      try{await TPCloud.signOut();}catch(e){}
      tpUser=null;tpCompany=null;
      ['dashCandidate','dashEmpresa'].forEach(id=>{const d=document.getElementById(id);if(d)d.classList.remove('open');});
      document.body.style.overflow='';
      toast('Sesión cerrada tras 30 minutos de inactividad. Vuelve a entrar para continuar.');
    },60000);
  }
};
// Devuelve el problema de una contraseña, o '' si es aceptable.
function pwPolicyError(pw,email){
  const v=String(pw||'');
  if(v.length<10)return 'La contraseña debe tener al menos 10 caracteres.';
  if(!/[A-Za-zÀ-ÿ]/.test(v)||!/\d/.test(v))return 'Combina letras y números.';
  if(/^(.)\1+$/.test(v)||/^(1234567890|password|contrasena|contraseña|qwerty|talentpact)/i.test(v))return 'Esa contraseña es demasiado común.';
  const local=String(email||'').split('@')[0].toLowerCase();
  if(local.length>=4&&v.toLowerCase().includes(local))return 'La contraseña no puede contener tu email.';
  return '';
}
TPAuthGuard.vigilarInactividad();

// Primer pintado con los módulos ya cargados.
try{if(typeof _ultimasOfertas!=='undefined'&&_ultimasOfertas.length)renderJobs(_ultimasOfertas);}catch(e){}
try{syncMyPoolEntry();}catch(e){}

