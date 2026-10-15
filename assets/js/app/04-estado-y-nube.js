// TalentPact · 04-estado-y-nube
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.
// ═══ CANDIDATE SKILL PROFILE STATE ═══
let candidateProfile={
  skills:{
    'Pensamiento Analítico':{score:0,unlocked:false,source:null},
    'Comunicación Escrita':{score:0,unlocked:false,source:null},
    'Resolución de Problemas':{score:0,unlocked:false,source:null},
    'Razonamiento Lógico':{score:0,unlocked:false,source:null},
    'Inglés (Speaking)':{score:0,unlocked:false,source:null},
    'Toma de Decisiones':{score:0,unlocked:false,source:null},
    'Trabajo en Equipo':{score:0,unlocked:false,source:null},
    'Creatividad':{score:0,unlocked:false,source:null},
    'Liderazgo':{score:0,unlocked:false,source:null},
    'Gestión del Tiempo':{score:0,unlocked:false,source:null},
    'Atención al Cliente':{score:0,unlocked:false,source:null},
    'Negociación':{score:0,unlocked:false,source:null},
    'Excel y Datos':{score:0,unlocked:false,source:null},
    'Pensamiento Estratégico':{score:0,unlocked:false,source:null},
    'Marketing Digital':{score:0,unlocked:false,source:null},
    'Desarrollo y Tecnología':{score:0,unlocked:false,source:null},
    'Data & Analytics':{score:0,unlocked:false,source:null},
    'Ventas y Comercial':{score:0,unlocked:false,source:null},
    'Finanzas y Contabilidad':{score:0,unlocked:false,source:null},
    'Gestión de Fondos':{score:0,unlocked:false,source:null},
    'Frontend Web':{score:0,unlocked:false,source:null},
    'Python & Backend':{score:0,unlocked:false,source:null},
    'SQL & Bases de Datos':{score:0,unlocked:false,source:null},
    'SEO & Contenido':{score:0,unlocked:false,source:null},
    'Excel Avanzado':{score:0,unlocked:false,source:null},
    'UX/UI Design':{score:0,unlocked:false,source:null},
    'Edición Vídeo':{score:0,unlocked:false,source:null},
    'Fotografía':{score:0,unlocked:false,source:null},
    'Data Entry':{score:0,unlocked:false,source:null},
    'Agile & Scrum':{score:0,unlocked:false,source:null},
    'Product Management':{score:0,unlocked:false,source:null},
    'Customer Success':{score:0,unlocked:false,source:null},
    'Emprendimiento':{score:0,unlocked:false,source:null},
    'Asistente Ejecutivo':{score:0,unlocked:false,source:null},
    'Admin Oficina':{score:0,unlocked:false,source:null},
    'AutoCAD':{score:0,unlocked:false,source:null},
    'Producción':{score:0,unlocked:false,source:null},
    'Sostenibilidad':{score:0,unlocked:false,source:null},
    'Eventos':{score:0,unlocked:false,source:null},
    'Hostelería':{score:0,unlocked:false,source:null},
    'Inmobiliaria':{score:0,unlocked:false,source:null},
    'Farmacia':{score:0,unlocked:false,source:null},
    'Admin Sanitaria':{score:0,unlocked:false,source:null},
    'Alemán Pro':{score:0,unlocked:false,source:null},
    'Francés Pro':{score:0,unlocked:false,source:null},
    'English B1':{score:0,unlocked:false,source:null},
    'E-Learning':{score:0,unlocked:false,source:null},
    'Pedagogía':{score:0,unlocked:false,source:null},
    'Social Skills':{score:0,unlocked:false,source:null},
    'Periodismo':{score:0,unlocked:false,source:null},
    'Redacción Pro':{score:0,unlocked:false,source:null},
    'Oratoria':{score:0,unlocked:false,source:null},
    'Product Design':{score:0,unlocked:false,source:null},
    'Diseño Gráfico':{score:0,unlocked:false,source:null},
    'Calidad':{score:0,unlocked:false,source:null},
    'Lean':{score:0,unlocked:false,source:null},
    'Project Management':{score:0,unlocked:false,source:null},
    'Supply Chain':{score:0,unlocked:false,source:null},
    'Propiedad Intelectual':{score:0,unlocked:false,source:null},
    'Inversión':{score:0,unlocked:false,source:null},
    'Auditoría':{score:0,unlocked:false,source:null},
    'Tesorería':{score:0,unlocked:false,source:null},
    'Fiscalidad':{score:0,unlocked:false,source:null},
    'Derecho Laboral':{score:0,unlocked:false,source:null},
    'Formación':{score:0,unlocked:false,source:null},
    'People Analytics':{score:0,unlocked:false,source:null},
    'Recruiting':{score:0,unlocked:false,source:null},
    'Telemarketing':{score:0,unlocked:false,source:null},
    'Retail':{score:0,unlocked:false,source:null},
    'Ventas B2B':{score:0,unlocked:false,source:null},
    'E-commerce':{score:0,unlocked:false,source:null},
    'Branding':{score:0,unlocked:false,source:null},
    'Web Analytics':{score:0,unlocked:false,source:null},
    'Email Marketing':{score:0,unlocked:false,source:null},
    'Google Ads':{score:0,unlocked:false,source:null},
    'Estadística':{score:0,unlocked:false,source:null},
    'Big Data':{score:0,unlocked:false,source:null},
    'Tableau':{score:0,unlocked:false,source:null},
    'Python Data':{score:0,unlocked:false,source:null},
    'Cloud':{score:0,unlocked:false,source:null},
    'Ciberseguridad':{score:0,unlocked:false,source:null},
    'IA & ML':{score:0,unlocked:false,source:null},
    'Mobile Dev':{score:0,unlocked:false,source:null},
    'Testing & QA':{score:0,unlocked:false,source:null},
    'DevOps':{score:0,unlocked:false,source:null},
    'Git & GitHub':{score:0,unlocked:false,source:null},
    'Node.js':{score:0,unlocked:false,source:null},
    'TypeScript':{score:0,unlocked:false,source:null},
    'CSS Avanzado':{score:0,unlocked:false,source:null},
    'Business English':{score:0,unlocked:false,source:null},
    'CRM':{score:0,unlocked:false,source:null},
    'Contabilidad':{score:0,unlocked:false,source:null},
    'Contratos':{score:0,unlocked:false,source:null},
    'Copywriting':{score:0,unlocked:false,source:null},
    'Figma':{score:0,unlocked:false,source:null},
    'JavaScript':{score:0,unlocked:false,source:null},
    'Logística':{score:0,unlocked:false,source:null},
    'Pitch':{score:0,unlocked:false,source:null},
    'Power BI':{score:0,unlocked:false,source:null},
    'RGPD':{score:0,unlocked:false,source:null},
    'React':{score:0,unlocked:false,source:null},
    'Social Media':{score:0,unlocked:false,source:null},
    'UX Research':{score:0,unlocked:false,source:null},
  },
  completedCommon:[],
  completedCustom:[]
};

// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENCIA LOCAL — TalentPact
// Capa de persistencia real que sobrevive a recargas del navegador.
// En producción se sustituye por Supabase (PostgreSQL + RLS) según el Project
// Charter; aquí se usa localStorage para el progreso local, sin
// infraestructura externa. Si localStorage no está disponible, el sistema
// degrada con elegancia a memoria (la app sigue funcionando sin persistir).
// ═══════════════════════════════════════════════════════════════════════════
const TP_NS='talentpact:v1:';
// Copia del perfil vacío, para dejarlo limpio al cambiar de cuenta.
const TP_PERFIL_VACIO=JSON.stringify(candidateProfile);
const TP={
  _ok:null,
  available(){
    if(TP._ok!==null)return TP._ok;
    try{const k=TP_NS+'__t';localStorage.setItem(k,'1');localStorage.removeItem(k);TP._ok=true;}
    catch(e){TP._ok=false;}
    return TP._ok;
  },
  save(key,val){if(!TP.available())return false;try{localStorage.setItem(TP_NS+key,JSON.stringify(val));return true;}catch(e){console.warn('TP.save',key,e);return false;}},
  load(key,def){if(!TP.available())return def;try{const r=localStorage.getItem(TP_NS+key);return r?JSON.parse(r):def;}catch(e){return def;}},
  // Log de evaluaciones IA — trazabilidad / audit trail (AI Act Art. 12)
  logEval(entry){const log=TP.load('evals',[]);log.push(Object.assign({ts:new Date().toISOString()},entry));if(log.length>200)log.splice(0,log.length-200);TP.save('evals',log);return log;},
  getEvals(){return TP.load('evals',[]);},
  // El progreso guardado en el navegador lleva dueño: la cuenta (id) o 'guest'.
  // Antes no lo llevaba: al entrar con otra cuenta se mezclaba con ella y se
  // subía a la nube, así que una cuenta nueva aparecía con retos de otra persona.
  saveProfile(){TP.save('profile',{owner:(typeof tpUser!=='undefined'&&tpUser&&tpUser.id)||'guest',skills:candidateProfile.skills,completedCommon:candidateProfile.completedCommon,completedCustom:candidateProfile.completedCustom});},
  /** Dueño del progreso guardado: id de cuenta, 'guest' o null (guardado antes de llevar dueño). */
  dueno(){const p=TP.load('profile',null);return p?(p.owner||null):undefined;},
  /** Deja el perfil en memoria y en el navegador como el de una cuenta nueva. */
  vaciarPerfil(){
    const v=JSON.parse(TP_PERFIL_VACIO);
    Object.keys(candidateProfile).forEach(k=>{delete candidateProfile[k];});
    Object.assign(candidateProfile,v);
    ['profile','evals'].forEach(k=>{try{localStorage.removeItem(TP_NS+k);}catch(e){}});
  },
  savePool(){},   // el pool es del servidor; no se persiste en el navegador
  saveUnlocks(){TP.save('unlocks',CANDIDATES.filter(c=>c._unlocked).map(c=>c.id));},
  saveEmpJobs(){TP.save('empJobs',empPostedJobs);},
  // Historial de desbloqueos: es lo que alimenta "Pagos" en el panel de empresa.
  logPayment(entry){const l=TP.load('payments',[]);l.push(Object.assign({ts:new Date().toISOString()},entry));if(l.length>200)l.splice(0,l.length-200);TP.save('payments',l);return l;},
  getPayments(){return TP.load('payments',[]);},
  reset(){if(!TP.available())return;['profile','pool','unlocks','empJobs','evals','payments','prefs:cand','prefs:emp'].forEach(k=>{try{localStorage.removeItem(TP_NS+k);}catch(e){}});console.info('TalentPact: persistencia reiniciada. Recarga la página.');},
  hydrate(){
    if(!TP.available()){console.warn('TalentPact: localStorage no disponible — persistencia desactivada (modo memoria).');return;}
    const p=TP.load('profile',null);
    if(p){
      if(p.skills)Object.keys(p.skills).forEach(k=>{if(candidateProfile.skills[k])candidateProfile.skills[k]=p.skills[k];});
      if(Array.isArray(p.completedCommon))candidateProfile.completedCommon=p.completedCommon;
      if(Array.isArray(p.completedCustom))candidateProfile.completedCustom=p.completedCustom;
    }
    TP.load('unlocks',[]).forEach(id=>{const c=CANDIDATES.find(x=>x.id===id);if(c)c._unlocked=true;});
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TPCloud — Cuentas reales (Supabase Auth) + sincronización de progreso (TFM)
// La clave anon es PÚBLICA por diseño; el acceso a datos va por funciones server.
// ═══════════════════════════════════════════════════════════════════════════
const TP_SUPABASE_URL='https://vqyqedmizxqneniynxqp.supabase.co';
const TP_SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXFlZG1penhxbmVuaXlueHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjY4MDUsImV4cCI6MjEwMjU0MjgwNX0.T8WfrAOKjol_L7Nls2-Z7SvkxNjnuJdgzAQrjDdQebk';
let tpUser=null;      // sesión de candidato
let tpCompany=null;   // sesión de empresa
// Elemento que tenía el foco antes de abrir un modal de acceso, para
// devolvérselo al cerrar. Se declara aquí y no junto a openAuth porque el IIFE
// de arranque lo usa antes: con `let` más abajo caía en la zona muerta temporal.
let _authOpener=null;
const TPCloud={
  _c:null,
  client(){ if(TPCloud._c)return TPCloud._c; if(!(window.supabase&&window.supabase.createClient)){console.warn('Supabase JS no cargado');return null;} TPCloud._c=window.supabase.createClient(TP_SUPABASE_URL,TP_SUPABASE_ANON); return TPCloud._c; },
  async currentUser(){ const c=TPCloud.client(); if(!c)return null; try{const {data}=await c.auth.getSession(); return data&&data.session?data.session.user:null;}catch(e){return null;} },
  async signUp(email,password,meta){ const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible'); const {data,error}=await c.auth.signUp({email,password,options:{data:meta||{}}}); if(error)throw error; return data; },
  async signIn(email,password){ const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible'); const {data,error}=await c.auth.signInWithPassword({email,password}); if(error)throw error; return data.user; },
  async signOut(){ const c=TPCloud.client(); if(c){try{await c.auth.signOut();}catch(e){}} },

  // ── Acceso social (Google / LinkedIn) ────────────────────────────────────
  // Los proveedores activos se leen del propio proyecto Supabase (endpoint
  // público /auth/v1/settings), así el botón se activa solo en cuanto se
  // habilita Google en el panel de Supabase: no hay que tocar este código.
  _prov:null,
  async providers(){
    if(TPCloud._prov)return TPCloud._prov;
    try{
      const r=await fetch(TP_SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:TP_SUPABASE_ANON}});
      const j=await r.json();
      TPCloud._prov=(j&&j.external)||{};
    }catch(e){ console.warn('[TP] providers',e); TPCloud._prov={}; }
    return TPCloud._prov;
  },
  // URL a la que Supabase devuelve al usuario tras el consentimiento. Debe estar
  // en Supabase → Authentication → URL Configuration → Redirect URLs.
  redirectUrl(){ return window.location.origin+window.location.pathname; },
  async signInWithProvider(provider,role){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    try{ sessionStorage.setItem('tp_oauth_pending',role||'candidate'); }catch(e){}
    const opts={redirectTo:TPCloud.redirectUrl()};
    // 'select_account' evita que Google reutilice en silencio la última cuenta.
    if(provider==='google')opts.queryParams={prompt:'select_account'};
    const {error}=await c.auth.signInWithOAuth({provider,options:opts});
    if(error){ try{sessionStorage.removeItem('tp_oauth_pending');}catch(e){} throw error; }
  },
  // Envia el correo de recuperacion. El enlace vuelve a esta misma pagina con
  // ?tp=recovery, que es lo que dispara la pantalla de nueva contrasena: no
  // dependemos de sessionStorage porque el enlace suele abrirse desde el correo,
  // a menudo en otro navegador o pestana.
  async resetPassword(email){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const back=TPCloud.redirectUrl()+'?tp=recovery';
    const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:back});
    if(error)throw error;
    return true;
  },
  // ── Gestion de la cuenta (todo esto son llamadas reales a Supabase Auth) ──
  async updatePassword(password){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const {error}=await c.auth.updateUser({password}); if(error)throw error; return true;
  },
  async updateEmail(email){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const {error}=await c.auth.updateUser({email}); if(error)throw error; return true;
  },
  // Fusiona claves en user_metadata sin pisar lo que ya hubiera.
  async saveMeta(patch){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const {data,error}=await c.auth.updateUser({data:patch}); if(error)throw error;
    const u=data&&data.user;
    if(u){ if(tpUser&&tpUser.id===u.id)tpUser=u; if(tpCompany&&tpCompany.id===u.id)tpCompany=u; }
    return u;
  },
  // Cierra la sesion en el resto de dispositivos, manteniendo la de aqui.
  async signOutOthers(){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const {error}=await c.auth.signOut({scope:'others'}); if(error)throw error; return true;
  },
  // El borrado necesita la service key, asi que va por una funcion de servidor.
  // Se manda el token de sesion, nunca un userId: el servidor decide a quien borra.
  async deleteAccount(){
    const c=TPCloud.client(); if(!c)throw new Error('Auth no disponible');
    const {data}=await c.auth.getSession();
    const token=data&&data.session&&data.session.access_token;
    if(!token)throw new Error('No hay sesion activa');
    return TPCloud._post('delete-account',{accessToken:token});
  },
  // Marca el tipo de cuenta (candidate | empresa) en el propio usuario de Auth.
  // Es lo que permite que un mismo proyecto Supabase sirva a los dos portales
  // sin tablas adicionales, y que cada portal rechace a quien no le corresponde.
  async setRole(role){
    const c=TPCloud.client(); if(!c)return;
    try{ await c.auth.updateUser({data:{role}}); }catch(e){ console.warn('[TP] setRole',e); }
  },
  // Tras un login social Supabase ya trae nombre y avatar en user_metadata:
  // los persistimos para que el panel no arranque con el perfil vacío.
  async syncOAuthProfile(user){
    try{
      const m=user.user_metadata||{};
      const fullName=((m.full_name||m.name||(user.email||'').split('@')[0])||'').trim();
      if(fullName)await TPCloud.saveProfile(user,{fullName});
    }catch(e){ console.warn('[TP] syncOAuthProfile',e); }
  },
  _post(fn,body){ return fetch('/.netlify/functions/'+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()); },
  // Token de la sesión actual (null en modo invitado).
  async accessToken(){
    const c=TPCloud.client(); if(!c)return null;
    try{ const {data}=await c.auth.getSession(); return (data&&data.session&&data.session.access_token)||null; }
    catch(e){ return null; }
  },
  // Igual que _post pero firmando con el token de sesión. Las funciones que
  // gastan gas o tocan credenciales no aceptan un userId del cliente: preguntan
  // a Supabase de quién es el token. Así nadie actúa en nombre de otro.
  async _postAuth(fn,body){
    const token=await TPCloud.accessToken();
    const headers={'Content-Type':'application/json'};
    if(token)headers['Authorization']='Bearer '+token;
    const r=await fetch('/.netlify/functions/'+fn,{method:'POST',headers,body:JSON.stringify(body||{})});
    const text=await r.text();
    // Un 502 de Netlify devuelve HTML: sin esto, JSON.parse rompería el flujo
    // con un error críptico en vez de decir qué pasó.
    try{ return JSON.parse(text); }
    catch(e){ return {error:'El servidor devolvió una respuesta no válida (HTTP '+r.status+')',details:text.slice(0,200)}; }
  },
  // El servidor deduce la cuenta del token: `user` solo se mantiene en la firma
  // para no tocar a quien llama. Mandar un userId permitía actuar en nombre de otro.
  saveProfile(user,fields){ return TPCloud._postAuth('save-profile',fields||{}); },
  saveCompany(user,fields){ return TPCloud._postAuth('save-company',fields||{}); },
  getCompany(user){ return TPCloud._postAuth('get-company',{}); },
  saveEvaluation(user,ev){ return TPCloud._postAuth('save-evaluation',ev||{}); },
  getProgress(user){ return TPCloud._postAuth('get-progress',{}); },
  // Rehidrata candidateProfile desde la nube y refresca la cabecera del panel.
  async loadProgressIntoProfile(user){
    try{
      // ¿De quién es el progreso de este navegador? Solo se mezcla con la cuenta
      // si es suyo. Lo de otra cuenta se descarta; lo hecho sin sesión se aparta
      // y se pregunta antes de añadirlo (puede ser de otra persona).
      const dueno=TP.dueno();
      let deInvitado=null;
      if(dueno!==undefined&&dueno!==user.id){
        if((dueno==='guest'||dueno===null)&&(candidateProfile.completedCommon||[]).length)deInvitado=JSON.parse(JSON.stringify(candidateProfile));
        TP.vaciarPerfil();
      }
      const p=await TPCloud.getProgress(user);
      if(p&&p.profile){
        const nm=((p.profile.full_name||'').trim())||user.email||'Candidato';
        const nameEl=document.getElementById('candName'); if(nameEl)nameEl.textContent=nm;
        const avEl=document.getElementById('candAvatar'); if(avEl)avEl.textContent=(nm.trim()[0]||'C').toUpperCase();
      }
      // MERGE (nunca sobrescribir): la nube complementa el progreso local, no lo borra.
      if(p&&Array.isArray(p.skills)){
        p.skills.forEach(s=>{ const cur=candidateProfile.skills[s.skill]; if(cur&&(!cur.unlocked||s.score>=cur.score)){ candidateProfile.skills[s.skill]={score:s.score,unlocked:true,source:s.challengeId||cur.source||null}; } });
      }
      if(p&&Array.isArray(p.completed)){
        const byId={}; (candidateProfile.completedCommon||[]).forEach(c=>{ if(c&&c.id)byId[c.id]=c; });
        p.completed.forEach(c=>{ const prev=byId[c.challengeId]; if(!prev||c.score>prev.score){ byId[c.challengeId]={id:c.challengeId,score:c.score,skill:c.skill,date:c.evaluatedAt}; } });
        candidateProfile.completedCommon=Object.values(byId);
      }
      // Reconciliar: toda skill desbloqueada con reto de origen cuenta como reto completado.
      Object.entries(candidateProfile.skills).forEach(([name,d])=>{ if(d&&d.unlocked&&d.source&&!candidateProfile.completedCommon.find(c=>c.id===d.source)){ candidateProfile.completedCommon.push({id:d.source,score:d.score,skill:name,date:new Date().toISOString()}); } });
      TP.saveProfile(); syncMyPoolEntry();
      const dc=document.getElementById('dashCandidate');
      if(dc&&dc.classList.contains('open')&&typeof updateCandProfile==='function')updateCandProfile();
      // Sincronización de subida: sube a la nube los retos locales que aún no estén guardados.
      // Garantiza que el progreso del navegador acabe en Supabase aunque el guardado por reto falle.
      try{
        const cloudIds=new Set(((p&&p.completed)||[]).map(c=>c.challengeId));
        const pending=(candidateProfile.completedCommon||[]).filter(c=>c&&c.id&&!cloudIds.has(c.id));
        for(const c of pending){
          const sk=candidateProfile.skills[c.skill]?c.skill:(c.skill||c.id);
          await TPCloud.saveEvaluation(user,{challengeId:c.id,skill:sk,score:c.score||0,criteria:[],reasoning:'(sincronizado desde el dispositivo)'});
        }
        if(pending.length)console.info('[TP] sincronizados a la nube:',pending.length,'reto(s)');
      }catch(e){console.warn('[TP] sync-up error',e);}
      if(deInvitado)await tpOfrecerProgresoInvitado(user,deInvitado,p);
    }catch(e){console.warn('TPCloud.loadProgress',e);}
  }
};

