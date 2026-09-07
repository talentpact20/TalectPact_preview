# TalentPact — Skills-Based Hiring con IA

> Marketplace europeo de talento **100 % anónimo**: los candidatos demuestran sus habilidades con retos prácticos **evaluados en tiempo real por IA** y las empresas acceden a perfiles pre-validados bajo un modelo **pay-per-result** (€49/contacto).

Máster en Fintech, Mercados Financieros y Blockchain · Bloque Data Science & IA
**Autores:** Xavier Griñó, Ivan Sánchez

---

## 1. Qué hay en este repositorio

| Componente | Ruta | Descripción |
|---|---|---|
| **Producto web** | `index.html` | Aplicación completa (candidato · empresa · superadmin). HTML/CSS/JS sin framework. |
| **Corrección IA (backend)** | `api/_handlers/evaluate-exercise.js` | Función serverless que llama a la API de Anthropic (Claude) para evaluar respuestas. |
| **Chatbot de soporte** | `api/_handlers/support-chat.js` | Función serverless del asistente conversacional. |
| **Formulario de contacto** | `api/_handlers/contact.js` | Recoge los mensajes de "Hablemos" en Supabase (sustituye a Netlify Forms). |
| **Persistencia** | dentro de `index.html` (módulo `TP`) | Capa de persistencia en `localStorage` (perfil, pool de talento, desbloqueos, audit trail de evaluaciones). |
| **SkillPass (credencial)** | `api/_handlers/issue-credential.js` · `anchor-credential.js` · `verify-credential.js` | Emisión del CV verificable, anclaje de su hash en blockchain y verificación pública. |
| **Contrato** | `tfm/tech/contracts/SkillPassRegistry.sol` | Registro de huellas en Ethereum Sepolia. Solo hashes: ningún dato personal on-chain. |
| **Verificador público** | `verify.html` | Página sin cuenta donde cualquiera comprueba un SkillPass. |
| **Pagos (Stripe)** | `api/_handlers/create-checkout-session.js` · `stripe-webhook.js` · `confirm-checkout.js` | Cobro del desbloqueo de contacto vía Stripe Checkout y concesión del acceso solo tras confirmar el pago. |
| **PoC del Agente Evaluador** | `poc_entrega2/` | Prototipo en Python (Entrega 2) que demuestra el motor de evaluación con Dynamic Prompting + Chain of Thought. |
| **Tests automáticos** | `tests/` | 91 casos con el *runner* nativo de Node. Sin claves, sin red, sin dependencias de testing. |
| **Banco de pruebas del evaluador** | `tfm/tech/eval/` | Gold set de 12 ítems + métricas (κ cuadrática, MAE, Spearman, test-retest, bloqueo de inyección, coste). |
| **Cifras canónicas** | `tfm/cifras_canonicas.json` | Fuente de verdad numérica del TFM. Si la memoria discrepa, manda este fichero. |
| **Entregables** | `entrega_final/` | Informe técnico final, guion de demo, guiones de presentación, deck de defensa y batería de Q&A. |
| **Business plan (TFM)** | `tfm/business_plan/` | Los ocho apartados del enunciado + resumen ejecutivo, metodología y conclusiones. |

---

## 2. Instalación y uso — Producto web

El producto es una web estática + funciones serverless de Vercel. La corrección con IA requiere una clave de API de Anthropic.

### 2.1 Requisitos

