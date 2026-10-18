# 03 · Blockchain de pago

Tarea de la reunión: «Tema blockchain: cómo hacerlo de pago». Idea acordada: el sellado pasa a ser un extra de pago para el candidato; en su interfaz aparece **pequeño y plegado**; la empresa tiene un **apartado propio para verificar**.

---

## 1. Cómo está hoy

- `issue-credential` compone el SkillPass (JSON) y calcula su hash; `anchor-credential` lo ancla en **Ethereum Sepolia** (red de pruebas) con el contrato `SkillPassRegistry` (`anchor(bytes32)`), **una transacción por credencial**.
- Límite de 3 sellados al día por perfil, porque cada transacción la paga la cartera de TalentPact.
- La empresa tiene una sección «Verificar SkillPass» en su panel y existe `verify.html`.
- Limitaciones: Sepolia no tiene valor real (no sirve como prueba ante terceros); no hay **revocación** ni **caducidad**; el hash es del JSON completo (si lleva datos personales, el hash sigue siendo un dato seudonimizado); la clave del emisor vive en una variable de entorno.

## 2. Qué se vende y qué no

Principio: **la autenticidad nunca se cobra; se cobra la prueba pública e independiente.** Si cobráramos por poder verificar, la empresa dejaría de fiarse del SkillPass gratuito y el producto perdería su base.

| | SkillPass firmado (gratis) | SkillPass sellado (de pago) |
| --- | --- | --- |
| Qué es | Credencial firmada digitalmente por TalentPact. | Lo mismo + su huella publicada en una blockchain pública con fecha. |
| Quién la verifica | Cualquiera, con el enlace o el QR, en talentpact.es. | Cualquiera, **incluso sin TalentPact**: la prueba vive en una red pública. |
| Demuestra | Que TalentPact la emitió y no se ha alterado. | Además: que existía en esa fecha y que nadie (ni TalentPact) puede cambiarla después. |
| Caduca | A los 12 meses (como la nota, ver doc 06). | Igual; el sello prueba la fecha, no la vigencia. |
| Revocable | Sí (lista de estado firmada). | Sí; la revocación se consulta igual. |

Para el candidato, el valor del sello es **portabilidad**: la credencial sigue siendo comprobable si se va de TalentPact o si TalentPact desaparece. Es un argumento real, no decorativo.

## 3. Precio

| Opción | Precio | Incluye |
| --- | --- | --- |
| Sello suelto | **4,99 €** por SkillPass sellado | Sellado en el siguiente lote diario, PDF con QR y prueba descargable. Volver a sellar tras mejorar notas: 2,99 €. |
| Dentro de TalentPact Plus | Incluido | Sellados ilimitados mientras dure la suscripción (doc 04). |
| Certificación IA | Incluido | Ver doc 02. |
| Empresa | **Gratis** verificar una a una | Verificación por lotes (CSV) y API en los planes Pro y Enterprise. |

Coste para nosotros: con el sellado por lotes (§4.2) es **una sola transacción al día** para todos los SkillPass, en una red de capa 2: del orden de céntimos al día en total. El precio es por valor, no por coste; el margen es casi completo.

## 4. Diseño técnico exacto

### 4.1 La credencial

- Formato **W3C Verifiable Credentials 2.0** (JSON), el estándar que usa la cartera de identidad digital europea. Emisor: `did:web:talentpact.es` (una clave pública publicada en nuestro dominio).
- Firma **Ed25519** del servidor. La clave privada en un gestor de claves (KMS) o, mientras tanto, en Netlify como secreto separado del de la cartera.
- Contenido:

```json
{
  "type": ["VerifiableCredential", "TalentPactSkillPass"],
  "issuer": "did:web:talentpact.es",
  "validFrom": "2026-10-18T10:00:00Z",
  "validUntil": "2027-10-18T10:00:00Z",
  "credentialSubject": {
    "id": "urn:tp:cand:7F3A…",            // seudónimo, no el email
    "nombre": "opcional, lo decide el candidato",
    "skills": [
      { "skill": "Comunicación escrita", "pilar": "soft", "banda": "Bueno",
        "nivel": 3, "evaluadoEl": "2026-10-10", "integridad": "estandar",
        "rubrica": "2.1.0", "revisionHumana": false }
    ]
  },
  "credentialStatus": { "type": "BitstringStatusListEntry", "statusListIndex": "4127", "…": "…" }
}
```

- No van: email, teléfono, respuestas, nota exacta (va la **banda**, ver doc 05), ni nada sensible.

### 4.2 Sellado por lotes (árbol de Merkle)

1. Cada SkillPass pagado entra en la cola del día con una **sal aleatoria** de 32 bytes: `hoja = keccak256(sal ‖ JSON canónico)`.
2. A las 00:00 (función programada de Netlify) se construye el árbol de Merkle con todas las hojas del día y se publica **solo la raíz**: `anchorRoot(raiz, numeroDeHojas)`.
3. Cada credencial guarda su **prueba de Merkle** (unos pocos hashes) y el `txHash` del lote.
4. Verificar = recalcular la hoja con la sal, subir por la prueba hasta la raíz y comprobar que esa raíz está en el contrato.

Ventajas: coste constante sea cual sea el volumen; desaparece el límite de 3 al día; no hace falta que la persona espere a un bloque.

### 4.3 Contrato v2

```solidity
function anchorRoot(bytes32 root, uint32 leaves) external onlyIssuer;   // un lote al día
function rootAnchoredAt(bytes32 root) external view returns (uint256);
event RootAnchored(bytes32 indexed root, uint32 leaves, uint256 timestamp);
```

