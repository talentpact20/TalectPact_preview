// TalentPact · 09-acceso
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ AUTH ═══
function openAuth(t){
  if(t==='candidate'&&tpUser){openDashCand();return;}
  if(t==='empresa'&&tpCompany){openDashEmp();return;}
  _authOpener=document.activeElement;
  const pre=t==='candidate'?'cand':'emp';
  const ov=document.getElementById(t==='candidate'?'authCandidate':'authEmpresa');
  ov.classList.add('open');
  document.body.style.overflow='hidden';
  clearAuthMsgs();
  // Si la vez anterior se quedo en "recuperar contrasena", se vuelve al login.
  showRecover(pre,false);
  const tabs=document.getElementById(pre==='cand'?'candTabs':'empTabs');
  const first=tabs&&tabs.querySelector('.auth-tab');
  if(first&&!first.classList.contains('active'))switchAuthTab(pre,'login',first);
  else focusFirstField(document.getElementById(pre+'-login'));
  clearFieldErrors(pre+'-login'); clearFieldErrors(pre+'-register');
  refreshOAuthButtons(t==='candidate'?'candidate':'empresa');
}

function closeAuth(id){
  const ov=document.getElementById(id); if(!ov)return;
  const wasOpen=ov.classList.contains('open');
  ov.classList.remove('open');
  document.body.style.overflow='';
  // Devolver el foco evita que el lector de pantalla acabe al principio del documento.
  if(wasOpen&&_authOpener&&document.contains(_authOpener)){
    try{ _authOpener.focus({preventScroll:true}); }catch(e){}
    _authOpener=null;
  }
}

// Trampa de foco: con aria-modal="true" el Tab no debe salirse del dialogo.
document.addEventListener('keydown',function(e){
  if(e.key!=='Tab')return;
  const ov=document.querySelector('.auth-overlay.open'); if(!ov)return;
  const f=[].slice.call(ov.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])'))
            .filter(el=>el.offsetParent!==null);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
});
function switchAuthTab(pre,tab,btn){
  btn.parentElement.querySelectorAll('.auth-tab').forEach(t=>{
    const on=t===btn;
    t.classList.toggle('active',on);
    t.setAttribute('aria-selected',on?'true':'false');
    t.tabIndex=on?0:-1;          // solo la pestaña activa entra en el orden de tabulación
  });
  const l=document.getElementById(pre+'-login'),
        r=document.getElementById(pre+'-register'),
        rec=document.getElementById(pre+'-recover');
  if(l)l.style.display=tab==='login'?'flex':'none';
  if(r)r.style.display=tab==='register'?'flex':'none';
  if(rec)rec.style.display='none';   // cambiar de pestaña sale de la recuperación
  clearAuthMsgs();
  focusFirstField(tab==='login'?l:r);
}

