# Sistema de diseño

- Tokens en `assets/css/tokens.css` (generado por `tools/generar_tokens.py`). Modo oscuro automático + selector.
- Capas CSS: tokens → app → modulos → tema → componentes → utilidades.
- Componentes JS en `18-interfaz.js`: tpPasos, tpBarraNota, tpAnillo, tpChip, tpEncaje, tpVacio, tpEsqueleto, tpSiguiente.
- Reglas (las vigila `tests/diseno.test.js`): sin colores ni tamaños a mano, sin `style="…"` nuevos, revisar en claro, oscuro y 375 px.
