if('scrollRestoration'in history)history.scrollRestoration='manual';
if(location.hash)try{history.replaceState(null,'',location.pathname+(location.search||''));}catch(e){}
var _st_iv=null;
function _scrollTop(){
  window.scrollTo(0,0);
  // Este script corre en <head>: document.body todavia no existe en la primera
  // llamada. Sin la guarda, el TypeError abortaba el resto del bloque y los
  // listeners de DOMContentLoaded y pageshow no llegaban a registrarse.
  if(document.documentElement)document.documentElement.scrollTop=0;
  if(document.body)document.body.scrollTop=0;
}
function _stopScrollGuard(){
  if(_st_iv){clearInterval(_st_iv);_st_iv=null;}
}
function _startScrollGuard(){
  _scrollTop();
  _stopScrollGuard();
  var _n=0;
  _st_iv=setInterval(function(){
    _scrollTop();
    if(++_n>=16)_stopScrollGuard(); // máx 800ms, para antes si el usuario toca
  },50);
}
// Parar el guard en cuanto el usuario interactúe (toque o rueda)
window.addEventListener('touchmove',_stopScrollGuard,{once:true,passive:true});
window.addEventListener('wheel',_stopScrollGuard,{once:true,passive:true});
_startScrollGuard();
document.addEventListener('DOMContentLoaded',_scrollTop);
// pageshow: carga inicial, recarga y bfcache iOS
window.addEventListener('pageshow',function(){_startScrollGuard();});
