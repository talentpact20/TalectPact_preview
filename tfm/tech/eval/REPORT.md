# Banco de pruebas del Agente Evaluador — resultados

> **Este fichero aún no contiene una ejecución real.** Lo genera `npm run bench`, que necesita `ANTHROPIC_API_KEY` en el entorno. En cuanto se ejecute, este contenido se sobrescribe con las métricas medidas.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npm run bench            # 12 ítems × 3 repeticiones ≈ $0,65 · imprime la estimación antes de empezar
```

Sin clave, lo que sí se puede hacer ahora mismo:

```bash
npm test                     # 69 casos, incluida la estadística del banco verificada a mano
npm run bench -- --dry-run   # el plan y los prompts exactos, sin gastar nada
```

Qué aparecerá aquí tras la primera ejecución: κ de Cohen cuadrática sobre las cinco bandas con su matriz de confusión, MAE/RMSE y sesgo con signo, correlación de Spearman, reproducibilidad test-retest, tasa de bloqueo de inyección y falsas alarmas, coste en USD y EUR, latencia media y P95, y el detalle ítem a ítem.

El protocolo, la construcción del gold set y —sobre todo— **los límites de lo que esta κ mide y lo que no**, están en [`README.md`](README.md).