Se mantiene `anchor(bytes32)` del contrato actual para las credenciales ya selladas. Emisor: una **multifirma 2 de 2** (Xagri e Iván) en vez de una sola clave.

### 4.4 Red

| Opción | A favor | En contra |
| --- | --- | --- |
| **Capa 2 de Ethereum** (Base, Arbitrum u Optimism) | Céntimos por transacción; misma seguridad de fondo que Ethereum; el código actual (`ethers`) vale tal cual. | Hay que comprar una pequeña cantidad de ETH: lo hace el usuario, no nosotros. |
| EBSI (infraestructura europea de blockchain) | Pensada para credenciales educativas y profesionales en la UE; muy buena imagen ante el sector público. | Alta como emisor de confianza más lenta; tiene sentido cuando haya sociedad constituida. |

Recomendación: **capa 2 ahora, EBSI y la cartera europea como siguiente paso**. Sepolia queda solo para pruebas.

### 4.5 Revocación, caducidad y RGPD

- **Revocación**: lista de estado (*Bitstring Status List*) firmada y publicada en `talentpact.es/status/1`. Se revoca si se detecta fraude tras la revisión humana (doc 08) o si el candidato lo pide.
- **Caducidad**: `validUntil` a 12 meses. Al renovar las notas se emite un SkillPass nuevo.
- **Derecho de supresión**: al borrar la cuenta se borran la credencial y su **sal**. Sin la sal, la hoja publicada no se puede vincular a nadie: lo que queda en la cadena es un número sin significado. Es la forma estándar de compatibilizar blockchain y RGPD; hay que reflejarlo en `legal.html`.

### 4.6 Pago del candidato

Hoy el servidor **solo deja pagar a empresas** (decisión del 15/10). Hace falta un segundo producto de Stripe:

1. `create-checkout-session` acepta `producto: "sello"` solo para candidatos y solo con su propia credencial; el importe lo fija el servidor (`SEAL_PRICE_CENTS`).
2. `stripe-webhook` marca `credentials.seal_paid_at` y la mete en la cola del lote.
3. `anchor-batch` (función programada) construye el árbol, envía la transacción y rellena `merkle_proof`, `batch_root`, `tx_hash`.
4. Si el lote falla, se reintenta al día siguiente; si falla 3 días, aviso al backoffice y opción de reembolso.

Tablas: `credentials` (+ `salt`, `merkle_proof jsonb`, `batch_id`, `seal_paid_at`, `revoked_at`, `valid_until`), `anchor_batches` (id, root, leaves, tx_hash, chain_id, anchored_at).

## 5. Interfaz

### 5.1 Candidato: pequeño y plegado

En la tarjeta del SkillPass, una sola línea discreta bajo las skills:

```
Firmado por TalentPact · válido hasta 18/10/2027 · Copiar enlace
Sello público: no  ·  Añadir sello (4,99 €)              ← enlace de texto, no botón grande
```

Una vez sellado:

```
Firmado por TalentPact · válido hasta 18/10/2027 · Copiar enlace
Sello público: 19/10/2026  ·  Ver detalles ▸              ← <details> plegado
   Red: Base · Lote 2026-10-19 · Transacción 0x8a1f…c2 · Cómo comprobarlo por tu cuenta
```

Nada de «blockchain» en titulares, ni iconos de cadena, ni animaciones. La palabra aparece solo dentro de los detalles. El texto actual «Habilidades demostradas con IA y selladas en blockchain» se sustituye por «Habilidades demostradas y verificables».

### 5.2 Empresa: apartado «Verificar credencial»

Una sección propia en el panel (ya existe el hueco `empVerifySection`) y una página pública `verify.html`:

1. **Entrada**: pegar el enlace o el código, escanear el QR, o subir el PDF del SkillPass.
2. **Resultado** con uno de cinco estados, cada uno con su explicación:

| Estado | Qué significa |
| --- | --- |
| Válida y vigente | Firma correcta, no revocada, dentro de plazo. |
| Válida, caducada | Auténtica, pero las notas tienen más de 12 meses. |
| Revocada | TalentPact la retiró (fraude o petición del titular). |
| Alterada | El contenido no coincide con la firma: alguien la ha modificado. |
| No encontrada | El código no existe. |

3. **Detalle**: skills con banda y fecha, nivel de integridad de cada prueba, versión de la rúbrica, si hubo revisión humana, y el sello público si lo tiene.
4. **«Comprobar sin TalentPact»** (plegado): dirección del contrato, raíz del lote y prueba de Merkle, con instrucciones para comprobarlo en un explorador público. Es lo que da confianza a un departamento jurídico.
5. Pro y Enterprise: subir un CSV con varios códigos o consultar por API (`GET /verify/{id}`), con registro de cada verificación.

## 6. Orden de implementación

1. Formato VC 2.0 + firma Ed25519 + lista de revocación + caducidad (gratis; útil aunque no se venda nada).
2. Nueva pantalla de verificación de empresa con los cinco estados.
3. Contrato v2 con `anchorRoot` + lote diario en capa 2 (desplegar y fondear la cartera lo hace el usuario).
4. Pago del sello para candidatos (segundo producto de Stripe) y la interfaz plegada.
5. Verificación por lotes y API para Pro/Enterprise.

Cambia cifras canónicas: `tfm/cifras_canonicas.json → blockchain` (red y contrato) cuando se despliegue en producción.

## 7. Decisiones para el equipo

- [ ] ¿4,99 € por sello? ¿O solo dentro de Plus?
- [ ] ¿Capa 2 (y cuál) para producción?
- [ ] ¿Se acepta que el candidato pague con Stripe (hoy solo pagan empresas)?
- [ ] ¿Nombre visible: «Sello público» o «Sello blockchain»?
