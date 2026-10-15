# Errores encontrados y mejoras

Registro de lo que ha fallado en TalentPact durante la fase de prereunión (del 13 al 15/10/2026), con su causa, su estado y lo que queda abierto. El detalle de cada arreglo está en `01_changelog.md`. Aquí se ve todo junto para decidir qué falta.

Estados: **Arreglado** (en código, con tests en verde) · **Abierto: código** (lo hace Claude o Iván) · **Abierto: configuración** (Supabase o Netlify, lo hace el equipo) · **Decisión** (hay que elegir).

> Mientras no se apruebe el commit, los arreglos del 15/10 solo están en local. En talentpact.es sigue la versión anterior.

---

## 1. Seguridad y privacidad

| Error | Impacto | Causa | Estado |
| --- | --- | --- | --- |
| Ante un fallo pasajero (timeout, red), el pool, el contacto y el pago repetían la consulta **sin los filtros de consentimiento** (`pool_visible`, `allow_contact`) | Empresas viendo candidatos ocultos, contacto entregado tras retirar el consentimiento (RGPD, art. 7.3) y cobro por un perfil oculto | La comprobación de «falta la columna» miraba el mensaje entero, que incluye la ruta con el nombre de la columna | Arreglado (`faltaEnEsquema`, con test) |
| XSS en tarjetas de oferta, pantalla de requisitos, plantilla de ejercicios y vista previa de archivos | Una empresa podía inyectar código que se ejecutaba a cualquier visitante | Nombre de empresa, skills, título y nombre de archivo insertados sin escapar | Arreglado (con test) |
| La bandeja de avisos enviaba al candidato el `company_user_id` de la empresa que lo había desbloqueado | Permitía cruzar qué desbloqueos venían de la misma empresa | Se devolvía `meta` entero | Arreglado (con test) |
| Registro sin confirmar el email (`mailer_autoconfirm` activo) | Cualquiera puede crear una cuenta con un correo ajeno | Configuración de Supabase | **Abierto: configuración** |
| Cualquier usuario con sesión, también los candidatos, puede ver el pool anónimo con ciudad y salario mínimo | Exposición de datos de otros candidatos y competencia entre ellos | `get-talent-pool` solo exige sesión | **Decisión** (propuesta: solo empresas verificadas; ver `04_estrategia.md`, §3) |
| El rol está en `user_metadata`, que el usuario puede editar | Hoy no abre nada sensible, pero es una mala base para permisos | Elección inicial | Abierto: código (pasarlo a `app_metadata` antes de dar permisos por rol) |

## 2. Funcionalidad rota

| Error | Impacto | Causa | Estado |
| --- | --- | --- | --- |
| **«Aplicar» no guardaba nada:** mostraba «¡Candidatura enviada!» y la empresa nunca se enteraba | El flujo principal del candidato era falso | No existía el endpoint | Arreglado (función `apply`, idempotente) |
| Las ofertas no salían en el panel | Panel vacío | Faltaba la tabla `jobs` en Supabase | Arreglado (SQL ejecutado) |
| El acceso con Google no funcionaba | Error al pulsar el botón | Google y LinkedIn **desactivados** en Supabase Auth | Botones ocultos mientras tanto. **Abierto: configuración** (activar Google y añadir las URL de redirección) |
| Doble clic en «Aplicar» daba un error falso de «Falta la migración» | Mensaje confuso | Choque con el `unique` interpretado como tabla ausente | Arreglado |
| Doble clic en «Publicar oferta» la publicaba dos veces | Ofertas duplicadas | Sin bloqueo de envío; además, `publishJob` estaba duplicado en 17 y 19 | Arreglado (una sola versión con bloqueo) |
| El selector de etapa del pipeline solo aparecía en candidatos que aceptan contacto | Parte de los candidatos sin etapa | Leía la referencia del botón de contacto | Arreglado (`data-ref`) |
| Si una etapa no se guardaba, el desplegable mostraba la nueva | La empresa creía que estaba guardada | No se repintaba al fallar | Arreglado |
| Preguntas de la vacante fuera de la ficha de la oferta y arrastradas de una oferta a otra | Se veían mal o eran de otra oferta | Selector CSS agrupado que siempre devolvía el contenedor exterior | Arreglado |
| Scripts `check:google` y `check:rls` rotos | No se podía diagnosticar | Leían la configuración de `index.html` después de trocearlo | Arreglado |
| SQL `supabase_schema_pool_fix.sql` y `supabase_schema_rrhh_corto.sql` sin ejecutar | Sin ellos no funcionan las preferencias, postulaciones, avisos, pipeline y preguntas de vacante | Pendiente en Supabase | **Abierto: configuración** |

## 3. Errores ocultos y datos inventados (honestidad)