- [Node.js](https://nodejs.org/) ≥ 18
- [Vercel CLI](https://vercel.com/docs/cli) (opcional): `npm install -g vercel`
- Una **API key de Anthropic** ([console.anthropic.com](https://console.anthropic.com/))

### 2.2 Ejecución en local

Hay dos formas. La corrección IA requiere que las funciones serverless estén activas (no basta con abrir el HTML).

**Opción A — Sin instalar nada (recomendada para la demo):** un mini-servidor en Node puro incluido en el repo.

```bash
# Desde la raíz del repositorio (Node >= 18)
export ANTHROPIC_API_KEY="sk-ant-..."
node serve-demo.js          # abre http://localhost:8888
```

`serve-demo.js` sirve `index.html` y ejecuta los handlers de `api/_handlers/` en `/api/*`, replicando `vercel dev` sin dependencias.

**Opción B — Vercel CLI:** reproduce el entorno real de producción.

```bash
npm install -g vercel
vercel link            # vincula la carpeta con el proyecto
vercel env pull .env   # descarga las variables del panel
export ANTHROPIC_API_KEY="sk-ant-..."
export ANTHROPIC_MODEL="claude-sonnet-4-6"   # opcional; modelo por defecto
vercel dev             # http://localhost:3000
```

> **Modelo:** el modelo por defecto es `claude-sonnet-4-6`. Modelos antiguos como `claude-3-5-sonnet-latest` pueden devolver `not_found_error` si ya no están disponibles en tu cuenta. Ajusta `ANTHROPIC_MODEL` si tu cuenta usa otro identificador.

> **Nota:** abrir `index.html` con doble clic (protocolo `file://`) carga la web pero **no** la corrección IA, porque las funciones serverless no están disponibles. En ese caso la app degrada con elegancia a una puntuación heurística local (`fallbackScore`).

### 2.3 Despliegue (Vercel)

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new) con
   **Framework Preset: `Other`**, *Build Command* vacío y *Output Directory* en
   la raíz. Vercel detecta `api/` y despliega el router.
2. En *Settings → Environment Variables* define las claves para los tres
   entornos (Production, Preview y Development). Como mínimo `ANTHROPIC_API_KEY`,
   `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`; el resto (Stripe, blockchain) activa
   sus funciones correspondientes y sin ellas esos endpoints responden 503 con
   un mensaje claro, sin tumbar el resto de la web.
3. Ejecuta `tfm/tech/supabase_schema_contact.sql` en el *SQL Editor* de Supabase.
   **Netlify Forms no tiene equivalente en Vercel**: el formulario "Hablemos"
   ahora envía a `api/_handlers/contact.js` y los mensajes se leen en
   *Table Editor → contact_messages*.
4. Añade la URL del despliegue en **Supabase → Authentication → URL Configuration**
   (*Site URL* y *Redirect URLs*) y en los orígenes de **Google Cloud Console**,
   o el acceso con Google fallará al volver del proveedor.
5. Actualiza el endpoint del webhook en **Stripe → Developers → Webhooks** a
   `https://<tu-sitio>/api/stripe-webhook`.
6. Comprueba el resultado:

   ```bash
   npm run check:deploy -- https://tu-proyecto.vercel.app
   ```

   Recorre la web y los quince endpoints y dice cuál responde y cuál no. Es de
   solo lectura, así que puede ejecutarse contra producción.

### 2.3.1 Una sola función: `api/[fn].js`

El plan Hobby de Vercel admite **12 funciones** y aquí hay **15 endpoints**, así
que no vale el esquema de un archivo por función. En su lugar hay un router
único: `[fn]` captura el último segmento de la ruta, de modo que `/api/save-profile`
sigue llamándose igual y solo cambia quién lo atiende. Los handlers viven en
`api/_handlers/` con su firma original de Netlify, sin tocar su lógica; Vercel
ignora los directorios que empiezan por guion bajo, así que viajan en el bundle
sin publicarse como endpoints.

El router **desactiva el parseo automático del cuerpo** (`bodyParser: false`) y
lee los bytes tal cual. No es un detalle menor: `stripe-webhook` valida la firma
sobre el cuerpo literal, y `JSON.stringify` de un objeto ya parseado produce
bytes distintos, así que con el parseo activado **la firma fallaría siempre y los
pagos se quedarían sin confirmar**. `tests/router-vercel.test.js` lo cubre
firmando un evento de prueba y comprobando que sigue validando al otro lado.

### 2.3.2 Migrar sin romper lo que ya funciona

La migración vive en una rama aparte; `main` conserva `netlify.toml` y
`netlify/functions/`, así que Netlify sigue sirviendo la versión conocida
mientras se prueba Vercel.

1. En Vercel, *Settings → Git → Production Branch* → la rama de la migración.
2. Despliega, pasa `npm run check:deploy` y prueba a mano lo que un script no
   puede: acceso con Google, un reto corregido por IA, un pago de prueba y el
   formulario de contacto.
3. Cuando todo esté bien: fusiona en `main`, devuelve *Production Branch* a
   `main` y borra el sitio de Netlify.

> Si algo falla, `main` y Netlify siguen intactos: se corrige sobre la rama.

### 2.4 Acceso con Google / LinkedIn (OAuth)

El botón **Google** del modal de candidato usa **Supabase Auth** (`signInWithOAuth`).
El código ya está integrado en `index.html`; falta únicamente habilitar el proveedor
en los paneles de Google y Supabase. Mientras no lo esté, el botón se muestra
atenuado y explica al usuario que use email o el acceso de invitado.

**1) Google Cloud Console** — https://console.cloud.google.com/apis/credentials

- *Crear credenciales → ID de cliente de OAuth → Aplicación web*.
- **Orígenes autorizados de JavaScript:** `http://localhost:8888` y la URL del sitio en producción.
- **URI de redirección autorizados:** `https://vqyqedmizxqneniynxqp.supabase.co/auth/v1/callback`
- Copia el *Client ID* y el *Client Secret*.

**2) Supabase** — *Authentication → Sign In / Providers → Google*

- Activa el proveedor y pega el Client ID y el Client Secret.

**3) Supabase** — *Authentication → URL Configuration*

