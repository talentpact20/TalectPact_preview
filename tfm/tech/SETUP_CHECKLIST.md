# Checklist de puesta en marcha del demo

Estado del flujo **IA evalúa → se persiste → se sella en blockchain → se verifica**.
El código está completo; lo que falta son credenciales externas (todas **gratis**).

| Capa | Estado | Qué falta |
|---|---|---|
| ① IA — evaluación de retos | ✅ Funcionando en producción | — |
| ② Supabase — persistencia + Auth | ✅ Proyecto creado, esquema completo verificado | La `service_role key` en tu `.env` local |
| ③ Blockchain — anclaje | 🔨 Código listo, **sin desplegar** | Wallet + gas + desplegar el contrato |
| ④ Verificador público | ✅ `verify.html` construido | Depende de ③ |

En cualquier momento puedes ver qué te falta con:

```bash
npm install     # solo la primera vez
npm run doctor
```

---

## Paso 0 — Tu archivo `.env` · ~1 min

Todas las claves viven en un único archivo `.env` en la raíz (ignorado por git, nunca se sube).

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
```

Ábrelo y ve rellenando los valores según avanzas por los pasos siguientes.
Tanto el servidor local (`npm run dev`) como los scripts lo leen automáticamente.

## Paso 1 — Supabase (persistencia) · ✅ esquema verificado, falta 1 clave

**No hay que ejecutar ningún SQL.** Comprobado contra el proyecto real: las tres tablas
(`profiles`, `evaluations`, `credentials`) existen con todas sus columnas, incluidas las
que añade `supabase_schema_auth.sql`. Los dos `.sql` de este directorio quedan como
documentación del esquema y para reconstruirlo desde cero si hiciera falta.

Lo único que falta es la clave secreta para poder ejecutar el backend en local:

1. Entra en [supabase.com](https://supabase.com) → tu proyecto.
2. **Project Settings → API** → copia la **service_role key** (la secreta, NO la anon)
   → pégala en `SUPABASE_SERVICE_KEY` del `.env`.
3. Comprueba que todo funciona de punta a punta:

```bash
npm run test:supabase
```

Crea un candidato de prueba, guarda evaluaciones, compone su SkillPass CV, verifica el
hash y la unicidad de credenciales, y **borra todo lo que ha creado** al terminar.

## Paso 2 — Wallet de testnet (emisor de credenciales) · ~10 min

1. Instala la extensión **MetaMask** ([metamask.io](https://metamask.io)) si no la tienes.
2. Crea una wallet **nueva y solo para esto** (no uses una con fondos reales). Guarda la frase semilla.
3. Añade la red **Polygon Amoy** (testnet): en [chainlist.org](https://chainlist.org) busca "Amoy" y conecta MetaMask.
4. Copia al `.env`:
   - Dirección pública (`0x...`) → `ISSUER_ADDRESS`
   - Clave privada (MetaMask → ⋮ → Detalles de la cuenta → Exportar clave privada) → `ISSUER_PRIVATE_KEY`

   ⚠️ Es de testnet y sin valor real, pero trátala como secreta igualmente.

## Paso 3 — Fondos de testnet (gas gratis) · ~5 min

1. Ve al [faucet oficial de Polygon](https://faucet.polygon.technology/) (o el de Alchemy).
2. Pega tu dirección pública y solicita **POL de test**. Con una cantidad mínima bastan cientos de anclajes.
3. Verifica que llegó: `npm run doctor` te dirá el saldo.

## Paso 4 — RPC de Polygon Amoy · ~0-5 min

- Por defecto se usa el público `https://rpc-amoy.polygon.technology` — no tienes que hacer nada.
- Si falla o va lento: crea una app gratis en [Alchemy](https://alchemy.com) o [Infura](https://infura.io)
  en la red **Polygon Amoy** y pega su URL en `POLYGON_AMOY_RPC`.

## Paso 5 — Desplegar el contrato · ~2 min

Ya no hace falta Remix. Con el `.env` de los pasos 2-4 relleno:

```bash
npm run compile:contract   # opcional: compila sin desplegar, para comprobar
npm run deploy:contract
```

El script compila `contracts/SkillPassRegistry.sol` con solc, lo despliega firmando con tu
wallet, guarda el registro en `tfm/tech/build/deployment-amoy.json` y te imprime la línea
exacta que tienes que pegar en el `.env`:

```
SKILLPASS_CONTRACT_ADDRESS=0x...
```

## Paso 6 — Comprobar el flujo completo

```bash
npm run doctor    # debe salir todo en verde
npm run dev       # http://localhost:8888
```

En el panel de candidato: completa un reto → **Generar mi CV verificable** → obtienes el hash
y el enlace a la transacción en Amoy PolygonScan. Descarga el JSON y pégalo en
`http://localhost:8888/verify.html` para comprobar la verificación desde fuera.

## Paso 7 — Producción (Netlify)

Copia las mismas variables en **Netlify → Site settings → Environment variables**:

| Variable | De dónde sale | Secreta |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | **Sí** |
| `SUPABASE_URL` | Paso 1 | No |
| `SUPABASE_SERVICE_KEY` | Paso 1 | **Sí** |
| `ISSUER_PRIVATE_KEY` | Paso 2 | **Sí** |
| `ISSUER_ADDRESS` | Paso 2 | No |
| `POLYGON_AMOY_RPC` | Paso 4 (opcional) | No |
| `SKILLPASS_CONTRACT_ADDRESS` | Paso 5 | No |

> **Seguridad:** las claves secretas van SOLO en el `.env` local o en Netlify, nunca en el
> código ni en el repositorio. La wallet es de testnet y sin valor real, pero mantenemos la disciplina.
