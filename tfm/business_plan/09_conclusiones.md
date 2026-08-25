# Conclusiones y limitaciones

## Conclusiones

1. **El problema es de evidencia, no de más CVs.** Los datos secundarios (procesos de ~42 días, coste ~€4.700 en España, alta incidencia de información no verificable en el CV) y la investigación primaria del MVP coinciden: empresas y candidatos describen el mismo cuello de botella. TalentPact responde con cribado por *skill* demostrada, no por biografía.

2. **El modelo económico es de margen, no de volumen inicial.** *Gross margin* ~94 %, LTV/CAC 11–17× y *payback* &lt; 2 meses (modelo base) indican que el riesgo no es el coste de servir una evaluación (~€0,02), sino **llenar el lado B2B**. El break-even operativo se sitúa en **mayo 2028** (~125 empresas a ARPU ~€145), con caja que no se proyecta negativa si entra el pre-seed €180 k + ENISA €50 k.

3. **La validación de demanda es real y pequeña.** n ≈ 30, ~90 % de candidatos interesados, 65 % de empresas dispuestas a sustituir la primera entrevista, 7/10 a favor del anonimato, tracción de 6 países y ~500 visitas en la primera semana del landing. Eso **justifica seguir**; no justifica afirmar *product-market fit*. El círculo cercano y la landing sesgan al alza el interés.

4. **La aportación fintech del TFM está construida, no solo descrita.** El SkillPass ancla un hash en Ethereum Sepolia; el JSON permanece en la UE; `verify.html` permite a un tercero comprobar integridad sin cuenta. No hay token ni oferta al público: **MiCA no aplica** al diseño actual. Sepolia es demo; el patrón (hash huérfano al borrar el dato) es el que se llevaría a una L2 de producción.

5. **El cumplimiento es *by design* y está incompleto para comercializar.** Anonimato, logs de evaluación (Art. 12 AI Act) y hash-only on-chain cubren el relato. Faltan DPIA, aviso Art. 50, registro de sistema de alto riesgo y *ground truth* humano del Skill Score. Hasta entonces el producto debe permanecer en *preview*.

6. **Los aprendizajes del MVP siguen vigentes** (presentación MVP, 2026): la nota sin explicación no convence; el anonimato aumenta la disposición a probarse; hay que iterar el €49 con datos de piloto; de prototipo a producto el foco es estabilidad, no más *slides*.

## Limitaciones

- Encuestas **sin muestreo aleatorio** ni cuestionario publicado en este tomo (las cifras salen de la presentación MVP y el *investor deck*).
- SAM europeo (€8–12 B) es **estimación propia** a partir de fuentes agregadas; no un *bottom-up* por país.
- El motor de IA **no está calibrado** contra un tribunal humano (κ de Cohen pendiente).
- El anclaje es **testnet**; una defensa no debe venderlo como inmutabilidad de *mainnet* ni como identidad soberana completa (el emisor sigue siendo TalentPact).
- El Excel asume mix de precios y *churn* que el mercado aún no ha contrastado con cobros reales.

## Líneas futuras

Calibración humana del evaluador; Stripe y SL; contrato en L2 de producción; ficha estadística de una segunda oleada de encuestas; interoperar el SkillPass con la cartera de identidad europea (visión, no año 1).

Lo que se defiende en septiembre es, por tanto: **un business plan coherente + un sello criptográfico que ya se puede verificar**. No un unicornio ni un sistema de IA certificado.
