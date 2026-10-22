# Estado del producto

- Web: talentpact.es (Netlify, rama `main`). Datos: Supabase. Pagos: Stripe.
- Tests: 222 en 33 ficheros (`npm test`). Cifra canónica en `tfm/cifras_canonicas.json`.
- Ofertas: tabla `jobs` ya existe en producción; hay 9 ofertas (8 del seed de ejemplo de Iván + «Contable · TalentPact00.»). Las 8 de ejemplo se borran con `supabase_limpiar_ofertas_demo.sql` (pendiente de ejecutar).
- Scripts cliente `assets/js/app/00…19`; funciones `netlify/functions/*.mjs` → `lib/handlers/*.js`.
- Último trabajo: rediseño visual (tokens, modo oscuro, portada a dos columnas), paneles con estados de error honestos.

Ver: [[Sistema de diseño]] · [[Pendientes]]

- 15/10: tarjeta de oferta segura (XSS cerrado) y rediseñada; etapa del pipeline en todos los candidatos; diálogo propio para el motivo de descarte. Pendiente de commit.
- 15/10: el candidato recibe aviso en su bandeja cuando cambia su etapa en un proceso (necesita el SQL RRHH ya ejecutado).
- 15/10: revisión de lo de Iván. Corregidos los filtros de consentimiento que se saltaban ante fallos, los errores tapados, el encaje del 30 % sin skills y el doble envío. Pendiente de commit.
- 19/10: antitrampas: contenido de los 103 retos solo en el servidor (antes, enunciados y soluciones en el JS público), intento único con reloj de servidor, cámara obligatoria con comprobación previa, pantalla completa registrada. Tests: 170 en 28 ficheros.
- 19/10: áreas de empleo tipo LinkedIn: tablón por 7 áreas, oferta con área + especialidad, sector de empresa (12), nombres de skills en español. Tests: 170 en 28 ficheros.
- 19/10: Google para empresas (completar ficha tras el primer acceso) y verificación de empresa (Google Workspace o email corporativo) con sello en las ofertas. Google aún desactivado en Supabase. Tests: 170 en 28 ficheros.
- 19/10: oferta en tres pasos con requisitos imprescindible/valorable y banda mínima; relleno desde documento con IA (`parse-job-doc`, `claude-opus-5-5`); encaje por grupos. Resueltas marcas de conflicto de git que había en `index.html` y 6 documentos. Pendiente de commit y de ejecutar `supabase_schema_requisitos.sql`.
- 15/10: backend revisado entero. El servidor corrige con su propio catálogo de retos (notas verificadas no falsificables), pagos solo de empresas y sin cobro doble, errores sin filtrar datos y límites de tiempo. Pendiente de commit.
- 20/10: revisión de lo de Iván; notas en bandas; SkillPass W3C firmado con sello por lotes; rama IA (11 retos); menú lateral y Ajustes como página; seguridad (límites persistentes, CORS); los 342 ejercicios del catálogo auditados y mejorados (114 retos). Tests: 197 en 28 ficheros.
