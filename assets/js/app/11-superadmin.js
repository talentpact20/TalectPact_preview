// TalentPact · 11-superadmin
// Script clásico: comparte el ámbito global con el resto de assets/js/app/*.js,
// que index.html carga en orden numérico. Ver assets/js/README.md.

// ═══════════════════════════════════════════════════════════════════════════
// BACKOFFICE — datos reales (función admin-metrics)
//
// Solo para cuentas con app_metadata.role = 'admin', que únicamente puede
// asignar el servidor. Antes había un panel con métricas, candidatos y pagos
// inventados, una "suplantación" ficticia y una contraseña escrita en este
// fichero; todo eso ha desaparecido.
// ═══════════════════════════════════════════════════════════════════════════
let _admDatos=null;

function tpEsAdmin(){const u=tpUser||tpCompany;return !!(u&&u.app_metadata&&u.app_metadata.role==='admin');}
// La entrada al backoffice solo aparece en el menú para quien tiene el rol.
function tpMostrarEntradaAdmin(){const e=document.getElementById('accessAdmin');if(e)e.style.display=tpEsAdmin()?'':'none';}

function openAdmin(){
  closeAccessMenu();
  if(!tpEsAdmin()){toast('Tu cuenta no tiene acceso al backoffice.');return;}
  document.getElementById('dashAdmin').classList.add('open');
  document.body.style.overflow='hidden';
  const u=tpUser||tpCompany;
  document.getElementById('admUsuario').textContent=u&&u.email?u.email:'';
  admCargar();
}
function closeAdmin(){const d=document.getElementById('dashAdmin');if(d)d.classList.remove('open');document.body.style.overflow='';}

function admPagina(pag,btn){
  document.querySelectorAll('.adm-nav').forEach(b=>b.classList.toggle('active',b===btn));
  document.querySelectorAll('.adm-pag').forEach(p=>p.classList.toggle('active',p.id==='admPag-'+pag));
  if(pag==='catalogo')admPintarCatalogo();
}

async function admCargar(){
  const est=document.getElementById('admEstado');
  est.textContent='Cargando datos…';est.className='adm-estado';
  const r=await TPCloud._postAuth('admin-metrics',{});
  if(!r||r.error){est.textContent='No se pudieron cargar las métricas: '+((r&&(r.error||r.details))||'sin respuesta');est.className='adm-estado err';return;}
  _admDatos=r;
  est.textContent='Actualizado '+new Date(r.generadoEn).toLocaleString('es-ES');
  admPintar();
}