- **Site URL:** la URL de producción del sitio.
- **Redirect URLs:** añade `http://localhost:8888/**` y `https://<tu-sitio>/**`.
  La app vuelve a `window.location.origin + pathname`; si esa URL no está en la
  lista, Supabase redirige al *Site URL* y se pierde el destino.

**Comprobar que está activo** (sin abrir el navegador):

```bash
npm run check:google                       # comprueba http://localhost:8888/
npm run check:google -- https://tu-sitio   # comprueba también producción
```

El script dice, uno por uno, qué falta: si el proveedor está apagado, si Google
acepta el Client ID, qué redirect URI recibirá Google y a qué URL volverá la
sesión después del login.

La app consulta `/auth/v1/settings` cada vez que se abre el modal de acceso, así
que el botón se enciende solo en cuanto Google quede habilitado: no hay que
volver a tocar el código ni volver a desplegar.

Para **LinkedIn** el proceso es idéntico con el proveedor `linkedin_oidc`
(LinkedIn Developers → app → *Sign In with LinkedIn using OpenID Connect*).

### 2.5 Cómo se usa

- **Candidato:** entra al portal de candidato → elige un reto → responde → la IA evalúa y devuelve un *Skill Score* (0-100) con feedback por criterio. El progreso se guarda y aparece en el pool de talento.
- **Empresa:** crea una cuenta corporativa (empresa, contacto, cargo, tamaño) → publica ofertas con las skills exigidas → consulta el pool anónimo → desbloquea el contacto de un candidato (€49, pago simulado) y recibe su ficha de contacto.
- **Superadmin:** panel de métricas de negocio e IA, incluyendo un bloque de **datos reales** alimentado por las evaluaciones registradas en esta instalación.

**Modelo de cuentas.** Los dos portales comparten el mismo Supabase Auth; lo que
los separa es `user_metadata.role` (`candidate` | `empresa`), que se fija al
crear la cuenta. Cada portal rechaza a quien no le corresponde y lo redirige al
suyo, así que no hacen falta tablas ni proyectos adicionales. Los datos de la
empresa (nombre, persona de contacto, cargo, tamaño) viajan en ese mismo
`user_metadata`. Ambos portales conservan un acceso **de invitado** sin cuenta
para poder recorrer la demo sin registrarse.