| Error | Impacto | Causa | Estado |
| --- | --- | --- | --- |
| Los errores de postulaciones y avisos se mostraban como «migración pendiente» con la lista vacía | Un fallo real parecía «no hay nada» | El mismo patrón de la sección 1 | Arreglado |
| Ranking con 15 candidatos inventados; panel de empresa con contadores falsos («8+») y alias inventados («#1000+») | Contenido de demostración, en contra de nuestra regla | Código antiguo de maqueta | Arreglado (eliminado) |
| «Reportar un error» decía «Reporte enviado» sin enviar nada | Promesa falsa | Maqueta | Arreglado (abre un correo real) |
| El ranking decía «Actualizado en tiempo real» | No lo es: se calcula al abrir la pestaña | Texto de maqueta | Arreglado |
| Al fusionar el trabajo de Iván se perdieron los estados de error de las ofertas | Volvía a decir «no hay ofertas» cuando fallaba la carga | Conflicto de fusión resuelto con la versión antigua | Arreglado (restaurado) |
| Ofertas y empresas de ejemplo del seed (NortePay, Orbit Labs, ClaroData, Verde Brand) en producción | Mercado inventado a la vista de la asesora | Seed de Iván para probar | **Decisión** (quitar, marcar o mantener) |

## 4. Lógica de negocio

| Error | Impacto | Causa | Estado |
| --- | --- | --- | --- |
| Un candidato sin ninguna skill de la oferta salía con un 30 % de encaje | «Candidatos que encajan» mostraba todo el pool | Las condiciones sumaban por sí solas | Arreglado (sin skills, 0 %; quien se postula aparece siempre) |
| Con ofertas que solo piden skills de personas se regalaban 30 puntos de «técnico» | Encaje inflado | Peso fijo aunque no se pidiera técnico | Arreglado |
| Las condiciones desconocidas cuentan como encaje completo | Quien no rellena preferencias sale beneficiado | Valor por defecto 1 | **Decisión** (propuesta: contarlas como neutras) |
| Reintentos ilimitados: el pool guarda la mejor nota | La nota mide práctica, no competencia | Sin política de reintentos | **Decisión** (ver `04_estrategia.md`, §2) |
| Nota global = media de las 6 mejores skills | Un reto a 95 supera a seis retos a 85 | Definición del score | **Decisión** (ver `04_estrategia.md`, §2) |
| Alias de 4 caracteres | Con unos 300 candidatos es probable que dos coincidan | Longitud del alias | Abierto: código (cambio pequeño) |

## 5. Experiencia y aspecto

| Error | Estado |
| --- | --- |
| La tabla del pool (8 columnas) desbordaba el panel a 1024 px y todo el panel se desplazaba en horizontal | Arreglado |
| Ranking y pool sin «Reintentar» al fallar; el ranking se quedaba en «Cargando…» si no había token | Arreglado |
| Motivo de descarte pedido con `window.prompt` | Arreglado (diálogo propio y accesible) |
| Al entrar con Google por el portal equivocado se cambiaba de panel sin avisar | Arreglado |
| Aviso de postulados ocultos sin estilo | Arreglado |
| 84 `style="…"` en las plantillas de los scripts (colores y tamaños fuera del sistema de diseño) | Parcial: pasados a clases 51; quedan 33 dinámicos. Abierto: código |
| Avisos solo dentro de la web; el FAQ promete aviso al candidato | **Abierto**: hace falta la clave de un proveedor de email |

## 6. Rendimiento y mantenimiento

| Mejora | Estado |
| --- | --- |
| «Marcar leídos» hacía una petición por aviso | Arreglado (una sola) |
| El pipeline leía la etapa previa con dos consultas | Arreglado (una) |
| Las versiones `?v=` sin actualizar hacían que los navegadores siguieran usando el JS viejo | Se suben con cada cambio. Conviene automatizarlo al desplegar |

---

## Patrones que causan errores (para no repetirlos)

1. **Comprobar errores por texto.** Buscar un nombre en `err.message` acierta con cualquier error de esa tabla. Para «falta la migración» se usa siempre `faltaEnEsquema()` (`netlify/functions/lib/tp.js`). Nunca se relaja un filtro de privacidad por un error.
2. **Sustituir funciones desde otro fichero.** Los scripts 17 y 19 reasignan funciones de 08 y 10 (`publishJob`, `openJob`, `encajeOferta`…). Así se acabó con dos copias de `publishJob` que se pisaban. Regla: cada función tiene **un solo fichero dueño**; si otro fichero necesita cambiarla, se cambia en el dueño.
3. **Fusiones sin revisar el diff.** La fusión del 14/10 borró trabajo anterior sin que nadie lo viera. Regla: antes de subir una fusión, revisar `git diff` de los ficheros con conflictos.
4. **Pantallas que fingen.** Botones o textos que dicen haber hecho algo que no ocurre: «Aplicar», «Reporte enviado», «tiempo real». Regla: si algo no está construido, se dice o no se muestra.
5. **Probar solo el caso feliz.** Casi todos los fallos aparecían con doble clic, errores de red o datos vacíos. Regla: probar cada pantalla nueva con fallo de red, sin datos y con doble clic.

## Lo que queda abierto, por responsable

**Equipo (Supabase y decisiones)**
- [ ] Ejecutar `supabase_schema_pool_fix.sql` y `supabase_schema_rrhh_corto.sql`.
- [ ] Activar Google en Supabase y añadir `https://talentpact.es/` a las URL de redirección.
- [ ] Exigir confirmación del email.
- [ ] Decidir sobre las ofertas de ejemplo, el acceso de candidatos al pool, las condiciones desconocidas, la política de reintentos y la nota global.
- [ ] Clave de un proveedor de email para los avisos.
- [ ] Aprobar el commit y el despliegue de los arreglos del 15/10.

**Código**
- [ ] Alias anónimo más largo.
- [ ] Rol en `app_metadata`.
- [ ] Los 33 estilos en línea dinámicos que quedan.
- [ ] Email real de los avisos (cuando esté la clave).
- [ ] Lo que se decida de `04_estrategia.md`.
