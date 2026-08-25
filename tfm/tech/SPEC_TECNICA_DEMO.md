# Spec técnica del demo — TalentPact (Nivel 1: todo real)

Objetivo: demostrar en vivo, de punta a punta, el flujo **IA evalúa → se persiste → se sella en blockchain → se verifica**, con un candidato de demostración. Todo funcional, coste €0 (testnet + tiers gratuitos).

---

## 1. Arquitectura objetivo

```
┌──────────────┐   responde reto    ┌─────────────────────────┐
│  Candidato   │ ─────────────────▶ │  index.html (frontend)  │
└──────────────┘                    └───────────┬─────────────┘
                                                 │
                     ① corrección IA (ya existe) │
                                                 ▼
                             /.netlify/functions/evaluate-exercise
                                                 │  Skill Score + criterios
                                                 ▼
                    ② PERSISTENCIA  ┌─────────────────────────────┐
                                    │  Supabase (Postgres + RLS)  │
                                    │  profiles / evaluations /   │
                                    │  credentials                │
                                    └───────────┬─────────────────┘
                                                 │  genera SkillPass CV (JSON)
                                                 ▼
                    ③ BLOCKCHAIN    /.netlify/functions/anchor-credential
                                    │  hash = keccak256(CV_JSON)
                                    │  tx → contrato SkillPassRegistry (testnet)
                                    └───────────┬─────────────────┘
                                                 │  txHash + blockNumber
                                                 ▼
                    ④ VERIFICADOR   verify.html
                                    pega CV → recomputa hash → lee on-chain
                                    → ✅ Verificado / ❌ Manipulado
```

**Principio RGPD:** on-chain solo va `bytes32 hash`. Ningún dato personal toca la cadena. El CV real (con nombre, skills, scores) vive en Supabase. Borrar el registro off-chain deja el hash on-chain huérfano e inútil → se reconcilia inmutabilidad con derecho al olvido.

---

## 2. Stack y decisiones

| Componente | Elección | Motivo |
|---|---|---|
| Frontend | `index.html` existente | Reutilización total |
| Backend IA | Netlify Function `evaluate-exercise.js` | Ya funciona (Claude) |
| Persistencia | **Supabase** (Postgres + RLS, región UE) | Charter lo pedía; gratis; GDPR |
| Blockchain | **Ethereum Sepolia testnet** | Gratis, estándar EVM, faucet de Google sin comprar cripto (los de Amoy exigían saldo de mainnet) |
| Librería web3 | **ethers.js v6** (en Netlify Function) | Firma la tx server-side; la clave nunca toca el navegador |
| Contrato | Solidity `SkillPassRegistry` (mínimo) | Ancla hashes + evento |
| Credencial | JSON tipo **W3C Verifiable Credential** (firma off-chain) + anclaje on-chain | Estándar de identidad; extensible a SBT |

> **Nota de seguridad:** la clave privada de la wallet emisora (testnet, sin valor real) vive en variables de entorno de Netlify (`ISSUER_PRIVATE_KEY`), nunca en el frontend ni en el repo.

---

## 3. Modelo de datos (Supabase)

```sql
-- Candidatos (perfil mínimo; datos sensibles cifrados/anonimizados en producción)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text,               -- alias público anónimo (p. ej. "Candidato #A17")
  created_at timestamptz default now()
);

-- Evaluaciones IA (audit trail — Art. 12 AI Act)
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  challenge_id text not null,      -- reto evaluado
  skill text not null,             -- competencia (p. ej. "SQL", "Comunicación")
  score int not null check (score between 0 and 100),
  criteria jsonb,                  -- desglose por criterio
  reasoning text,                  -- Chain of Thought (dato personal → retención limitada)
  model_used text,
  tokens_in int, tokens_out int, cost_eur numeric,
  created_at timestamptz default now()
);

-- Credenciales ancladas en blockchain
create table credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  cv_json jsonb not null,          -- el SkillPass CV completo (off-chain)
  cv_hash text not null,           -- keccak256(cv_json) en hex
  chain text not null default 'ethereum-sepolia',
  tx_hash text,                    -- transacción de anclaje
  block_number bigint,
  anchored_at timestamptz,
  created_at timestamptz default now()
);
```

RLS: activada; un candidato solo ve sus filas. Para el demo se puede usar un perfil demo fijo.

---

## 4. El "SkillPass CV" (documento que se sella)

Ejemplo de estructura del JSON que se hashea y ancla:

```json
{
  "type": "TalentPactSkillPass",
  "version": "1.0",
  "subject": "did:talentpact:candidate:A17",
  "issuer": "did:talentpact:issuer",
  "issuedAt": "2026-09-05T10:00:00Z",
  "skills": [
    { "skill": "SQL", "score": 87, "challengeId": "RETO_002", "evaluatedAt": "2026-09-05T09:40:00Z" },
    { "skill": "Comunicación escrita", "score": 74, "challengeId": "RETO_007", "evaluatedAt": "2026-09-05T09:52:00Z" }
  ],
  "evaluator": { "engine": "TalentPact AI Evaluator", "model": "claude-sonnet-4-6", "method": "Dynamic Prompting + CoT" }
}
```

- `cv_hash = keccak256(JSON.stringify(cv_json))`.
- La credencial verificable añade una firma del emisor sobre el hash (prueba de emisión) además del anclaje on-chain (prueba de integridad + fecha).