const _admNum=v=>v==null?'—':Number(v).toLocaleString('es-ES');
const _admEur=v=>v==null?'—':Number(v).toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:v<1?4:2});
const _admFecha=v=>v?new Date(v).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—';
function _admKpi(etq,valor,nota){return `<div class="adm-kpi"><span>${escHtml(etq)}</span><strong>${escHtml(String(valor))}</strong>${nota?`<small>${escHtml(nota)}</small>`:''}</div>`;}
function _admTabla(cab,filas,vacio){
  if(!filas.length)return `<div class="tp-empty">${escHtml(vacio)}</div>`;
  return `<div class="adm-tabla-wrap"><table class="adm-tabla"><thead><tr>${cab.map(c=>`<th>${escHtml(c)}</th>`).join('')}</tr></thead><tbody>${filas.map(f=>`<tr>${f.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function admPintar(){
  const d=_admDatos;if(!d)return;
  const t=d.totales||{},ev=d.evaluaciones||{},ing=d.ingresos||{};
  document.getElementById('admKpis').innerHTML=
    _admKpi('Candidatos',_admNum(t.candidatos))+_admKpi('Empresas',_admNum(t.empresas))+
    _admKpi('Evaluaciones',_admNum(t.evaluaciones))+_admKpi('Ofertas abiertas',_admNum(t.ofertasAbiertas),(t.ofertasTotal!=null?_admNum(t.ofertasTotal)+' en total':''))+
    _admKpi('Contactos desbloqueados',_admNum(t.desbloqueos))+_admKpi('Ingresos',_admEur(ing.totalEur),ing.enModoPrueba?ing.enModoPrueba+' en modo prueba de Stripe':'');
  document.getElementById('admKpisIA').innerHTML=
    _admKpi('Nota media',ev.notaMedia==null?'—':ev.notaMedia,'últimas '+_admNum(ev.muestra))+_admKpi('Coste medio por evaluación',_admEur(ev.costeMedioEur))+
    _admKpi('Coste total (muestra)',_admEur(ev.costeTotalEur))+_admKpi('Notas verificadas',ev.verificadasPct==null?'—':ev.verificadasPct+' %','recibo HMAC válido')+
    _admKpi('Con señales de manipulación',_admNum(ev.conSenalesInyeccion))+_admKpi('Riesgo de integridad alto',_admNum((ev.riesgo||{}).alto));
  const mod=Object.entries(ev.porModelo||{}).sort((a,b)=>b[1]-a[1]);
  document.getElementById('admModelos').innerHTML=_admTabla(['Modelo','Evaluaciones'],mod.map(([m,n])=>[escHtml(m),_admNum(n)]),'Sin evaluaciones todavía.');
  document.getElementById('admEvals').innerHTML=_admTabla(['Fecha','Candidato','Skill','Nota','Verificada','Riesgo','Modelo'],
    (ev.ultimas||[]).map(e=>[_admFecha(e.fecha),escHtml(e.alias),escHtml(e.skill),String(e.nota),e.verificada?'Sí':'No',e.riesgo?`<span class="tp-risk r-${escHtml(e.riesgo)}">${escHtml(e.riesgo)}</span>`:'—',escHtml(e.modelo||'Reserva')]),'Sin evaluaciones todavía.');
  document.getElementById('admKpisPagos').innerHTML=_admKpi('Ingresos',_admEur(ing.totalEur))+_admKpi('Pagos',_admNum(ing.pagos))+_admKpi('En modo prueba',_admNum(ing.enModoPrueba))+_admKpi('Entregas de contacto',_admNum(t.accesosContacto),'registro contact_access');
  document.getElementById('admPagos').innerHTML=_admTabla(['Fecha','Concepto','Importe','Modo'],(ing.ultimos||[]).map(p=>[_admFecha(p.fecha),escHtml(p.concepto),_admEur(p.importeEur),p.prueba?'Prueba':'Real']),'Todavía no hay pagos.');
  document.getElementById('admOfertas').innerHTML=_admTabla(['Fecha','Puesto','Empresa','Sector','Estado'],(d.ofertas||[]).map(o=>[_admFecha(o.fecha),escHtml(o.titulo),escHtml(o.empresa),escHtml(o.sector),o.estado==='open'?'Abierta':'Cerrada']),'Todavía no hay ofertas.');
  document.getElementById('admEmpresas').innerHTML=_admTabla(['Alta','Empresa','Sector','Tamaño'],(d.empresasRecientes||[]).map(c=>[_admFecha(c.alta),escHtml(c.nombre),escHtml(c.sector),escHtml(c.tamano)]),'Todavía no hay empresas.');
}

function admPintarCatalogo(){
  const q=tpNorm((document.getElementById('admBuscarReto')||{}).value||'');
  const lista=COMMON_EXERCISES.filter(ce=>!q||tpNorm(ce.title+' '+(ce.searchTerms||'')).includes(q));
  document.getElementById('admCatalogo').innerHTML=_admTabla(['Reto','Categoría','Skill','Ejercicios'],
    lista.map(ce=>[`<span class="adm-reto">${tpMonograma(ce.title,ce.category)}<span>${escHtml(ce.title)}</span></span>`,ce.category==='soft'?'Transversal':'Sector',escHtml(ce.skill||''),String((ce.exercises||[]).length)]),'Ningún reto coincide con la búsqueda.');
}
