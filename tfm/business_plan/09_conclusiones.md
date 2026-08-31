# Conclusiones y limitaciones

## Conclusiones

1. **El problema es de evidencia, no de más CVs.** Los datos secundarios (procesos de ~42 días, coste ~€4.700 en España, alta incidencia de información no verificable en el CV) y la investigación primaria del MVP coinciden: empresas y candidatos describen el mismo cuello de botella. TalentPact responde con cribado por *skill* demostrada, no por biografía.

2. **El modelo económico es de margen, no de volumen inicial.** *Gross margin* ~93,5 % (93,3–93,8 % en 2026–2028), LTV/CAC 11–17× y *payback* &lt; 2 meses (modelo base) indican que el riesgo no es el coste de servir una evaluación (medido: $0,0180 ≈ €0,0165), sino **llenar el lado B2B**. El break-even operativo se sitúa en **mayo 2028** (~125 empresas a ARPU ~€145), con caja que no se proyecta negativa si entra el pre-seed €180 k + ENISA €50 k.

3. **La validación de demanda es real y pequeña.** n ≈ 30, ~90 % de candidatos interesados, 65 % de empresas dispuestas a sustituir la primera entrevista, 7/10 a favor del anonimato, tracción de 6 países y ~500 visitas en la primera semana del landing. Eso **justifica seguir**; no justifica afirmar *product-market fit*. El círculo cercano y la landing sesgan al alza el interés.

4. **La corrección con IA es un evaluador, no un chatbot.** Un solo agente puntúa catálogos heterogéneos vía Dynamic Prompting y CoT; la PoC mide **$0,0180 ≈ €0,0165** por evaluación, **87 puntos** de discriminación y bloqueo del *prompt injection* ensayado. No se afirma κ contra tribunal humano ni ausencia de sesgo: se afirma un oráculo de scoring **inspeccionable y medible** —84 tests automáticos y un banco de pruebas con 12 ítems que se ejecuta con un comando (§6.2.8)— que hace posible el €49 y el sello posterior.

5. **La aportación blockchain está construida, no solo descrita.** El SkillPass ancla un keccak256 canónico en `SkillPassRegistry` (Sepolia); el JSON permanece en la UE; `verify.html` permite a un tercero comprobar integridad sin cuenta. No hay token ni oferta al público: **MiCA no aplica**. Sepolia no es *mainnet*; el patrón (hash huérfano al borrar el dato, emisor permissioned, lectura abierta) es el que se llevaría a una L2 (§6.4).

6. **El cumplimiento es *by design* y está incompleto para comercializar.** Anonimato, logs de evaluación (Art. 12 AI Act) y hash-only on-chain cubren el relato. Faltan DPIA, aviso Art. 50, registro de sistema de alto riesgo y *ground truth* humano del Skill Score. Hasta entonces el producto debe permanecer en *preview*.

7. **Los aprendizajes del MVP siguen vigentes** (presentación MVP, 2026): la nota sin explicación no convence; el anonimato aumenta la disposición a probarse; hay que iterar el €49 con datos de piloto; de prototipo a producto el foco es estabilidad, no más *slides*.

## Limitaciones

- Encuestas **sin muestreo aleatorio** ni cuestionario publicado en este tomo (las cifras salen de la presentación MVP y el *investor deck*).
- SAM europeo (€8–12 B) es **estimación propia** a partir de fuentes agregadas; no un *bottom-up* por país.
- El motor de IA **no está calibrado** contra un tribunal humano: el banco de pruebas mide acuerdo con la banda de la rúbrica (validez de constructo), no acuerdo inter-evaluador. La κ de Cohen contra personas sigue pendiente, ahora con el protocolo y el corpus ya escritos.
- El anclaje es **testnet**; una defensa no debe venderlo como inmutabilidad de *mainnet* ni como identidad soberana completa (el emisor sigue siendo TalentPact).
- El Excel asume mix de precios y *churn* que el mercado aún no ha contrastado con cobros reales.

## Líneas futuras

Puntuar el gold set con evaluadores humanos (es lo único que falta para la κ de Cohen); ampliarlo a ≥5 retos; LLM-juez para la tasa de alucinación; sacar ofertas y desbloqueos de `localStorage` a Supabase; Stripe en vivo y constitución de la SL; contrato en una L2 de producción; segunda oleada de encuestas con ficha estadística; interoperar el SkillPass con la cartera de identidad europea (visión, no año 1).

Lo que se defiende en septiembre es, por tanto: **un business plan coherente + un evaluador de ejercicios con evidencia de PoC + un sello criptográfico que ya se puede verificar**. No un unicornio ni un sistema de IA certificado.
