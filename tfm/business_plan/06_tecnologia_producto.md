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
                    ③ BLOCKCHAIN    hash(CV) ──▶ contrato en L2 (anclaje)
                                                 │  + Verifiable Credential
                                                 ▼
                    ④ VERIFICADOR   empresa/tercero recomputa hash y verifica on-chain
                                                 → ✅ Verificado / ❌ Manipulado
```

**Stack:** frontend web (HTML/JS, migrable a Next.js), funciones serverless (Netlify/Vercel), **Supabase** (Postgres + Row Level Security, región UE), **API de Anthropic (Claude)** para la evaluación, **Stripe** para pagos y **red blockchain L2** (Polygon) para el anclaje de credenciales.

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

El MVP actual guarda el estado en `localStorage` (perfecto para demo, pero no multiusuario ni multidispositivo). La evolución a producto real —y requisito para la capa blockchain— es **Supabase (PostgreSQL + RLS)** en región UE:

- **`profiles`** — perfiles anónimos de candidatos (alias público; datos sensibles cifrados/anonimizados).
- **`evaluations`** — audit trail de cada evaluación IA (score, criterios, razonamiento, tokens, coste) → cumple el Art. 12 del AI Act (trazabilidad).
- **`credentials`** — CV verificables emitidos, con su hash y su referencia on-chain.

RLS garantiza que cada candidato solo accede a sus propios datos, y la región UE cubre la residencia de datos del RGPD.

## 6.4 Innovación blockchain: el CV inmutable y verificable ⭐

Es la **aportación diferencial del TFM** y el puente natural entre el producto y el máster de Fintech/Blockchain.

### Qué es

Cuando un candidato acumula habilidades validadas por IA, TalentPact emite un **SkillPass**: una **credencial verificable** (siguiendo el estándar W3C *Verifiable Credentials*) que certifica *"esta persona validó SQL con 87/100 el 05/09/2026, evaluada con la rúbrica X"*. Se calcula el **hash** de esa credencial y se **ancla en una blockchain** (L2 Polygon). El candidato posee su credencial y cualquier empresa puede **verificarla sin depender de TalentPact**.

### Cómo funciona (y por qué es privado)

```
CV verificado (JSON)  ──keccak256──▶  hash (bytes32)  ──tx──▶  contrato SkillPassRegistry (blockchain)
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

Un *vertical slice* funcional para un candidato: responder reto → IA corrige → se guarda en Supabase → se genera el SkillPass → se ancla su hash en **testnet (Polygon Amoy)** → un **verificador público** comprueba la credencial contra la cadena, con enlace al explorador de bloques. Detalle de implementación en `tfm/tech/SPEC_TECNICA_DEMO.md`.

## 6.5 Innovación financiera: pay-per-result y liquidación (visión)

Más allá del CV, el modelo de ingresos **pay-per-result** es en sí una innovación financiera: se cobra solo cuando se genera valor (contacto desbloqueado). La visión a futuro contempla llevar esta lógica a **liquidación programable** mediante *escrow* con stablecoins (el pago queda retenido y se libera al confirmarse el resultado, con posibilidad de *revenue-share* al candidato). Esto entronca con MiCA/PSD2 y se describe como evolución, no como parte del demo (ver apartados 7 y 8).

## 6.6 Roadmap de producto

| Horizonte | Hitos |
|---|---|
| **Corto (0-3 meses)** | De prototipo a producto: persistencia Supabase, credencial blockchain (mainnet L2), Stripe Connect, autenticación completa. |
| **Medio (4-6 meses)** | Beta privada: 10 empresas y 100 candidatos activos, primeras transacciones reales, *streaming* del score, calibración de rúbricas. |
| **Largo (7-12 meses)** | Lanzamiento público, escalado del catálogo a 102 retos, equipo 5-8 personas, expansión a Portugal, objetivo €25K MRR. |
| **Visión** | Estándar europeo de credenciales de habilidades (interoperabilidad con EU Digital Identity Wallet / eIDAS 2.0) y liquidación programable de pagos. |

---

*Material técnico de referencia: `entrega_final/INFORME_TECNICO_FINAL.md`, `poc_entrega2/`, `tfm/tech/SPEC_TECNICA_DEMO.md`.*
