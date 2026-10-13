// Aplica el tema elegido (claro, oscuro o el del sistema) antes de pintar la
// página, para que no haya un destello del tema equivocado al cargar.
// La elección se guarda solo en este navegador; si no se puede leer, manda el sistema.
(function(){
  try{
    var t=localStorage.getItem('tp-tema');
    if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);
  }catch(e){}
})();