// Flechas para moverse entre pestañas, como espera un lector de pantalla.
function authTabKeys(ev){
  if(ev.key!=='ArrowLeft'&&ev.key!=='ArrowRight')return;
  const tabs=[].slice.call(ev.currentTarget.parentElement.querySelectorAll('.auth-tab'));
  const i=tabs.indexOf(ev.currentTarget);
  const next=tabs[(i+(ev.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
  if(next){ ev.preventDefault(); next.focus(); next.click(); }
}

// Enfoca el primer campo vacío del formulario; si están todos llenos, el primero.
function focusFirstField(form){
  if(!form||form.style.display==='none')return;
  const fields=[].slice.call(form.querySelectorAll('input:not([type=hidden]),select,textarea'));
  if(!fields.length)return;
  const target=fields.find(f=>!f.value)||fields[0];
  // El foco se aplaza: si el modal aún se está abriendo, el navegador lo ignora.
  setTimeout(()=>{ try{ target.focus({preventScroll:true}); }catch(e){ target.focus(); } },60);
}

// ═══ RECUPERACIÓN DE CONTRASEÑA ═══
// Alterna entre el formulario de acceso y el de "envíame un enlace".
function showRecover(pre,on){
  const login=document.getElementById(pre+'-login');
  const reg=document.getElementById(pre+'-register');
  const rec=document.getElementById(pre+'-recover');
  const tabs=document.getElementById(pre==='cand'?'candTabs':'empTabs');
  if(!login||!rec)return;
  clearAuthMsgs();
  authMsg('','',pre==='cand'?'candRec':'empRec');
  const title=document.getElementById(pre+'AuthTitle');
  const sub=document.getElementById(pre+'AuthSub');
  // Se guarda el encabezado original la primera vez para poder restaurarlo.
  if(title&&!title.dataset.original)title.dataset.original=title.textContent;
  if(sub&&!sub.dataset.original)sub.dataset.original=sub.textContent;

  if(on){
    // Arrastra el email ya escrito: pedirlo dos veces es fricción gratuita.
    const typed=(document.getElementById(pre+'-login-email')||{}).value||'';
    const box=document.getElementById(pre+'-rec-email');
    if(box&&typed&&!box.value)box.value=typed;
    login.style.display='none';
    if(reg)reg.style.display='none';
    rec.style.display='flex';
    if(tabs)tabs.style.display='none';   // no son pestañas de este paso
    if(title)title.textContent='Recuperar acceso.';
    if(sub)sub.textContent='Te mandamos un enlace para elegir una contraseña nueva.';
    focusFirstField(rec);
  }else{
    rec.style.display='none';
    login.style.display='flex';
    if(tabs)tabs.style.display='flex';
    if(title&&title.dataset.original)title.textContent=title.dataset.original;
    if(sub&&sub.dataset.original)sub.textContent=sub.dataset.original;
    focusFirstField(login);
  }
}

async function sendRecovery(pre){
  const box=pre==='cand'?'candRec':'empRec';
  const input=document.getElementById(pre+'-rec-email');
  const email=((input||{}).value||'').trim();
  authMsg('','',box);
  if(!fieldValid(pre+'-rec-email',isEmailValid(email),'Introduce el email con el que creaste la cuenta.'))return;
  const done=btnBusy(pre+'RecBtn','Enviando…');
  try{
    await TPCloud.resetPassword(email);
    // Nunca se confirma si el email existe: eso permitiría enumerar cuentas.
    authMsg('ok','Si hay una cuenta con '+email+', el enlace ya va de camino. Revisa también la carpeta de spam.',box);
  }catch(e){
    authMsg('err',authErrorText(e),box);
  }finally{ done(); }
}

// Al volver del enlace, Supabase ya ha canjeado una sesión de recuperación:
// aquí solo se fija la contraseña nueva.
async function applyNewPassword(){
  const a=(document.getElementById('rec-pw1')||{}).value||'';
  const b=(document.getElementById('rec-pw2')||{}).value||'';
  authMsg('','','rec');
  if(!fieldValid('rec-pw1',!pwPolicyError(a),pwPolicyError(a)))return;
  if(!fieldValid('rec-pw2',a===b,'Las dos contraseñas no coinciden.'))return;
  const done=btnBusy('recBtn','Guardando…');
  try{
    await TPCloud.updatePassword(a);
    authMsg('ok','Contraseña actualizada. Abriendo tu panel…','rec');
    const u=await TPCloud.currentUser();
    closeAuth('authRecovery');
    cleanAuthUrl();
    if(u&&(u.user_metadata||{}).role==='empresa'){ tpCompany=u; openDashEmp(); }
    else if(u){ tpUser=u; await TPCloud.loadProgressIntoProfile(u); openDashCand(); }
    else openAuth('candidate');
  }catch(e){
    // El enlace caduca en una hora y solo sirve una vez.
    const m=((e&&e.message)||'').toLowerCase();
    if(m.includes('expired')||m.includes('invalid')||m.includes('session')){
      authMsg('err','El enlace de recuperación ha caducado o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?».','rec');
    }else authMsg('err',authErrorText(e),'rec');
  }finally{ done(); }
}

// Abre la pantalla de nueva contraseña y comprueba que la sesión de
// recuperación existe de verdad antes de dejar escribir nada.
async function openRecoveryScreen(){
  const ov=document.getElementById('authRecovery'); if(!ov)return;
  _authOpener=null;
  ov.classList.add('open');
  document.body.style.overflow='hidden';
  let u=null;
  try{ u=await TPCloud.currentUser(); }catch(e){}
  const em=document.getElementById('recEmail');
  if(em)em.textContent=(u&&u.email)||'tu cuenta';
  const hidden=document.getElementById('recUser');
  if(hidden)hidden.value=(u&&u.email)||'';
  if(!u){
    // Sin sesión el enlace ya no vale: decirlo ahora, no tras escribir la contraseña.
    authMsg('err','Este enlace de recuperación ha caducado o ya se usó. Vuelve al inicio y pide uno nuevo desde «¿Olvidaste tu contraseña?».','rec');
    const b=document.getElementById('recBtn'); if(b)b.disabled=true;
    return;
  }
  focusFirstField(document.getElementById('rec-form'));
}

function cancelRecovery(){
  closeAuth('authRecovery');
  cleanAuthUrl();
  TPCloud.signOut().catch(()=>{});   // la sesión de recuperación no debe quedar viva
  goHome();
}

// ═══ VALIDACIÓN POR CAMPO ═══
// Marca el campo y escribe el motivo debajo, en vez de un único mensaje global
// que obliga a adivinar cuál de los seis campos está mal.
function fieldError(id,msg){
  const input=document.getElementById(id);
  const box=document.getElementById(id+'-err');
  if(input){
    input.setAttribute('aria-invalid',msg?'true':'false');
    if(box)input.setAttribute('aria-describedby',id+'-err');
  }
  if(box){ box.textContent=msg||''; box.classList.toggle('show',!!msg); }
  return !msg;
}
/** Comprueba una condición, pinta el error si falla y enfoca el campo. */
function fieldValid(id,cond,msg){
  fieldError(id,cond?'':msg);
  if(!cond){ const el=document.getElementById(id); if(el)el.focus(); }
  return cond;
}
function clearFieldErrors(formId){
  const f=document.getElementById(formId); if(!f)return;
  f.querySelectorAll('.a-err').forEach(b=>{ b.textContent=''; b.classList.remove('show'); });
  f.querySelectorAll('[aria-invalid]').forEach(i=>i.setAttribute('aria-invalid','false'));
}

// ═══ FUERZA DE CONTRASEÑA ═══
// Orientativa: el único requisito real siguen siendo 8 caracteres. Puntúa
// longitud y variedad, y penaliza los patrones más habituales.
function pwStrength(inputId,meterId){
  const v=((document.getElementById(inputId)||{}).value)||'';
  const m=document.getElementById(meterId); if(!m)return;
  if(!v){ m.className='pw-meter'; return; }
  let score=0;
  if(v.length>=8)score++;
  if(v.length>=12)score++;
  if(/[a-z]/.test(v)&&/[A-Z]/.test(v))score++;
  if(/\d/.test(v)&&/[^\w\s]/.test(v))score++;
  if(v.length<10)score=0;
  if(/^(.)\1+$/.test(v)||/^(123456|password|contrasena|contraseña|qwerty|111111)/i.test(v))score=Math.min(score,1);
  const lvl=Math.max(1,Math.min(4,score));
  const txt=['','Débil: añade longitud','Mejorable: mezcla mayúsculas y números','Buena','Muy buena'][lvl];
  m.className='pw-meter show s'+lvl;
  const lbl=m.querySelector('.pw-meter-lbl');
  if(lbl)lbl.textContent=v.length<10?'Mínimo 10 caracteres':txt;
}

async function loginCandidate(){
  const email=(document.getElementById('cand-login-email').value||'').trim();
  const pw=document.getElementById('cand-login-pw').value||'';
  authMsg('');
  clearFieldErrors('cand-login');
  if(!fieldValid('cand-login-email',isEmailValid(email),'Introduce un email válido.'))return;
  if(!fieldValid('cand-login-pw',!!pw,'Escribe tu contraseña.'))return;
  const espera=TPAuthGuard.bloqueado();
  if(espera){authMsg('err',TPAuthGuard.mensajeBloqueo(espera));return;}
  const done=btnBusy('candLoginBtn','Accediendo…');
  try{
    let u;
    try{u=await TPCloud.signIn(email,pw);}
    catch(e){if(e&&(e.status===400||/invalid/i.test(e.message||''))){const quedan=TPAuthGuard.fallo();if(quedan<=2&&quedan>0)e=new Error(authErrorText(e)+' Te quedan '+quedan+' intento(s) antes de un bloqueo temporal.');}throw e;}
    TPAuthGuard.ok();
    // Un email de empresa no debe acabar en el panel de candidato (ni al revés).
    if((u.user_metadata||{}).role==='empresa'){
      await TPCloud.signOut();
      authMsg('err','Esa cuenta es de empresa. Entra desde el portal de empresa.');
      return;
    }
    tpUser=u;
    if(!(u.user_metadata||{}).role)await TPCloud.setRole('candidate');
    authMsg('ok','Sesión iniciada. Abriendo tu panel…');
    await TPCloud.loadProgressIntoProfile(tpUser);
    closeAuth('authCandidate');openDashCand();
  }catch(e){ authMsg('err',authErrorText(e)); }
  finally{ done(); }
}
async function registerCandidate(){
  const name=(document.getElementById('reg-name').value||'').trim();
  const last=(document.getElementById('reg-last').value||'').trim();
  const email=(document.getElementById('reg-email').value||'').trim();
  const phone=(document.getElementById('reg-phone').value||'').trim();
  const linkedin=(document.getElementById('reg-linkedin').value||'').trim();
  const pw=document.getElementById('reg-pw').value||'';
  const sector=document.getElementById('reg-sector').value||'';
  const fullName=(name+' '+last).trim();
  authMsg('','','candReg');
  clearFieldErrors('cand-register');
  if(!fieldValid('reg-name',!!name,'Escribe tu nombre.'))return;
  if(!fieldValid('reg-email',isEmailValid(email),'Introduce un email válido.'))return;
  if(!fieldValid('reg-pw',!pwPolicyError(pw,email),pwPolicyError(pw,email)))return;
  const done=btnBusy('candRegBtn','Creando cuenta…');
  try{
    const data=await TPCloud.signUp(email,pw,{full_name:fullName,sector,role:'candidate'});
    if(!data.session){ authMsg('info','Cuenta creada. Confirma el email que te hemos enviado y vuelve a entrar.','candReg'); return; }
    tpUser=data.user;
    authMsg('ok','Cuenta creada. Abriendo tu panel…','candReg');
    await TPCloud.saveProfile(tpUser,{fullName,sector,phone,linkedin});
    await TPCloud.loadProgressIntoProfile(tpUser);
    closeAuth('authCandidate');openDashCand();
  }catch(e){ authMsg('err',authErrorText(e),'candReg'); }
  finally{ done(); }
}
function guestCandidate(){clearAuthMsgs();closeAuth('authCandidate');openDashCand();}

// ═══ ACCESO SOCIAL (Google / LinkedIn vía Supabase Auth) ═══
// Mensaje inline dentro de un formulario de acceso (sustituye a los alert()).
// box: 'candidate' | 'empresa' | 'candReg' | 'empReg'
function authMsg(kind,text,box){
  const el=document.getElementById(AUTH_MSG_BOX[box||'candidate']); if(!el)return;
  if(!kind||!text){ el.className='auth-oauth-msg'; el.textContent=''; return; }
  el.className='auth-oauth-msg show '+kind; el.textContent=text;
}
function clearAuthMsgs(){ Object.keys(AUTH_MSG_BOX).forEach(k=>authMsg('','',k)); }

const isEmailValid=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v||'');

// Traduce los errores de Supabase Auth a algo accionable en castellano.
function authErrorText(e){
  const m=((e&&e.message)||String(e||'')).toLowerCase();
  if(m.includes('invalid login credentials'))return 'Email o contraseña incorrectos.';
  if(m.includes('email not confirmed'))return 'Tu email todavía no está confirmado. Revisa tu bandeja de entrada.';
  if(m.includes('already registered')||m.includes('already exists'))return 'Ya existe una cuenta con ese email. Inicia sesión.';
  if(m.includes('password should be at least'))return 'La contraseña es demasiado corta.';
  if(m.includes('invalid email')||m.includes('unable to validate email'))return 'El email no tiene un formato válido.';
  if(m.includes('rate limit')||m.includes('too many'))return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
  if(m.includes('failed to fetch')||m.includes('networkerror')||m.includes('load failed'))return 'Sin conexión con el servidor de cuentas. Comprueba tu red.';
  if(m.includes('auth no disponible'))return 'El servicio de cuentas no ha cargado. Recarga la página.';
  return (e&&e.message)||'Ha ocurrido un error inesperado.';
}

// Deja un botón en estado "trabajando" y devuelve la función que lo restaura.
function btnBusy(id,label){
  const b=document.getElementById(id);
  if(!b)return function(){};
  const prev=b.innerHTML,wasOff=b.disabled;
  b.disabled=true; b.textContent=label;
  return function(){ b.disabled=wasOff; b.innerHTML=prev; };
}

function togglePw(id,btn){
  const i=document.getElementById(id); if(!i)return;
  const show=i.type==='password';
  i.type=show?'text':'password';
  btn.textContent=show?'Ocultar':'Ver';
  btn.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');
  i.focus();
}

// Aviso de Bloq Mayús: la causa más habitual de "mi contraseña no funciona".
function capsHint(ev,id){
  const el=document.getElementById(id);
  if(!el||!ev||!ev.getModifierState)return;
  el.classList.toggle('show',ev.getModifierState('CapsLock'));
}

// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES DE CUENTA — candidato y empresa
// Todo lo de estos paneles opera de verdad: los datos se leen y se escriben en
// Supabase (perfil + user_metadata) y las preferencias cambian de verdad lo que
// ve la otra parte. Lo que no tiene backend en esta version se marca como
// "No disponible" en la interfaz en lugar de fingir que funciona.
// ═══════════════════════════════════════════════════════════════════════════

function stMsg(id,kind,text){
  const el=document.getElementById(id); if(!el)return;
  if(!kind||!text){ el.className='st-msg'; el.textContent=''; return; }
  el.className='st-msg show '+kind; el.textContent=text;
}
const _val=(id,v)=>{const e=document.getElementById(id); if(!e)return ''; if(v!==undefined)e.value=v==null?'':v; return (e.value||'').trim();};

// ─── Preferencias ─────────────────────────────────────────────────────────
const PREF_DEFAULTS={
  cand:{poolVisible:true,allowContact:true,publicRanking:true,notifyResult:true,notifyUnlock:true,notifyMatches:true,notifyWeekly:false},
  emp:{notifyMatch:true,notifyUnlock:true,notifyChallenge:true,notifyWeekly:false,paused:false}
};
const TPPrefs={
  _v:{cand:null,emp:null},
  all(role){
    if(TPPrefs._v[role])return TPPrefs._v[role];
    const u=role==='cand'?tpUser:tpCompany;
    const cloud=(u&&u.user_metadata&&u.user_metadata.prefs)||null;
    const local=TP.load('prefs:'+role,null);
    TPPrefs._v[role]=Object.assign({},PREF_DEFAULTS[role],local||{},cloud||{});
    return TPPrefs._v[role];
  },
  get(role,key){ return TPPrefs.all(role)[key]; },
  invalidate(){ TPPrefs._v={cand:null,emp:null}; },
  // Guarda siempre en local (para el modo invitado) y, si hay cuenta, en Supabase.
  async set(role,key,val){
    const p=TPPrefs.all(role); p[key]=val;
    TP.save('prefs:'+role,p);
    const u=role==='cand'?tpUser:tpCompany;
    if(!u)return 'local';
    try{ await TPCloud.saveMeta({prefs:p}); return 'cloud'; }catch(e){ console.warn('[TP] prefs',e); return 'error'; }
  }
};
// Lectura tolerante: si se consulta antes de que el bloque este inicializado,
// devuelve el valor por defecto en vez de reventar.
function prefIsOn(role,key,def){
  try{ const v=TPPrefs.get(role,key); return v===undefined?def:v; }catch(e){ return def; }
}
// Caja de mensajes de la misma tarjeta donde esta el interruptor.
function _prefBox(role,key){
  const t=document.getElementById('pref-'+role+'-'+key);
  const card=t&&t.closest('.st-card');
  let box=card&&card.querySelector('.st-msg');
  if(card&&!box){ box=document.createElement('div'); box.className='st-msg'; box.id='autoprefmsg-'+role+'-'+key; card.appendChild(box); }
  return box?(box.id||(box.id='autoprefmsg-'+role+'-'+key)):null;
}
async function setPref(role,key,val){
  const box=_prefBox(role,key);
  const r=await TPPrefs.set(role,key,val);
  applyPrefEffects(role);
  if(box){
    if(r==='cloud')stMsg(box,'ok','Guardado en tu cuenta.');
    else if(r==='local')stMsg(box,'info','Guardado en este navegador (estás como invitado).');
    else stMsg(box,'err','Guardado aquí, pero no se pudo sincronizar con tu cuenta.');
  }
}
// Repinta lo que depende de las preferencias.
function applyPrefEffects(role){
  if(role==='cand'){
    syncMyPoolEntry();
    const d=document.getElementById('dashCandidate');
    if(d&&d.classList.contains('open')){ try{renderRanking('all');}catch(e){} }
  }else{
    const d=document.getElementById('dashEmpresa');
    if(d&&d.classList.contains('open')){ try{renderEmpJobs();renderEmpUsage();}catch(e){} }
  }
}

// ─── Sesion: descripcion honesta de lo que sabemos ────────────────────────
function sessionLine(user){
  if(!user)return 'Estás explorando como invitado (sin cuenta).';
  const ua=navigator.userAgent||'';
  const nav=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Navegador';
  const os=/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'macOS':/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Linux/.test(ua)?'Linux':'—';
  const last=user.last_sign_in_at?new Date(user.last_sign_in_at).toLocaleString('es-ES'):'—';
  return nav+' · '+os+' · último acceso: '+last;
}

// ─── Panel de candidato ───────────────────────────────────────────────────
function loadCandSettings(){
  const who=document.getElementById('stCandWho');
  const m=(tpUser&&tpUser.user_metadata)||{};
  const full=(m.full_name||'').trim();
  const parts=full?full.split(/\s+/):[];
  if(who)who.textContent=tpUser?('Cuenta de candidato · '+(full||tpUser.email)):'Explorando como invitado (sin cuenta)';
  _val('st-cand-name',parts[0]||'');
  _val('st-cand-last',parts.slice(1).join(' '));
  _val('st-cand-email',(tpUser&&tpUser.email)||'');
  _val('st-cand-pw-user',(tpUser&&tpUser.email)||'');   // usuario oculto para el gestor de contraseñas
  _val('st-cand-sector',m.sector||'');
  _val('st-cand-city',m.city||'');
  _val('st-cand-linkedin',m.linkedin||'');
  _val('st-cand-phone',m.phone||'');
  _val('st-cand-portfolio',m.portfolio||'');
  const sess=document.getElementById('st-cand-session'); if(sess)sess.textContent=sessionLine(tpUser);
  ['st-cand-others','st-cand-export'].forEach(id=>{const b=document.getElementById(id); if(b&&id==='st-cand-others')b.disabled=!tpUser;});
  const p=TPPrefs.all('cand');
  Object.keys(PREF_DEFAULTS.cand).forEach(k=>{const el=document.getElementById('pref-cand-'+k); if(el)el.checked=!!p[k];});
  stMsg('st-cand-msg', tpUser?'':'info', tpUser?'':'Estás como invitado: para guardar tus datos crea una cuenta o inicia sesión.');
  // El perfil de la nube puede traer datos que no estan en user_metadata.
  if(tpUser){
    TPCloud.getProgress(tpUser).then(function(r){
      const pr=r&&r.profile; if(!pr)return;
      if(!_val('st-cand-name')&&pr.full_name){ const q=pr.full_name.split(/\s+/); _val('st-cand-name',q[0]||''); _val('st-cand-last',q.slice(1).join(' ')); }
      if(!_val('st-cand-sector')&&pr.sector)_val('st-cand-sector',pr.sector);
      if(!_val('st-cand-phone')&&pr.phone)_val('st-cand-phone',pr.phone);
      if(!_val('st-cand-linkedin')&&pr.linkedin)_val('st-cand-linkedin',pr.linkedin);
    }).catch(function(){});
  }
}

async function saveCandSettings(){
  const name=_val('st-cand-name'), last=_val('st-cand-last');
  const email=_val('st-cand-email'), sector=_val('st-cand-sector');
  const city=_val('st-cand-city'), linkedin=_val('st-cand-linkedin');
  const phone=_val('st-cand-phone'), portfolio=_val('st-cand-portfolio');
  const fullName=(name+' '+last).trim();
  stMsg('st-cand-msg','','');
  if(!name){ stMsg('st-cand-msg','err','El nombre no puede quedar vacío.'); return; }
  if(email&&!isEmailValid(email)){ stMsg('st-cand-msg','err','El email no tiene un formato válido.'); return; }

  if(!tpUser){
    TP.save('guestProfile',{fullName,sector,city,linkedin,phone,portfolio});
    const el=document.getElementById('candName'); if(el)el.textContent=fullName||'Candidato';
    stMsg('st-cand-msg','info','Guardado en este navegador. Crea una cuenta para conservarlo en cualquier dispositivo.');
    return;
  }
  const done=btnBusy('st-cand-save','Guardando…');
  try{
    await TPCloud.saveMeta({full_name:fullName,sector,city,linkedin,phone,portfolio});
    const r=await TPCloud.saveProfile(tpUser,{fullName,sector,phone,linkedin});
    if(r&&r.error)throw new Error(r.details||r.error);
    let extra='';
    if(email&&email!==tpUser.email){
      await TPCloud.updateEmail(email);
      extra=' Te hemos enviado un correo a '+email+' para confirmar el cambio de email.';
    }
    const el=document.getElementById('candName'); if(el)el.textContent=fullName||tpUser.email;
    const av=document.getElementById('candAvatar'); if(av)av.textContent=((fullName||'C').trim()[0]||'C').toUpperCase();
    stMsg('st-cand-msg','ok','Cambios guardados.'+extra);
  }catch(e){ stMsg('st-cand-msg','err','No se pudo guardar: '+authErrorText(e)); }
  finally{ done(); }
}

// ─── Panel de empresa ─────────────────────────────────────────────────────
function loadEmpSettings(){
  const m=(tpCompany&&tpCompany.user_metadata)||{};
  const who=document.getElementById('stEmpWho');
  if(who)who.textContent=tpCompany?('Cuenta de empresa · '+companyName()):'Explorando como invitado (sin cuenta)';
  _val('st-emp-pw-user',(tpCompany&&tpCompany.email)||'');   // usuario oculto para el gestor de contraseñas
  _val('st-emp-company',m.company||'');
  _val('st-emp-sector',m.sector||'');
  _val('st-emp-size',m.size||'');
  _val('st-emp-web',m.web||'');
  _val('st-emp-contact',m.contact_name||'');
  _val('st-emp-position',m.position||'');
  _val('st-emp-desc',m.description||'');
  _val('st-emp-location',m.location||'');
  const b=m.billing||{};
  _val('st-emp-legal',b.legal||m.company||'');
  _val('st-emp-taxid',b.taxId||'');
  _val('st-emp-billmail',b.email||'');
  _val('st-emp-phone',b.phone||'');
  _val('st-emp-address',b.address||'');
  const sess=document.getElementById('st-emp-session'); if(sess)sess.textContent=sessionLine(tpCompany);
  const others=document.getElementById('st-emp-others'); if(others)others.disabled=!tpCompany;
  const p=TPPrefs.all('emp');
  Object.keys(PREF_DEFAULTS.emp).forEach(k=>{const el=document.getElementById('pref-emp-'+k); if(el)el.checked=!!p[k];});
  const pause=document.getElementById('st-emp-pause'); if(pause)pause.textContent=p.paused?'Reactivar cuenta':'Pausar cuenta';
  stMsg('st-emp-msg', tpCompany?'':'info', tpCompany?'':'Estás como invitado: para guardar los datos de tu empresa crea una cuenta.');
  renderEmpUsage(); renderEmpPayments();
}

async function saveEmpSettings(){
  const company=_val('st-emp-company');
  stMsg('st-emp-msg','','');
  if(!company){ stMsg('st-emp-msg','err','El nombre de la empresa no puede quedar vacío.'); return; }
  if(!tpCompany){ stMsg('st-emp-msg','info','Estás como invitado: crea una cuenta de empresa para guardar estos datos.'); return; }
  const done=btnBusy('st-emp-save','Guardando…');
  try{
    await TPCloud.saveMeta({
      company,
      sector:_val('st-emp-sector'),
      size:_val('st-emp-size'),
      web:_val('st-emp-web'),
      contact_name:_val('st-emp-contact'),
      position:_val('st-emp-position'),
      description:_val('st-emp-desc'),
      location:_val('st-emp-location')
    });
    // La ficha pública de empresa (la que ven los candidatos en cada oferta)
    // vive en la tabla companies: se guarda también allí.
    let web=_val('st-emp-web');
    if(web&&!/^https?:\/\//i.test(web))web='https://'+web;
    const r=await TPCloud.saveCompany(tpCompany,{companyName:company,contactName:_val('st-emp-contact'),jobTitle:_val('st-emp-position'),
      companySize:_val('st-emp-size'),description:_val('st-emp-desc'),sector:_val('st-emp-sector'),website:web,location:_val('st-emp-location')});
    if(r&&r.error)throw new Error(r.details||r.error);
    applyCompanyIdentity();
    const who=document.getElementById('stEmpWho'); if(who)who.textContent='Cuenta de empresa · '+companyName();
    stMsg('st-emp-msg','ok','Perfil de empresa guardado.');
  }catch(e){ stMsg('st-emp-msg','err','No se pudo guardar: '+authErrorText(e)); }
  finally{ done(); }
}

async function saveEmpBilling(){
  stMsg('st-emp-bill-msg','','');
  if(!tpCompany){ stMsg('st-emp-bill-msg','info','Estás como invitado: crea una cuenta para guardar los datos de facturación.'); return; }
  const mail=_val('st-emp-billmail');
  if(mail&&!isEmailValid(mail)){ stMsg('st-emp-bill-msg','err','El email de facturación no tiene un formato válido.'); return; }
  const done=btnBusy('st-emp-bill-save','Guardando…');
  try{
    await TPCloud.saveMeta({billing:{
      legal:_val('st-emp-legal'), taxId:_val('st-emp-taxid'),
      email:mail, phone:_val('st-emp-phone'), address:_val('st-emp-address')
    }});
    stMsg('st-emp-bill-msg','ok','Datos de facturación guardados en tu cuenta.');
  }catch(e){ stMsg('st-emp-bill-msg','err','No se pudo guardar: '+authErrorText(e)); }
  finally{ done(); }
}

// Uso real de la cuenta: nada de cifras inventadas.
function renderEmpUsage(){
  const box=document.getElementById('st-emp-usage'); if(!box)return;
  const mine=(typeof myPostedJobs==='function')?myPostedJobs():[];
  const pays=myPayments();
  const rows=[
    ['Ofertas publicadas por ti',mine.length],
    ['Ofertas activas ahora',mine.filter(j=>!j.paused).length],
    ['Contactos desbloqueados',pays.length],
    ['Importe acumulado (simulado)','€'+(pays.length*49)],
    ['Candidatos visibles en el pool',CANDIDATES.length]
  ];
  box.innerHTML=rows.map(r=>'<div class="st-kv"><span>'+escHtml(r[0])+'</span><strong>'+escHtml(String(r[1]))+'</strong></div>').join('');
}
function myPayments(){
  const k=(typeof companyKey==='function')?companyKey():'guest';
  return TP.getPayments().filter(p=>!p.owner||p.owner===k);
}
function renderEmpPayments(){
  const box=document.getElementById('st-emp-payments'); if(!box)return;
  const pays=myPayments().slice().reverse();
  if(!pays.length){ box.innerHTML='<div class="st-empty">Todavía no has desbloqueado ningún contacto.</div>'; return; }
  box.innerHTML=pays.map(function(p){
    const f=p.ts?new Date(p.ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—';
    return '<div class="st-kv"><span>'+escHtml(p.label||('Contacto '+(p.candId||'')))+' · '+escHtml(f)+'</span><strong>€'+escHtml(String(p.amount||49))+'</strong></div>';
  }).join('');
}

// ─── Seguridad (comun a los dos paneles) ──────────────────────────────────
function togglePwForm(role){
  const f=document.getElementById('st-'+role+'-pw-form'); if(!f)return;
  f.classList.toggle('show');
  stMsg('st-'+role+'-pw-msg','','');
}
async function changePassword(role){
  const box='st-'+role+'-pw-msg';
  const user=role==='cand'?tpUser:tpCompany;
  const a=(document.getElementById('st-'+role+'-pw1')||{}).value||'';
  const b=(document.getElementById('st-'+role+'-pw2')||{}).value||'';
  stMsg(box,'','');
  if(!user){ stMsg(box,'err','Estás como invitado: no hay ninguna cuenta a la que cambiarle la contraseña.'); return; }
  if(pwPolicyError(a)){ stMsg(box,'err',pwPolicyError(a)); return; }
  if(a!==b){ stMsg(box,'err','Las dos contraseñas no coinciden.'); return; }
  const done=btnBusy('st-'+role+'-pw-btn','Guardando…');
  try{
    await TPCloud.updatePassword(a);
    document.getElementById('st-'+role+'-pw1').value='';
    document.getElementById('st-'+role+'-pw2').value='';
    stMsg(box,'ok','Contraseña actualizada. Úsala la próxima vez que entres.');
  }catch(e){ stMsg(box,'err',authErrorText(e)); }
  finally{ done(); }
}
async function closeOtherSessions(role){
  const box='st-'+role+'-sec-msg';
  const user=role==='cand'?tpUser:tpCompany;
  stMsg(box,'','');
  if(!user){ stMsg(box,'err','No hay ninguna sesión iniciada.'); return; }
  const done=btnBusy('st-'+role+'-others','Cerrando…');
  try{ await TPCloud.signOutOthers(); stMsg(box,'ok','Cerradas las sesiones abiertas en otros dispositivos. Esta sigue activa.'); }
  catch(e){ stMsg(box,'err',authErrorText(e)); }
  finally{ done(); }
}

function downloadJson(filename,obj){
  try{
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },0);
    return true;
  }catch(e){ console.warn('[TP] descarga',e); return false; }
}

// Portabilidad de datos (RGPD art. 20): se genera en el navegador, sin esperas.
async function exportMyData(){
  const box='st-cand-sec-msg';
  const done=btnBusy('st-cand-export','Preparando…');
  try{
    const data={
      generado:new Date().toISOString(),
      origen:'TalentPact — exportación de datos personales (RGPD art. 20)',
      cuenta:tpUser?{id:tpUser.id,email:tpUser.email,alta:tpUser.created_at,metadatos:tpUser.user_metadata||{}}:'sesión de invitado: solo datos de este navegador',
      preferencias:TPPrefs.all('cand'),
      skills:candidateProfile.skills,
      retosCompletados:candidateProfile.completedCommon,
      evaluacionesIA:TP.getEvals()
    };
    if(tpUser){ try{ data.datosEnLaNube=await TPCloud.getProgress(tpUser); }catch(e){ data.datosEnLaNube='no disponible ('+((e&&e.message)||e)+')'; } }
    const bien=downloadJson('talentpact-mis-datos.json',data);
    stMsg(box,bien?'ok':'err',bien?'Archivo descargado: talentpact-mis-datos.json':'El navegador ha bloqueado la descarga.');
  }catch(e){ stMsg(box,'err','No se pudo generar el archivo: '+((e&&e.message)||e)); }
  finally{ done(); }
}
async function exportEmpData(){
  const box='st-emp-sec-msg';
  const done=btnBusy('st-emp-export','Preparando…');
  try{
    const data={
      generado:new Date().toISOString(),
      origen:'TalentPact — exportación de datos de la cuenta de empresa',
      cuenta:tpCompany?{id:tpCompany.id,email:tpCompany.email,alta:tpCompany.created_at,metadatos:tpCompany.user_metadata||{}}:'sesión de invitado',
      preferencias:TPPrefs.all('emp'),
      ofertas:(typeof myPostedJobs==='function')?myPostedJobs():[],
      desbloqueos:myPayments()
    };
    downloadJson('talentpact-empresa.json',data);
    stMsg(box,'ok','Archivo descargado: talentpact-empresa.json');
  }catch(e){ stMsg(box,'err','No se pudo generar el archivo: '+((e&&e.message)||e)); }
  finally{ done(); }
}

function toggleDeleteForm(role){
  const f=document.getElementById('st-'+role+'-del-form'); if(!f)return;
  f.classList.toggle('show');
  stMsg('st-'+role+'-del-msg','','');
}
async function deleteAccount(role){
  const box='st-'+role+'-del-msg';
  const user=role==='cand'?tpUser:tpCompany;
  const word=((document.getElementById('st-'+role+'-del-word')||{}).value||'').trim().toUpperCase();
  stMsg(box,'','');
  if(word!=='ELIMINAR'){ stMsg(box,'err','Escribe ELIMINAR para confirmar.'); return; }
  if(!user){ stMsg(box,'err','Estás como invitado: no hay ninguna cuenta que borrar. Para vaciar este navegador ejecuta TP.reset() en la consola.'); return; }
  const done=btnBusy('st-'+role+'-del-btn','Eliminando…');
  try{
    const r=await TPCloud.deleteAccount();
    if(!r||!r.ok)throw new Error((r&&(r.details||r.error))||'respuesta inesperada del servidor');
    await TPCloud.signOut();
    TPPrefs.invalidate();
    if(role==='cand'){ tpUser=null; closeSettings('cand'); closeDash('dashCandidate'); }
    else { tpCompany=null; closeSettings('emp'); closeDash('dashEmpresa'); }
    goHome();
  }catch(e){ stMsg(box,'err','No se pudo eliminar la cuenta: '+((e&&e.message)||e)); }
  finally{ done(); }
}

// Atajo de la zona de peligro: es exactamente el interruptor de privacidad.
async function hideMyProfile(){
  const el=document.getElementById('pref-cand-poolVisible'); if(el)el.checked=false;
  await setPref('cand','poolVisible',false);
  stMsg('st-cand-sec-msg','ok','Tu perfil ya no aparece en el pool. Puedes volver a activarlo en Privacidad.');
}
// Pausar la cuenta de empresa retira sus ofertas del listado publico.
async function toggleEmpPause(){
  const now=!prefIsOn('emp','paused',false);
  await setPref('emp','paused',now);
  myPostedJobs().forEach(function(j){ j.paused=now; });
  TP.saveEmpJobs();
  const b=document.getElementById('st-emp-pause'); if(b)b.textContent=now?'Reactivar cuenta':'Pausar cuenta';
  stMsg('st-emp-sec-msg','ok',now?'Cuenta pausada: tus ofertas ya no se muestran a los candidatos.':'Cuenta reactivada: tus ofertas vuelven a estar visibles.');
  try{ renderEmpJobs(); renderEmpUsage(); }catch(e){}
}

// Lanza el flujo OAuth. signInWithOAuth navega fuera de la página, así que el
// resto del proceso lo recoge el bootstrap de sesión al volver.
async function oauthLogin(provider,role){
  const portal=role==='empresa'?'empresa':'candidate';
  const label=OAUTH_LABEL[provider]||provider;
  const btn=document.getElementById((OAUTH_BTN[portal]||{})[provider]);
  if(btn)btn.disabled=true;
  authMsg('info','Conectando con '+label+'…',portal);
  try{
    const prov=await TPCloud.providers();
    if(prov[provider]===false){
      authMsg('err','El acceso con '+label+' todavía no está activado en el proyecto. Entra con email y contraseña o explora como invitado.',portal);
      return;
    }
    await TPCloud.signInWithProvider(provider,portal);
  }catch(e){
    authMsg('err','No se pudo iniciar el acceso con '+label+': '+authErrorText(e),portal);
  }finally{
    if(btn)btn.disabled=false;
  }
}

// Atenúa los proveedores aún no habilitados en Supabase (sin ocultarlos: al
// pulsarlos el usuario recibe la explicación en vez de un error opaco).
async function refreshOAuthButtons(portal){
  try{
    const prov=await TPCloud.providers();
    const map=OAUTH_BTN[portal||'candidate']||{};
    Object.keys(map).forEach(p=>{
      const b=document.getElementById(map[p]); if(!b)return;
      const on=prov[p]!==false;
      b.classList.toggle('is-off',!on);
      b.title=on?('Continuar con '+OAUTH_LABEL[p]):(OAUTH_LABEL[p]+': proveedor pendiente de activar en Supabase');
    });
  }catch(e){}
}

// Quita de la URL los parámetros que deja el proveedor tras el redirect.
function cleanAuthUrl(){
  try{
    const url=new URL(window.location.href);
    ['code','state','error','error_code','error_description','provider_token','tp'].forEach(k=>url.searchParams.delete(k));
    history.replaceState({},document.title,url.pathname+(url.search||''));
  }catch(e){}
}
async function logoutCand(){
  await TPCloud.signOut();
  tpUser=null;
  TPPrefs.invalidate();
  applyCandidateIdentity();   // borra el nombre del que se va
  closeDash('dashCandidate');
  goHome();
}
// El portal de empresa usa el mismo Supabase Auth que el de candidato; lo que
// separa a los dos es user_metadata.role, que se fija al crear la cuenta.
async function loginEmpresa(){
  const email=(document.getElementById('emp-login-email').value||'').trim();
  const pw=document.getElementById('emp-login-pw').value||'';
  authMsg('','','empresa');
  clearFieldErrors('emp-login');
  if(!fieldValid('emp-login-email',isEmailValid(email),'Introduce un email corporativo válido.'))return;
  if(!fieldValid('emp-login-pw',!!pw,'Escribe tu contraseña.'))return;
  const espera=TPAuthGuard.bloqueado();
  if(espera){authMsg('err',TPAuthGuard.mensajeBloqueo(espera),'empresa');return;}
  const done=btnBusy('empLoginBtn','Accediendo…');
  try{
    let u;
    try{u=await TPCloud.signIn(email,pw);}
    catch(e){if(e&&(e.status===400||/invalid/i.test(e.message||''))){const quedan=TPAuthGuard.fallo();if(quedan<=2&&quedan>0)e=new Error(authErrorText(e)+' Te quedan '+quedan+' intento(s) antes de un bloqueo temporal.');}throw e;}
    TPAuthGuard.ok();
    const role=(u.user_metadata||{}).role;
    if(role==='candidate'){
      await TPCloud.signOut();
      authMsg('err','Esa cuenta es de candidato. Entra desde el portal de candidato.','empresa');
      return;
    }
    tpCompany=u;
    if(!role)await TPCloud.setRole('empresa');   // cuentas creadas antes de esta versión
    authMsg('ok','Sesión iniciada. Abriendo el panel…','empresa');
    closeAuth('authEmpresa');openDashEmp();
  }catch(e){ authMsg('err',authErrorText(e),'empresa'); }
  finally{ done(); }
}

async function registerEmpresa(){
  const company=(document.getElementById('emp-reg-company').value||'').trim();
  const name=(document.getElementById('emp-reg-name').value||'').trim();
  const position=(document.getElementById('emp-reg-position').value||'').trim();
  const email=(document.getElementById('emp-reg-email').value||'').trim();
  const pw=document.getElementById('emp-reg-pw').value||'';
  const size=document.getElementById('emp-reg-size').value||'';
  authMsg('','','empReg');
  clearFieldErrors('emp-register');
  if(!fieldValid('emp-reg-company',!!company,'Indica el nombre de la empresa.'))return;
  if(!fieldValid('emp-reg-name',!!name,'Indica tu nombre.'))return;
  if(!fieldValid('emp-reg-email',isEmailValid(email),'Introduce un email corporativo válido.'))return;
  if(!fieldValid('emp-reg-pw',!pwPolicyError(pw,email),pwPolicyError(pw,email)))return;
  const done=btnBusy('empRegBtn','Creando cuenta…');
  try{
    const data=await TPCloud.signUp(email,pw,{role:'empresa',company,contact_name:name,position,size,full_name:name});
    if(!data.session){ authMsg('info','Cuenta creada. Confirma el email que te hemos enviado y vuelve a entrar.','empReg'); return; }
    tpCompany=data.user;
    authMsg('ok','Cuenta creada. Abriendo el panel…','empReg');
    closeAuth('authEmpresa');openDashEmp();
  }catch(e){ authMsg('err',authErrorText(e),'empReg'); }
  finally{ done(); }
}

async function verifySkillPassAtCompany(){
  const raw=(document.getElementById('empVerifyJson').value||'').trim();
  const st=document.getElementById('empVerifyStatus');
  const card=document.getElementById('empVerifyCard');
  const btn=document.getElementById('empVerifyBtn');
  if(!raw){toast('Pega el JSON, el hash 0x… o el enlace del candidato.');return;}
  let payload={};
  const hashMatch=raw.match(/0x[a-fA-F0-9]{64}/);
  if(raw.startsWith('{')||raw.startsWith('[')){
    try{ payload={cvJson:JSON.parse(raw)}; }catch(e){ if(st){st.style.display='block';st.style.background='#fef2f2';st.style.color='#b91c1c';st.textContent='JSON no válido.';} return; }
  }else if(hashMatch){ payload={cvHash:hashMatch[0]}; }
  else { if(st){st.style.display='block';st.style.background='#fef2f2';st.style.color='#b91c1c';st.textContent='Pega un JSON, un hash 0x… o un enlace de verificación.';} return; }
  if(btn){btn.disabled=true;btn.textContent='Verificando sello…';}
  if(card)card.innerHTML='';
  try{
    const data=await TPCloud._post('verify-credential',payload);
    SkillPass._learnChain(data);
    if(st){
      st.style.display='block';
      if(data&&data.verified){
        st.style.background='var(--emerald-50)';st.style.color='var(--emerald-600)';st.style.border='1px solid var(--emerald-100)';
        const fecha=data.anchoredAt?new Date(data.anchoredAt).toLocaleString('es-ES'):'';
        // La fecha sale del contrato, no de la base de datos de TalentPact:
        // es el dato que ni siquiera nosotros podemos retocar.
        st.innerHTML='<strong>Sello auténtico.</strong> Esta credencial está anclada en '+escHtml(data.chainName||SkillPass.chain.name)+
          (fecha?' desde el '+escHtml(fecha):'')+' y no ha sido manipulada.'+
          (data.explorerUrl?' <a href="'+escHtml(data.explorerUrl)+'" target="_blank" rel="noopener">Ver la transacción</a>.':'');
        if(card) card.innerHTML=SkillPass.cardHtml({cvHash:data.cvHash,txHash:data.txHash,blockNumber:data.blockNumber,anchoredAt:data.anchoredAt,skills:data.skills||[]},{verified:true,url:(location.origin||'')+'/verify.html?h='+encodeURIComponent(data.cvHash||'')});
      }else{
        st.style.background='#fef2f2';st.style.color='#b91c1c';st.style.border='1px solid #fecaca';
        st.innerHTML='<strong>No verificado.</strong> '+(escHtml((data&&(data.reason||data.error))||'La credencial no es auténtica o fue modificada.'));
      }
    }
  }catch(e){
    if(st){st.style.display='block';st.style.background='#fef2f2';st.style.color='#b91c1c';st.textContent='Error de red: '+(e.message||e);}
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Verificar sello';}
  }
}

// Verificador de la landing: comprueba un SkillPass sin cuenta ni cartera.
// Solo lee el contrato, asi que puede ofrecerse en publico sin coste ni riesgo.
async function verifyOnLanding(){
  const input=document.getElementById('lpVerifyInput');
  const out=document.getElementById('lpVerifyOut');
  const btn=document.getElementById('lpVerifyBtn');
  if(!input||!out||!btn)return;
  const show=(kind,html)=>{ out.style.display='block'; out.className='sp-verify-out '+kind; out.innerHTML=html; };
  const raw=(input.value||'').trim();
  if(!raw){ show('bad','Pega un hash <code>0x…</code>, el JSON del SkillPass o el enlace que te hayan pasado.'); return; }

  let payload;
  if(raw.startsWith('{')||raw.startsWith('[')){
    try{ payload={cvJson:JSON.parse(raw)}; }
    catch(e){ show('bad','Ese JSON no es válido: '+escHtml(e.message)); return; }
  }else{
    const m=raw.match(/0x[a-fA-F0-9]{64}/);   // sirve igual pegando el enlace ?h=…
    if(!m){ show('bad','No reconozco ese formato. Necesito un hash de <code>0x</code> + 64 caracteres, el JSON completo, o el enlace de verificación.'); return; }
    payload={cvHash:m[0]};
  }

  const label=btn.textContent;
  btn.disabled=true; btn.textContent='Consultando la cadena…';
  show('busy','Leyendo el contrato en la blockchain…');
  try{
    const data=await TPCloud._post('verify-credential',payload);
    if(data&&data.verified){
      const fecha=data.anchoredAt?new Date(data.anchoredAt).toLocaleString('es-ES'):'';
      const chips=(data.skills||[]).slice(0,8).map(sk=>
        '<span class="sp-verify-chip">'+escHtml(sk.skill||'')+' <b>'+(Number(sk.score)||0)+'</b></span>').join('');
      show('ok','<strong>Sello auténtico.</strong> Anclado en '+escHtml(data.chainName||'la cadena')+
        (fecha?' el '+escHtml(fecha):'')+' y sin alterar desde entonces.'+
        (chips?'<div class="sp-verify-chips">'+chips+'</div>':'')+
        (data.explorerUrl?'<a class="sp-verify-link" href="'+escHtml(data.explorerUrl)+'" target="_blank" rel="noopener">Ver la transacción en el explorador →</a>':''));
    }else{
      show('bad','<strong>Sin sello válido.</strong> '+
        escHtml((data&&(data.reason||data.error))||'No se pudo verificar esta credencial.'));
    }
  }catch(e){
    // Abrir el index con doble clic (file://) deja las funciones sin servir.
    show('bad','No se pudo contactar con el verificador. '+escHtml(e.message||String(e)));
  }finally{
    btn.disabled=false; btn.textContent=label;
  }
}

function guestEmpresa(){clearAuthMsgs();closeAuth('authEmpresa');openDashEmp();}
async function logoutEmp(){
  await TPCloud.signOut();
  tpCompany=null;
  TPPrefs.invalidate();
  applyCompanyIdentity();
  closeDash('dashEmpresa');
  goHome();
}

function candidateName(){
  const m=(tpUser&&tpUser.user_metadata)||{};
  const nombre=(m.full_name||'').trim();
  if(nombre)return nombre;
  const local=TP.load('guestProfile',null);
  if(local&&(local.fullName||'').trim())return local.fullName.trim();
  if(tpUser&&tpUser.email)return tpUser.email.split('@')[0];
  return 'Mi perfil';
}
function applyCandidateIdentity(){
  const nombre=candidateName();
  const el=document.getElementById('candName'); if(el)el.textContent=nombre;
  const av=document.getElementById('candAvatar');
  if(av){
    const ini=nombre.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('');
    av.textContent=tpUser?((ini||nombre.slice(0,2)).toUpperCase()):'—';
  }
}

function companyName(){
  const m=(tpCompany&&tpCompany.user_metadata)||{};
  const raw=(m.company||'').trim();
  if(raw)return raw;
  if(tpCompany&&tpCompany.email)return tpCompany.email.split('@')[0];
  return 'Empresa invitada';   // sin cuenta: nunca un nombre de empresa inventado
}
function companyKey(){ return tpCompany?tpCompany.id:'guest'; }
function applyCompanyIdentity(){
  const name=companyName();
  const el=document.getElementById('empName'); if(el)el.textContent=name;
  const av=document.getElementById('empAvatar');
  if(av){
    const ini=name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('');
    av.textContent=(ini||name.slice(0,2)).toUpperCase();
  }
}