### 2.6 Gestión de cuentas y perfiles

Ambos paneles de **Ajustes** (candidato y empresa) operan contra Supabase; no son
maquetas. Lo que hace cada bloque:

| Bloque | Qué hace de verdad |
|---|---|
| Datos personales / perfil de empresa | Lee y escribe `user_metadata` (Supabase Auth) y la tabla `profiles` vía `save-profile`. |
| Cambio de email | `auth.updateUser({email})` — Supabase envía el correo de confirmación. |
| Cambio de contraseña | `auth.updateUser({password})`, con validación de longitud y coincidencia. |
| Cerrar otras sesiones | `auth.signOut({scope:'others'})` — cierra el resto de dispositivos, no el actual. |
| Descargar mis datos | Genera un JSON en el navegador con perfil, skills, retos y evaluaciones (RGPD art. 20). |
| Eliminar cuenta | Función `delete-account`: borra credenciales, evaluaciones, perfil y usuario de Auth. |
| Privacidad (candidato) | Cada interruptor cambia lo que ve la empresa: salir del pool, salir del ranking, o dejar de aceptar desbloqueos. |
| Pausar cuenta (empresa) | Retira sus ofertas del listado público sin borrarlas. |
| Plan, uso y pagos (empresa) | Cifras calculadas de sus ofertas y desbloqueos reales, no valores fijos. |

Las preferencias se guardan en `user_metadata.prefs` cuando hay sesión y siempre
en `localStorage`, para que el modo invitado también las conserve.

**Seguridad del borrado.** `delete-account` no acepta un `userId`: recibe el
*access token* de la sesión y pregunta a Supabase de quién es. Así una petición
manipulada no puede borrar la cuenta de otra persona. Requiere
`SUPABASE_SERVICE_KEY` en el servidor; si falta, responde 503 con un mensaje
explícito en lugar de fingir que ha borrado algo.

**Lo que todavía NO está conectado** (se muestra marcado como *No disponible* o
*Simulado* en la interfaz, nunca como si funcionara):

- **Envío de correos.** No hay proveedor de email conectado, así que las
  preferencias de notificación se guardan pero no se envía nada.
- **Cobros reales.** La pasarela **ya está conectada** (Stripe Checkout, ver §4),
  pero en modo de prueba: no se cobra nada. No debe pasarse a producción hasta
  que los datos de contacto que se entregan sean reales.
- **Verificación en dos pasos (TOTP)** y **registro de actividad**: requieren
  trabajo de servidor que queda fuera de esta preview.
- **Planes Pro / Enterprise**: no hay facturación recurrente.

### 2.7 Persistencia de datos

El módulo `TP` (en `index.html`) persiste en `localStorage` del navegador:
`profile` (perfil del candidato), `pool` (candidatos evaluados), `unlocks` (contactos desbloqueados), `empJobs` (ofertas publicadas) y `evals` (audit trail de evaluaciones IA).

Para reiniciar el estado de una demo, en la consola del navegador:

```js
TP.reset(); location.reload();
```

> En producción esta capa se sustituye por **Supabase (PostgreSQL + Row Level Security)** según el Project Charter; `localStorage` se usa aquí para una demo 100 % reproducible y sin infraestructura externa.

---

## 3. SkillPass — credencial verificable en blockchain

El SkillPass es la respuesta a "¿cómo sé que esa nota es real?". Un PDF se edita; un
sello criptográfico no.

### 3.1 Cómo funciona

1. **Emisión** (`issue-credential`) — compone un CV en JSON con el mejor resultado por
   skill del candidato y calcula su `keccak256`. El JSON se canonicaliza (claves
   ordenadas) para que el hash sea reproducible: el mismo CV siempre da el mismo hash.
