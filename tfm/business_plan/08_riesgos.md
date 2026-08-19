# 8. Riesgos y contingencias

Los riesgos se agrupan en mercado, tecnología (IA y blockchain), finanzas y regulación. La matriz del final prioriza lo que puede matar el TFM-producto **antes del break-even de mayo 2028**.

Escala: **P** probabilidad (baja / media / alta) · **I** impacto (bajo / medio / alto / crítico).

---

## 8.1 Riesgos de mercado

| Riesgo | P | I | Qué pasa | Mitigación |
|---|---|---|---|---|
| **Huevo y gallina** | Alta | Crítico | Empresas no entran si hay pocos candidatos; candidatos se aburren si no hay ofertas | GTM desequilibrado: llenar B2C barato primero; vender €49 (baja fricción) no un ACV de €6 k |
| LinkedIn / TestGorilla copian “IA + pool” | Media | Alto | Relato menos único | SkillPass + anonimato + pay-per-result juntos; el hash on-chain no lo pegan en un *sprint* |
| Pool de baja calidad | Media | Alto | Empresas pagan €49 y se queman | Rúbricas, detección de *prompt injection*, no desbloquear perfiles sin retos |
| Adopción lenta en pymes españolas | Media | Alto | 24 empresas en 2026 no se cumplen | Beachhead tech; no abrir Francia hasta tener playbook |
| Rechazo al cribado ciego | Baja | Medio | RRHH quiere ver el LinkedIn ya | El anonimato es *hasta* el desbloqueo, no para siempre |

Señal de alarma: CAC medido > €400 o churn B2B > 8 % mensual durante un trimestre.

---

## 8.2 Riesgos técnicos (IA y blockchain)

| Riesgo | P | I | Qué pasa | Mitigación |
|---|---|---|---|---|
| **Skill Score sin ground truth** | Alta | Alto | Una empresa discute una nota; AI Act pide exactitud | Tribunal humano + κ de Cohen; no vender “certificado oficial” hasta entonces |
| Varianza entre ejecuciones (±8–12 pts) | Media | Medio | Desconfianza | `temperature=0`, rúbricas con anclas numéricas, posible segundo juez (LLM) |
| Halo de longitud / sesgo del modelo | Media | Alto | Demandas de discriminación | Anonimato; Constitutional AI; medir *disparate impact*; DPIA |
| Dependencia de Anthropic | Media | Alto | Subida de precio o corte de API | Arquitectura de un *prompt* portable; el código ya acepta *fallback* de modelo |
| Prompt injection a escala | Baja | Alto | Candidatos inflan notas | Ya detectado al 100 % en PoC; mantener el control en el *system prompt* y en logs |
| Clave de emisor comprometida | Baja | Crítico | SkillPass falsos firmados | Wallet **solo de testnet** en el demo; en prod: HSM / clave en Netlify Secrets, rotación, *multisig* |
| Testnet ≠ mainnet | Media | Medio | El tribunal “no se lo cree” | Ser explícitos: Sepolia es demo; el contrato es el mismo patrón; faucet accesible |
| RPC / gas / contrato caído el día de la defensa | Media | Alto | La demo falla en directo | Tener un SkillPass **ya anclado** (tx conocida) y `verify.html?h=0x…` en local; no depender de emitir en vivo sí o sí |
| Supabase / Netlify caídos | Baja | Alto | Producto entero | Caché local (`localStorage`) como respaldo de demo |

El riesgo técnico que **no** se maquilla: la IA es buena y barata (~€0,02), pero **aún no está calibrada contra humanos**. Eso es el siguiente hito de producto, no un fallo del demo del TFM.

---

## 8.3 Riesgos financieros

| Riesgo | P | I | Qué pasa | Mitigación |
|---|---|---|---|---|
| No llega el pre-seed €180 k | Media | Crítico | Se acaba el *runway* teórico | El demo y el TFM existen **sin** esa ronda; el plan de negocio sí la necesita para el BE 2028 |
| ENISA no concedido | Media | Alto | Valle de 2028 más justo | *Runway* con solo 180 k sigue siendo ~35 meses a burn 2026 |
| Burn de salarios se adelanta | Media | Alto | Se contrata al ritmo 2027 en 2026 | Disciplina: 2026 es €4.800/mes, no €12.200 |
| Stripe / impagos | Baja | Bajo | DSO corto (2 días), B2B tarjeta | Cortes de cuenta si hay *chargeback* sistemático |
| Coste IA se multiplica ×10 | Baja | Medio | Margen 94 % aguanta hasta ~€0,20/eval | Límite de retos gratis; modelo más pequeño para ejercicios fáciles |
| Caja mínima €38 k (abr-2028) | — | — | Cualquier retraso de ingresos la pisa | Buffer 5 % del pre-seed; no CapEx discrecional en 2028 Q1 |

El modelo **nunca proyecta caja negativa**, pero el margen de error en abril 2028 es estrecho: ahí no se experimenta con nuevas líneas de gasto.

---

## 8.4 Riesgos regulatorios

| Riesgo | P | I | Qué pasa | Mitigación |
|---|---|---|---|---|
| Retraso o coste del expediente AI Act | Alta | Alto | No se puede vender “IA de selección” en UE | Comercializar primero como **herramienta de apoyo** con humano en el bucle; no automatizar el rechazo |
| Interpretación del hash como dato personal | Baja | Alto | Habría que no usar cadena pública | Dictamen; diseño actual (hash huérfano al borrar) es la defensa estándar |
| Anthropic / subencargado fuera de UE | Media | Medio | Transferencias Cap. V RGPD | Cláusulas tipo + minimizar PII en el prompt (ya se envía el ejercicio, no el DNI) |
| Lanzar cobros antes de SL / DPIA | Media | Crítico | Sanciones, reputación | La web pública permanece en *preview* hasta el checklist del §7.5 |
| Alguien pide que el SkillPass sea un “security” | Baja | Bajo | No hay token ni *yield* | Documentar que no hay oferta de criptoactivo (MiCA no aplica) |

---

## 8.5 Matriz y plan de contingencia

Prioridad para los dos socios (orden de trabajo real, no alfabético):

| # | Riesgo | Contingencia concreta |
|---|---|---|
| 1 | Mercado vacío (sin empresas) | 10 demos/semana outbound; no gastar paid; medir desbloqueos, no visitas |
| 2 | IA discutida / AI Act | Dossier de logs + aviso al candidato; no afirmar accuracy 78 % hasta el κ |
| 3 | Demo blockchain el día D | Tx y contrato ya desplegados en Sepolia; verificador estático; captura de pantalla de respaldo |
| 4 | Caja / ronda | Recortar a dos socios sin hires 2027; alargar 2026 lean |
| 5 | Claves y datos | Secretos solo en `.env` / Netlify; nunca en git; borrar cuenta implementado |

**Riesgo residual aceptado:** el TFM demuestra un *vertical slice* real (IA + datos + sello on-chain) en testnet, no un unicornio ni un sistema de alto riesgo ya registrado en Bruselas. Presentarlo así es más sólido que inflar el estado de madurez.

---

*Los límites técnicos de la PoC (informe de julio 2026) se integran aquí como riesgos de producto, no como fallos ocultos.*
