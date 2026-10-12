// Analitica bajo consentimiento previo.
//
// gtag() existe siempre para que el resto del codigo pueda llamarlo sin
// comprobar nada, pero hasta que hay consentimiento los eventos solo se
// acumulan en dataLayer: no se descarga el script de Google, no se crean
// cookies y no sale ni una peticion a un tercero.
window.TP_GA_ID='G-JN1K33D5YZ';
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.TP_CONSENT_KEY='talentpact:v1:consent';

function tpConsentEstado(){
  try{ return localStorage.getItem(window.TP_CONSENT_KEY); }catch(e){ return null; }
}
function tpCargarAnalitica(){
  if(window.__tpGaCargada)return;
  window.__tpGaCargada=true;
  var sc=document.createElement('script');
  sc.async=true;
  sc.src='https://www.googletagmanager.com/gtag/js?id='+window.TP_GA_ID;
  document.head.appendChild(sc);
  gtag('js',new Date());
  // anonymize_ip reduce el dato que sale de la UE; no sustituye al consentimiento.
  gtag('config',window.TP_GA_ID,{anonymize_ip:true});
}
if(tpConsentEstado()==='aceptado')tpCargarAnalitica();
