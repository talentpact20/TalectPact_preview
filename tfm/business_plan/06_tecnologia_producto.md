# 6. Tecnología y producto

TalentPact no es un mockup: es un **producto funcional** con un motor de IA que ya corrige en producción. La innovación tecnológica se organiza en cuatro capas que van de lo existente y validado a la aportación diferencial del TFM.

## 6.1 Arquitectura del sistema

```
┌──────────────┐   responde reto    ┌─────────────────────────┐
│  Candidato   │ ─────────────────▶ │  Frontend (web app)     │
└──────────────┘                    └───────────┬─────────────┘
                                                 │
                     ① CORRECCIÓN IA (funcional) │
                                                 ▼
                             Función serverless → API Claude
                                                 │  Skill Score + criterios + CoT
                                                 ▼
                    ② PERSISTENCIA  ┌─────────────────────────────┐
                                    │  Supabase (Postgres + RLS)  │
                                    │  perfiles · evaluaciones ·  │
                                    │  credenciales               │
                                    └───────────┬─────────────────┘
                                                 │  SkillPass CV (JSON)
                                                 ▼
                    ③ BLOCKCHAIN    hash(CV) ──▶ SkillPassRegistry (Sepolia)
                                                 │  + Verifiable Credential
                                                 ▼
                    ④ VERIFICADOR   empresa/tercero recomputa hash y verifica on-chain
                                                 → ✅ Verificado / ❌ Manipulado
```

**Stack actual del demo:** frontend web (HTML/JS), funciones serverless en **Netlify**, **Supabase** (Postgres + Auth + RLS, región UE), **API de Anthropic (Claude)** para la evaluación, contrato **`SkillPassRegistry`** en **Ethereum Sepolia** (testnet). Stripe y una L2 de producción (p. ej. Polygon) están en el roadmap comercial, no en el vertical slice del TFM.

Se eligió Sepolia frente a Polygon Amoy porque los *faucets* de Amoy exigían crypto de mainnet; Sepolia permite anclar de verdad a coste €0 y enseñar la transacción en Etherscan. El contrato y el patrón (hash on-chain / dato off-chain) son los mismos que se llevarían a L2.

## 6.2 El motor de evaluación con IA (núcleo, ya funcionando)

El corazón de TalentPact es un agente evaluador que puntúa **102 tipos de reto distintos con una única arquitectura**, sin necesitar un modelo por reto. Se apoya en técnicas de *prompting* avanzado:

- **Dynamic Prompting:** la rúbrica de cada reto se inyecta en tiempo de ejecución en el *system prompt*. Añadir el reto 103 no requiere tocar código, solo la base de datos → escala sin coste de ingeniería.
- **Chain of Thought (CoT):** el modelo razona criterio a criterio antes de dar la nota → **explicabilidad y trazabilidad** (clave para el AI Act).
- **Constitutional AI:** cláusula de equidad en el prompt → la nota es independiente de características demográficas.
- **Self-Consistency:** `temperature=0` y salida JSON determinista → reproducibilidad.

**Resultados reales de la PoC (medidos):**
- Coste **~€0,02 por evaluación** (muy por debajo del objetivo de €0,04).
- Discriminación correcta de calidad (candidato excelente 96 vs. mediocre 10).
- **Detección de *prompt injection*** validada al 100 % (un candidato que intentó manipular su nota obtuvo 0 + alerta de seguridad).
- Latencia actual ~17-19 s (mejorable con *streaming* en producción).

## 6.3 Persistencia y datos (Supabase)

El prototipo guardaba el estado en `localStorage`. El producto del TFM ya usa **Supabase (PostgreSQL + Auth + RLS)** en región UE, con `localStorage` como respaldo local de la demo:

- **`profiles`** — perfiles de candidatos (cuenta real; alias público).
- **`companies`** — cuentas de empresa.
- **`evaluations`** — audit trail de cada evaluación IA (score, criterios, razonamiento, tokens, coste) → Art. 12 del AI Act.
- **`credentials`** — SkillPass emitidos, con hash, tx y bloque.

La región UE cubre la residencia de datos del RGPD. El esquema está en `tfm/tech/supabase_schema*.sql`.

## 6.4 Innovación blockchain: el CV inmutable y verificable ⭐

Es la **aportación diferencial del TFM** y el puente natural entre el producto y el máster de Fintech/Blockchain.

### Qué es