2. **Anclaje** (`anchor-credential`) — envía **solo el hash** al contrato
   `SkillPassRegistry`. Los datos personales nunca salen de Supabase (UE).
3. **Verificación** (`verify-credential` / `verify.html`) — recalcula el hash del JSON
   recibido y pregunta al contrato si está anclado. Si alguien retocó un punto de una
   nota, el hash cambia y el sello no aparece.

**Por qué solo el hash.** Una blockchain es inmutable y el RGPD exige poder borrar. La
huella no es un dato personal y el CV real vive off-chain, donde sí puede eliminarse:
al borrarlo, el hash on-chain queda huérfano y deja de significar nada.

### 3.2 Red y contrato

| | |
|---|---|
| Red | **Ethereum Sepolia** (testnet, chainId 11155111) |
| Contrato | [`0x85418F3d978e691C0f784bA63E4cB2826478f73A`](https://sepolia.etherscan.io/address/0x85418F3d978e691C0f784bA63E4cB2826478f73A) |
| Registro del despliegue | `tfm/tech/build/deployment-sepolia.json` |
| Faucet | [Google Cloud Web3](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) — solo pide cuenta de Google |

> Se eligió Sepolia y no Polygon Amoy porque los faucets de Amoy exigían saldo de
> mainnet. La red está definida una sola vez en `CHAIN` (en
> `api/_lib/tp.js` y `tfm/tech/scripts/lib-env.js`); **ambos deben moverse
> a la vez** si se cambia de cadena.

### 3.3 El sellado no es instantáneo

Un bloque de Sepolia tarda ~12 s y las funciones se cortan por tiempo (10 s por defecto en Vercel; `vercel.json` lo sube a 60 s). Por eso
`anchor-credential` **no espera** a la confirmación: difunde la transacción, guarda el
`tx_hash` y responde `pending`; el frontend consulta hasta que la red confirma. El enlace
a Etherscan ya funciona desde el primer segundo.

Volver a llamar a `anchor-credential` con la misma credencial es **idempotente**: si la
transacción ya se difundió recoge su recibo, y si el hash ya está anclado reconcilia el
registro — en ningún caso reenvía la transacción ni vuelve a gastar gas.

### 3.4 Quién puede hacer qué

| Función | Requiere sesión | Por qué |
|---|---|---|
| `issue-credential` | **Sí** | El candidato sale del *access token*, no de un `userId` del cliente. Si no, cualquiera podría emitir la credencial de otro. |
| `anchor-credential` | **Sí** | Cada anclaje gasta gas de la wallet emisora. Además solo ancla credenciales del propio usuario. |
| `verify-credential` | No | Verificar es público a propósito: exigir cuenta destruiría el sentido de una credencial verificable. Solo lee, no gasta gas. |

Las funciones que exigen sesión leen la cabecera `Authorization: Bearer <access token>` y
le preguntan a Supabase de quién es — el mismo patrón que `delete-account`.

### 3.5 Probarlo

```bash
npm run doctor            # comprueba IA, datos, RPC/wallet y contrato
npm run demo              # http://localhost:8888
```

En el portal de candidato: completa un reto → **Sellar mi SkillPass**. Obtienes el JSON,
un PDF certificado, un QR y un enlace público. Pega cualquiera de ellos en
`http://localhost:8888/verify.html` (o en la sección **SkillPass** de la portada) para
comprobarlo desde fuera.

Para ver que el sello es real, edita una nota del JSON descargado y vuelve a verificarlo:
deja de validar.

> El QR se genera en el propio navegador (`TPQr`, en `index.html` y `verify.html`).
> Antes se pedía a `api.qrserver.com`, lo que enviaba el hash de cada credencial a un
> tercero cada vez que se pintaba la tarjeta.

---

## 4. Pagos — desbloqueo de contacto con Stripe

El modelo de negocio cobra **€49 por contacto desbloqueado**. La pasarela es
**Stripe Checkout** (página alojada por Stripe).

### 4.1 Por qué Checkout y no un formulario propio

Ningún dato de tarjeta pasa por TalentPact: el usuario los introduce en el
dominio de Stripe. Es lo que mantiene el proyecto en el **SAQ-A** de PCI DSS,
que es exactamente lo que asume el plan de negocio
(`tfm/business_plan/07_regulacion_compliance.md`). El modal de pago no contiene
—ni debe volver a contener— campos de número de tarjeta, caducidad o CVC.

### 4.2 Dos reglas que sostienen todo lo demás

1. **El importe lo fija el servidor.** `UNLOCK_PRICE` vive en
   `api/_lib/tp.js`. Si el precio viniera del navegador, se podría
   pagar un céntimo cambiando una variable en la consola.
2. **El desbloqueo no se concede en el cliente.** `create-checkout-session` solo
   deja una fila en `unlocks` con estado `pending`. Quien la pasa a `paid` es
   Stripe: el webhook, o `confirm-checkout` preguntando a la API de Stripe al
   volver del pago. Antes bastaba con escribir `_unlocked=true` en la consola.

### 4.3 Estados de un desbloqueo

| Estado | Qué significa |
|---|---|
| `pending` | Sesión de pago creada. No da acceso a nada. |
| `paid` | Stripe confirmó el cobro. Es el único estado que desbloquea el contacto. |
| `expired` | El usuario abandonó y la sesión caducó. |
| `failed` | Pago diferido (SEPA) que acabó rechazado. |

Un índice único impide que una empresa pague dos veces por el mismo candidato:
si ya lo desbloqueó, `create-checkout-session` devuelve `alreadyUnlocked` sin
abrir Stripe.

### 4.4 Configuración

Crear la cuenta de Stripe es gratis y **no pide tarjeta**. Las claves están en
[dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
con el interruptor de *modo de prueba* activado.

```bash
STRIPE_SECRET_KEY=sk_test_...      # ⚠️ secreta, solo servidor
STRIPE_WEBHOOK_SECRET=whsec_...    # firma del webhook
```

**Webhook en producción** — Stripe → *Developers → Webhooks → Add endpoint*:

```
https://<tu-sitio>/api/stripe-webhook
```

Eventos: `checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.

**Webhook en local** — con la [CLI de Stripe](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:8888/api/stripe-webhook
```

Sin webhook la demo funciona igual (`confirm-checkout` verifica contra Stripe al
volver), pero si el usuario cierra la pestaña antes de volver, su desbloqueo se
queda en `pending`.

### 4.5 Probarlo

```bash
npm run doctor     # comprueba la clave contra la API de Stripe y avisa del modo
npm run demo
```

Entra como empresa → pool de talento → **Desbloquear contacto** → *Pagar con
Stripe*. En modo de prueba usa la tarjeta **4242 4242 4242 4242**, cualquier
fecha futura y cualquier CVC ([más tarjetas](https://stripe.com/docs/testing)).
No hay banco ni cobro: son números que solo existen dentro del entorno de
pruebas de Stripe.

Para comprobar que el pago manda de verdad, abre la consola y escribe
`CANDIDATES[0]._unlocked=true`: la ficha no se abre, porque el acceso lo decide
el servidor.

> ⚠️ **No pongas claves `sk_live_` todavía.** Los datos de contacto que se
> entregan tras pagar son ficticios: `candidateContact()` (en `index.html`) los
> genera a partir del id del candidato. Cobrar dinero real por ellos sería
> cobrar por datos inventados. `npm run doctor` bloquea explícitamente esa
> combinación. Antes de pasar a producción hay que servir los contactos reales
> desde la tabla `profiles`.

---

## 5. Tests y métricas

Todo lo de este apartado corre **sin clave de API, sin red y sin base de datos**.

```bash
npm test                       # 91 casos, ~0,2 s
npm run doctor                 # qué falta configurar (IA, datos, blockchain, pagos)
npm run bench -- --dry-run     # enseña los prompts del banco de pruebas sin gastar nada
npm run bench -- --offline     # recalcula las métricas desde la última ejecución guardada
```

Con `ANTHROPIC_API_KEY` en el entorno, `npm run bench` ejecuta el gold set completo (12 ítems × 3 repeticiones ≈ $0,65; imprime la estimación antes de empezar) y regenera `tfm/tech/eval/REPORT.md`.

### 5.1 Qué cubre cada fichero de test

| Fichero | Qué protege |
|---|---|
| `tests/evaluate-exercise.test.js` | Contrato del motor: `temperature=0`, notas acotadas a 0-100, nota ausente = 0, fallo explícito si el modelo devuelve prosa, cascada de modelos que no reintenta ante una clave revocada, clave de API fuera de la respuesta. |
| `tests/skillpass.test.js` | El sello: hash determinista, independiente del orden de las claves, y que **cambiar un punto de una nota rompe la verificación**. |
| `tests/quality-gate.test.js` | Filtro de calidad del cliente, extraído de `index.html` en tiempo de test. |
| `tests/metrics.test.js` | La estadística del banco, contrastada contra valores calculados a mano. |
| `tests/bench.test.js` | El propio banco de pruebas, con ejecuciones sintéticas. |
| `tests/coherencia-docs.test.js` | Que las cifras de la memoria cuadren con los datos del repositorio. |

El detalle del protocolo de medición está en [`tfm/tech/eval/README.md`](tfm/tech/eval/README.md).

---

## 6. Instalación y uso — PoC del Agente Evaluador (Python)

La PoC (`poc_entrega2/`) demuestra de forma aislada y reproducible el motor de evaluación.

### 6.1 Requisitos

- Python ≥ 3.10
- API key de Anthropic

### 6.2 Ejecución

```bash
cd poc_entrega2
python -m venv .venv && source .venv/bin/activate   # opcional
pip install -r requirements.txt

export ANTHROPIC_API_KEY="sk-ant-..."
python poc_evaluator.py
```

El script lee `mock_database.json` (catálogo de retos + respuestas de candidatos), evalúa cada *submission* con Claude aplicando la rúbrica del reto, imprime los resultados en terminal y guarda `evaluation_results.json`.

### 6.3 Qué demuestra

- **Dynamic Prompting:** un único pipeline evalúa retos heterogéneos inyectando la rúbrica en el system prompt en tiempo de ejecución.
- **Chain of Thought:** razonamiento criterio a criterio antes del score (auditable).
- **Detección de Prompt Injection:** marca intentos de manipulación en `alerta_seguridad`.
- **Métricas:** latencia, tokens y coste por evaluación.

---

## 7. Documentación adicional

- `entrega_final/INFORME_TECNICO_FINAL.md` — informe técnico final (arquitectura, métricas, tests, reflexión crítica).
- `entrega_final/GUION_DEMO.md` — guion paso a paso de la demo.
- `entrega_final/GUION_DEFENSA_20MIN.md` + `deck_defensa_20min.html` — defensa de 20 minutos con cronómetro y notas del ponente.
- `entrega_final/QA_DEFENSA.md` — preguntas y respuestas para la defensa.
- `tfm/README.md` — índice del TFM (business plan + spec técnica del demo).
- `tfm/tech/eval/README.md` — protocolo del banco de pruebas del evaluador y sus límites.
- `tfm/cifras_canonicas.json` — fuente de verdad numérica.
- `poc_entrega2/Entrega_2_TalentPact.md` — documento de la Entrega 2 (prototipo y resultados).

> **Nota sobre `informe_final/`.** Es la versión de junio de 2026, anterior a la corrección de divisa y a la suite de tests. Se conserva como registro histórico de la entrega intermedia; el documento vigente es `entrega_final/INFORME_TECNICO_FINAL.md`.
