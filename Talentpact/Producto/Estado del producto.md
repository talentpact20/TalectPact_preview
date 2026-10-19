# Estado del producto

- Web: talentpact.es (Netlify, rama `main`). Datos: Supabase. Pagos: Stripe.
- Tests: 156 en 20 ficheros (`npm test`). Cifra canónica en `tfm/cifras_canonicas.json`.
- Ofertas: tabla `jobs` ya existe en producción; hay 9 ofertas (8 del seed de ejemplo de Iván + «Contable · TalentPact00.»).
- Scripts cliente `assets/js/app/00…19`; funciones `netlify/functions/*.mjs` → `lib/handlers/*.js`.
- Último trabajo: rediseño visual (tokens, modo oscuro, portada a dos columnas), paneles con estados de error honestos.

Ver: [[Sistema de diseño]] · [[Pendientes]]

- 15/10: tarjeta de oferta segura (XSS cerrado) y rediseñada; etapa del pipeline en todos los candidatos; diálogo propio para el motivo de descarte. Pendiente de commit.
- 15/10: el candidato recibe aviso en su bandeja cuando cambia su etapa en un proceso (necesita el SQL RRHH ya ejecutado).
- 15/10: revisión de lo de Iván. Corregidos los filtros de consentimiento que se saltaban ante fallos, los errores tapados, el encaje del 30 % sin skills y el doble envío. Pendiente de commit.
- 19/10: Google para empresas (completar ficha tras el primer acceso) y verificación de empresa (Google Workspace o email corporativo) con sello en las ofertas. Google aún desactivado en Supabase. Tests: 156 en 20 ficheros.
- 19/10: oferta en tres pasos con requisitos imprescindible/valorable y banda mínima; relleno desde documento con IA (`parse-job-doc`, `claude-opus-5-5`); encaje por grupos. Resueltas marcas de conflicto de git que había en `index.html` y 6 documentos. Pendiente de commit y de ejecutar `supabase_schema_requisitos.sql`.
- 15/10: backend revisado entero. El servidor corrige con su propio catálogo de retos (notas verificadas no falsificables), pagos solo de empresas y sin cobro doble, errores sin filtrar datos y límites de tiempo. Pendiente de commit.