Cuando un candidato acumula habilidades validadas por IA, TalentPact emite un **SkillPass**: una **credencial verificable** (inspirada en el estándar W3C *Verifiable Credentials*) que certifica, por ejemplo, *"esta persona validó SQL con 87/100 el 05/09/2026, evaluada con la rúbrica X"*. Se calcula el **hash** keccak256 de esa credencial y se **ancla** en el contrato `SkillPassRegistry`. El candidato posee el JSON/PDF y el enlace; cualquier empresa comprueba el sello **sin cuenta TalentPact**.

### Cómo funciona (y por qué es privado)

```
CV verificado (JSON)  ──keccak256──▶  hash (bytes32)  ──tx──▶  SkillPassRegistry (Ethereum Sepolia)
   [vive OFF-CHAIN en Supabase]                                    [solo el hash vive ON-CHAIN]
```

- **On-chain:** únicamente el *hash* (huella criptográfica) y su fecha de anclaje. **Ningún dato personal.**
- **Off-chain:** el CV real, en la base de datos europea.
- **Verificación:** cualquiera recomputa el hash del CV que le presentan y comprueba contra la cadena si coincide y cuándo se emitió. Si el CV se manipula, el hash no cuadra → **fraude imposible**.

### Por qué esto reconcilia blockchain con el RGPD

El choque clásico "inmutabilidad de blockchain vs. derecho al olvido" se resuelve por diseño: al vivir el dato personal off-chain, **borrar el registro en Supabase deja el hash on-chain huérfano e inservible** (un hash no es un dato personal, no permite reconstruir nada). Se cumplen a la vez la inmutabilidad de la prueba y el derecho de supresión.

### Valor de negocio de la capa blockchain

- **Anti-fraude:** elimina el 78 % de CVs exagerados —la credencial no se puede falsear—.
- **Portabilidad y propiedad:** el candidato lleva su reputación verificada consigo → propuesta *self-sovereign* muy potente para captación.
- **Lock-in positivo + efecto red:** el historial verificado se acumula en TalentPact.
- **Diferenciación:** ningún competidor (LinkedIn, HackerRank, etc.) ofrece credenciales verificables.

### Demo real (lo que se enseña en la defensa)

Un *vertical slice* **ya desplegado**:

1. El candidato responde un reto → Claude corrige y se guarda en Supabase.
2. Pulsa **Sellar mi SkillPass** → se emite el JSON, se calcula el hash y se ancla en **Ethereum Sepolia**.
3. Descarga PDF certificado, JSON o copia el enlace `verify.html?h=0x…`.
4. La empresa (panel o página pública) pega JSON/hash/enlace y ve si el sello es auténtico.

Contrato: `0x85418F3d978e691C0f784bA63E4cB2826478f73A` · explorador: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x85418F3d978e691C0f784bA63E4cB2826478f73A). Detalle en `tfm/tech/SPEC_TECNICA_DEMO.md` y `tfm/tech/build/deployment-sepolia.json`.

## 6.5 Innovación financiera: pay-per-result y liquidación (visión)

Más allá del CV, el modelo de ingresos **pay-per-result** es en sí una innovación financiera: se cobra solo cuando se genera valor (contacto desbloqueado). La visión a futuro contempla llevar esta lógica a **liquidación programable** mediante *escrow* con stablecoins (el pago queda retenido y se libera al confirmarse el resultado, con posibilidad de *revenue-share* al candidato). Esto entronca con MiCA/PSD2 y se describe como evolución, no como parte del demo (ver apartados 7 y 8).

## 6.6 Roadmap de producto

| Horizonte | Hitos |
|---|---|
| **Hecho (demo TFM)** | Auth real, persistencia Supabase, evaluación IA en producción, SkillPass anclado en Sepolia, verificador público. |
| **Corto (0-3 meses)** | DPIA + aviso AI Act, calibración humana del score, Stripe, llevar el contrato a una L2 de producción. |
| **Medio (4-6 meses)** | Beta de pago: primeras empresas reales, *streaming* del score, rúbricas más ancladas. |
| **Largo (7-12 meses)** | Lanzamiento público, catálogo completo, equipo según el plan financiero, expansión Iberia. |
| **Visión** | Interoperar el SkillPass con EU Digital Identity Wallet / eIDAS 2.0 y, más tarde, liquidación programable (escrow). |

---

*Material técnico de referencia: `entrega_final/INFORME_TECNICO_FINAL.md`, `poc_entrega2/`, `tfm/tech/SPEC_TECNICA_DEMO.md`.*
