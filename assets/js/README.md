# JavaScript de cliente

Scripts clásicos (sin build ni módulos ES) que `index.html` carga **en orden
numérico**. Comparten el ámbito global: una función declarada en `04-…` se puede
llamar desde un `onclick` del HTML o desde `10-…`.

| Fichero | Qué contiene |
|---|---|
| `head/scroll.js` | Vuelta al inicio al cargar (antes del primer pintado). |
| `head/analitica.js` | Google Analytics solo con consentimiento previo. |
| `app/01-datos-ofertas.js` | Ofertas, empresas y condiciones de cada oferta (jornada, modalidad, salario). |
| `app/02-grabacion.js` | Motor de grabación de audio y vídeo de los retos. |
| `app/03-datos-retos.js` | Ejercicios de los retos de ventas, idiomas, cognitivos, diseño y RRHH. |
| `app/04-estado-y-nube.js` | Perfil del candidato, persistencia local (`TP`) y Supabase (`TPCloud`). |
| `app/05-qr.js` | Generador de QR local (`TPQr`). |
| `app/06-skillpass-y-sesion.js` | SkillPass, pool de talento y `tpArrancarSesion()`. |
| `app/07-retos-comunes.js` | Catálogo de retos comunes y panel del candidato. |
| `app/08-ofertas-y-ejercicios.js` | Listado de ofertas, modal de reto, filtro de calidad y llamada al corrector. |
| `app/09-acceso.js` | Login, registro, recuperación, acceso social y ajustes de cuenta. |
| `app/10-paneles-y-pagos.js` | Paneles de candidato y empresa, pagos con Stripe y publicación de ofertas. |
| `app/11-superadmin.js` | Backoffice (demo con datos ficticios salvo sesión con rol `admin`). |
| `app/12-soporte-y-ranking.js` | Chat de soporte, ranking, onboarding y FAQ. |
| `app/13-integridad.js` | `TPIntegrity`: cámara, anti-copia, pestañas e informe de integridad. |
| `app/14-empleo.js` | `TPEmpleo`: preferencias de empleo, encaje y pool filtrable. |
| `app/15-proteccion-acceso.js` | `TPAuthGuard`: bloqueo por intentos, política de contraseñas, inactividad. |
| `app/16-pool-real.js` | `TPPool`: pool real desde Supabase, contacto real tras el pago y sincronización de preferencias. |
| `app/99-arranque.js` | Restaura la sesión cuando todo lo anterior está definido. |

## Regla de orden

Al **cargar**, un fichero solo puede usar lo definido en él o en uno anterior
(las funciones de otro script no se "elevan" entre ficheros). Lo que se ejecuta
más tarde —`onclick`, eventos, `setTimeout`— puede usar cualquier fichero. Por
eso el arranque de sesión, que llama a acceso y paneles, vive en `99-arranque.js`.

Al añadir código que se ejecute al cargar, comprueba que no llame a funciones de
un fichero posterior. Si cambias la versión de un fichero, sube el `?v=` de su
`<script>` en `index.html` para que el navegador no use la copia en caché.
