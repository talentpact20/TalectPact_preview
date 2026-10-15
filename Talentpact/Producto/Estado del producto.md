# Estado del producto

- Web: talentpact.es (Netlify, rama `main`). Datos: Supabase. Pagos: Stripe.
<<<<<<< HEAD
- Tests: 138 en 18 ficheros (`npm test`). Cifra canónica en `tfm/cifras_canonicas.json`.
=======
- Tests: 128 en 15 ficheros (`npm test`). Cifra canónica en `tfm/cifras_canonicas.json`.
>>>>>>> 5492cdb98e9ecc87f1827d67a4cdef916c8d44f7
- Ofertas: tabla `jobs` ya existe en producción; hay 9 ofertas (8 del seed de ejemplo de Iván + «Contable · TalentPact00.»).
- Scripts cliente `assets/js/app/00…19`; funciones `netlify/functions/*.mjs` → `lib/handlers/*.js`.
- Último trabajo: rediseño visual (tokens, modo oscuro, portada a dos columnas), paneles con estados de error honestos.

Ver: [[Sistema de diseño]] · [[Pendientes]]

- 15/10: tarjeta de oferta segura (XSS cerrado) y rediseñada; etapa del pipeline en todos los candidatos; diálogo propio para el motivo de descarte. Pendiente de commit.
- 15/10: el candidato recibe aviso en su bandeja cuando cambia su etapa en un proceso (necesita el SQL RRHH ya ejecutado).
- 15/10: revisión de lo de Iván. Corregidos los filtros de consentimiento que se saltaban ante fallos, los errores tapados, el encaje del 30 % sin skills y el doble envío. Pendiente de commit.
- 15/10: backend revisado entero. El servidor corrige con su propio catálogo de retos (notas verificadas no falsificables), pagos solo de empresas y sin cobro doble, errores sin filtrar datos y límites de tiempo. Pendiente de commit.