function applyCompanyToUI(company,user){
  const nm=(company&&(company.company_name||company.contact_name))||(user&&user.email)||'Empresa';
  const nameEl=document.getElementById('empName'); if(nameEl)nameEl.textContent=nm;
  const avEl=document.getElementById('empAvatar'); if(avEl)avEl.textContent=(nm.trim()[0]||'E').toUpperCase();
}
async function loadCompanyIntoUI(user){
  try{
    const r=await TPCloud.getCompany(user);
    if(r&&r.company)applyCompanyToUI(r.company,user);
    else applyCompanyToUI(null,user);
  }catch(e){console.warn('loadCompany',e); applyCompanyToUI(null,user);}
}

/**
 * Retos hechos en este navegador sin iniciar sesión. Pueden ser de quien acaba
 * de entrar o de otra persona que usó el mismo ordenador: se pregunta antes de
 * añadirlos a la cuenta. Se guardan como notas no verificadas.
 */
async function tpOfrecerProgresoInvitado(user,local,nube){
  const enNube=new Set(((nube&&nube.completed)||[]).map(c=>c.challengeId));
  const nuevos=(local.completedCommon||[]).filter(c=>c&&c.id&&!enNube.has(c.id));
  if(!nuevos.length)return;
  const si=await tpConfirmar({
    titulo:'Hay retos hechos sin cuenta en este navegador',
    texto:nuevos.length+(nuevos.length===1?' reto se hizo':' retos se hicieron')+' en este navegador sin iniciar sesión. Si los hiciste tú, puedes añadirlos a tu cuenta (como notas no verificadas). Si no son tuyos, se descartan.',
    si:'Añadirlos a mi cuenta',no:'No son míos'
  });
  if(!si)return;
  nuevos.forEach(c=>{
    candidateProfile.completedCommon.push(c);
    const sk=local.skills&&local.skills[c.skill];
    if(sk&&candidateProfile.skills[c.skill]&&(!candidateProfile.skills[c.skill].unlocked||sk.score>candidateProfile.skills[c.skill].score))candidateProfile.skills[c.skill]=sk;
  });
  TP.saveProfile();
  for(const c of nuevos){
    try{await TPCloud.saveEvaluation(user,{challengeId:c.id,skill:c.skill||c.id,score:c.score||0,criteria:[],reasoning:'(añadido desde este navegador por el usuario)'});}catch(e){console.warn('[TP] subir reto de invitado',e);}
  }
  if(typeof syncMyPoolEntry==='function')syncMyPoolEntry();
  if(typeof updateCandProfile==='function'&&document.getElementById('dashCandidate')?.classList.contains('open'))updateCandProfile();
}

/** Diálogo propio de sí/no (accesible). Devuelve una promesa con true/false. */
function tpConfirmar(o){
  return new Promise(res=>{
    const d=document.createElement('dialog');
    d.className='tp-dialogo';
    d.innerHTML='<form method="dialog"><h3></h3><p></p><div class="tp-dialogo-acc"><button type="button" class="btn btn-outline" data-r="no"></button><button type="submit" class="btn btn-primary" data-r="si"></button></div></form>';
    d.querySelector('h3').textContent=o.titulo;d.querySelector('p').textContent=o.texto;
    d.querySelector('[data-r=no]').textContent=o.no||'Cancelar';d.querySelector('[data-r=si]').textContent=o.si||'Aceptar';
    document.body.appendChild(d);
    const fin=v=>{try{d.close();}catch(e){}d.remove();res(v);};
    d.querySelector('[data-r=no]').onclick=()=>fin(false);
    d.addEventListener('cancel',e=>{e.preventDefault();fin(false);});
    d.querySelector('form').onsubmit=e=>{e.preventDefault();fin(true);};
    d.showModal();
  });
}