---

## 5. Contrato inteligente (mínimo viable)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SkillPassRegistry — ancla huellas de credenciales TalentPact (sin datos personales)
contract SkillPassRegistry {
    address public issuer;
    // hash del CV => timestamp de anclaje (0 si no existe)
    mapping(bytes32 => uint256) public anchoredAt;

    event CredentialAnchored(bytes32 indexed cvHash, uint256 timestamp);

    constructor() { issuer = msg.sender; }

    modifier onlyIssuer() { require(msg.sender == issuer, "not issuer"); _; }

    function anchor(bytes32 cvHash) external onlyIssuer {
        require(anchoredAt[cvHash] == 0, "already anchored");
        anchoredAt[cvHash] = block.timestamp;
        emit CredentialAnchored(cvHash, block.timestamp);
    }

    function isAnchored(bytes32 cvHash) external view returns (bool, uint256) {
        uint256 ts = anchoredAt[cvHash];
        return (ts != 0, ts);
    }
}
```

- Solo el emisor (TalentPact) puede anclar → evita spam.
- No guarda datos personales, solo la huella.
- Verificación: cualquiera llama a `isAnchored(hash)` sin permisos.

---

## 6. Nuevas funciones serverless

| Función | Método | Qué hace |
|---|---|---|
| `save-evaluation` | POST | Persiste la evaluación IA en Supabase (tras corregir) |
| `issue-credential` | POST | Compone el SkillPass CV desde las evaluaciones del candidato, lo guarda y devuelve `cv_json` + `cv_hash` |
| `anchor-credential` | POST | Lanza la tx `anchor(hash)` en testnet con ethers.js; guarda `tx_hash` y `block_number`. Exige sesión (gasta gas) y es idempotente: si el hash ya está anclado o la tx ya se difundió, recoge el estado en vez de reenviarla |
| `verify-credential` | POST/GET | Recibe un `cv_json` (recomputa el hash) o un `cv_hash`, y consulta `isAnchored` on-chain. Público a propósito: verificar no debe exigir cuenta |

Variables de entorno nuevas (Netlify): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SEPOLIA_RPC`, `ISSUER_PRIVATE_KEY`, `SKILLPASS_CONTRACT_ADDRESS`.

**Autenticación.** `issue-credential` y `anchor-credential` no aceptan un `userId` del cliente: leen el *access token* de la cabecera `Authorization` y le preguntan a Supabase de quién es. Sin esto, cualquiera podía emitir la credencial de otro candidato o quemar el gas de la wallet emisora.

---

## 7. Verificador (`verify.html`)

Página pública simple: el candidato o la empresa pega el JSON del CV (o sube el fichero), la página llama a `verify-credential` y muestra:
- ✅ **Verificado** — hash coincide y está anclado el `DD/MM/AAAA HH:MM`, con enlace al explorador ([Sepolia Etherscan](https://sepolia.etherscan.io)). La fecha la da el contrato, no la base de datos.
- ❌ **No verificado / manipulado** — el hash no coincide o no está anclado.

---

## 8. Plan de implementación (F2)

1. ✅ **Supabase:** proyecto creado (región UE) con tablas, Auth y RLS. Las funciones hablan con PostgREST vía `fetch` (sin dependencia extra).
2. ✅ **Persistir evaluaciones:** `save-evaluation` enganchado tras la corrección IA, con sincronización de subida del progreso local.
3. ✅ **Contrato:** `SkillPassRegistry` desplegado en Ethereum Sepolia en [`0x85418F3d…78f73A`](https://sepolia.etherscan.io/address/0x85418F3d978e691C0f784bA63E4cB2826478f73A) (bloque 11523380). Sin Remix: `npm run deploy:contract` compila con solc, despliega y registra la dirección en `tfm/tech/build/deployment-sepolia.json`.
4. ✅ **Emisión + anclaje:** `issue-credential` + `anchor-credential` con ethers.js v6, firmando server-side y autenticando por token. Probado contra la red: lectura del contrato y del emisor verificadas.
5. ✅ **Verificador:** `verify.html` + `verify-credential`.
6. ✅ **UX en el producto:** tarjeta "Tu SkillPass verificable" en el portal de candidato, con estado, hash, enlace al explorador y descarga del CV en JSON.
7. ⬜ **Ensayo + vídeo de respaldo** del flujo completo para la defensa.

> Diagnóstico en cualquier momento: `npm run doctor` comprueba las cuatro capas (IA, datos, RPC/wallet, contrato) y dice exactamente qué falta. Guía paso a paso en `SETUP_CHECKLIST.md`.

## 9. Riesgos del demo y mitigación

| Riesgo | Mitigación |
|---|---|
| Fallo de red en directo | Vídeo de respaldo del flujo + credencial ya anclada de antemano |
| Faucet de testnet sin fondos | Cargar ETH de test de Sepolia con antelación; tener wallet de reserva |
| Latencia de confirmación de bloque | Sepolia confirma en ~12 s, más que el límite de 10 s de una función Netlify. `anchor-credential` responde `pending` en cuanto difunde la tx y el frontend consulta hasta la confirmación; el enlace a Etherscan ya sirve desde el primer segundo |
| Clave privada expuesta | Solo en env vars de Netlify; wallet de testnet sin valor real |
| RGPD | Nunca subir datos personales on-chain; solo hash |
