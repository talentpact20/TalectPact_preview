// TalentPact · 99-arranque
// Arranque: restaura la sesión (o procesa la vuelta de un login social o de
// un enlace de recuperación) cuando todos los módulos ya están definidos.
tpArrancarSesion().finally(()=>{try{tpMostrarEntradaAdmin();}catch(e){}});
