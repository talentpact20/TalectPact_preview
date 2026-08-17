# Checklist de puesta en marcha del demo (lo que necesito de ti)

Para construir el *vertical slice* real necesito unas cuentas y claves externas (todo **gratis**). Sigue estos pasos y pásame los valores marcados con 🔑. Yo me encargo de todo el código.

---

## Paso 1 — Supabase (persistencia) · ~10 min

1. Crea una cuenta en [supabase.com](https://supabase.com) (gratis).
2. **New project** → elige región **UE** (Frankfurt o Ireland) por RGPD. Ponle contraseña a la BD.
3. Cuando esté listo, ve a **SQL Editor** → pega el contenido de `supabase_schema.sql` → **Run**. Esto crea las tablas.
4. Ve a **Project Settings → API** y copia:
   - 🔑 **Project URL** (algo como `https://xxxx.supabase.co`)
   - 🔑 **service_role key** (la secreta, NO la anon) — la usarán solo las funciones del servidor.

## Paso 2 — Wallet de testnet (emisor de credenciales) · ~10 min

1. Instala la extensión **MetaMask** ([metamask.io](https://metamask.io)) si no la tienes.
2. Crea una wallet **nueva y solo para esto** (no uses una con fondos reales). Guarda la frase semilla.
3. Añade la red **Polygon Amoy** (testnet). Puedes hacerlo automáticamente en [chainlist.org](https://chainlist.org) buscando "Amoy" y conectando MetaMask.
4. Copia:
   - 🔑 **Dirección pública** de la wallet (`0x...`)
   - 🔑 **Clave privada** (MetaMask → ⋮ → Detalles de la cuenta → Exportar clave privada). ⚠️ Es de testnet y sin valor, pero aun así trátala como secreta.

## Paso 3 — Fondos de testnet (gas gratis) · ~5 min

1. Ve a un *faucet* de Polygon Amoy, por ejemplo el [faucet oficial de Polygon](https://faucet.polygon.technology/) o el de Alchemy.
2. Pega tu dirección pública y solicita **POL de test** (gratis). Con una pequeña cantidad basta para cientos de anclajes.

## Paso 4 — RPC de Polygon Amoy · ~5 min

Necesitamos un endpoint para hablar con la red. Opciones:
- Público (rápido para empezar): `https://rpc-amoy.polygon.technology`
- O crea una cuenta gratis en [Alchemy](https://alchemy.com) / [Infura](https://infura.io) → crea una app en la red **Polygon Amoy** → copia:
  - 🔑 **RPC URL** (recomendado por fiabilidad).

## Paso 5 — Despliegue del contrato (lo hago yo contigo)

Con tu wallet y el RPC, desplegamos `contracts/SkillPassRegistry.sol` en Amoy (vía Remix, en 5 min, o con un script). Obtendremos:
- 🔑 **Dirección del contrato desplegado** (`0x...`).

---

## Resumen: valores que necesito (variables de entorno)

Cuando los tengas, pásamelos (o mételos tú en Netlify → *Site settings → Environment variables*):

| Variable | De dónde sale | Secreta |
|---|---|---|
| `SUPABASE_URL` | Paso 1 | No |
| `SUPABASE_SERVICE_KEY` | Paso 1 | **Sí** |
| `ISSUER_PRIVATE_KEY` | Paso 2 | **Sí** |
| `ISSUER_ADDRESS` | Paso 2 | No |
| `POLYGON_AMOY_RPC` | Paso 4 | No |
| `SKILLPASS_CONTRACT_ADDRESS` | Paso 5 | No |

> **Seguridad:** las claves secretas van SOLO en variables de entorno (local o Netlify), nunca en el código ni en el repo. La wallet es de testnet y sin valor real, pero mantenemos la disciplina.

## Mientras tanto, yo voy construyendo

Sin bloquearnos por las claves, puedo dejar listo:
- Las 4 funciones serverless (`save-evaluation`, `issue-credential`, `anchor-credential`, `verify-credential`).
- La página `verify.html` (verificador público).
- El botón "Generar mi CV verificable" en el portal de candidato.
- El soporte de dependencias (`@supabase/supabase-js`, `ethers`) en el servidor de demo.

En cuanto me pases los 🔑, conectamos y probamos el flujo completo end-to-end.
