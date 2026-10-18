# 10 · Nuevas maneras de acceso para empresas que generen confianza

Tarea de la reunión: «Nuevas maneras de accesibilidad para empresa. ¿Sesión gratis? Mirar de generar confianza». Ejemplo dado: una demo o una prueba gratuita para que la empresa lo pruebe sin pagar.

---

## 1. Por qué una empresa no se fía todavía

Lo que dirá una responsable de selección la primera vez que vea TalentPact:

| Objeción | Qué la resuelve |
| --- | --- |
| «No sé si la nota de una IA vale algo.» | Ver el método, **hacer ella misma un reto** y comparar a su equipo (§3.2). |
| «No quiero pagar antes de ver candidatos.» | Prueba gratuita con pool real y desbloqueos incluidos (§3.1). |
| «¿Y si pago y el candidato no contesta?» | Garantía de respuesta (§3.3). |
| «Ya pago LinkedIn.» | No sustituye: es el paso de criba que LinkedIn ya no ofrece (retiró sus tests de skills). Empezar por **una** vacante. |
| «¿Esto es legal? ¿IA en selección?» | Paquete de cumplimiento descargable (§3.5). |
| «¿Cuántos candidatos hay de mi perfil?» | Dato real del pool por área y nivel, antes de registrarse (§3.6). Si hay pocos, se dice. |

Regla que no cambia: **nada de demostraciones con datos inventados**. Todo lo que se enseña sale de Supabase o es un estado vacío honesto. Una «demo» con candidatos falsos rompería justo la confianza que se quiere ganar.

## 2. Qué hacen otros (referencia)

- LinkedIn: publicar una oferta gratis con alcance limitado; promocionarla es de pago. Recruiter con prueba y demostración comercial.
- Plataformas de evaluación técnica: prueba gratuita de 7–14 días con un número limitado de candidatos evaluados.
- Lo común: **probar con un caso real propio**, con límite, sin tarjeta.

## 3. Propuestas

### 3.1 Prueba gratuita de 30 días, sin tarjeta

| Incluye | Límite |
| --- | --- |
| 1 oferta publicada con skills, preguntas y dilemas | 1 |
| Pool completo filtrable (anónimo, como cualquier empresa) | Sin límite |
| **2 desbloqueos de contacto gratis** | 2 |
| Calibración con su equipo (§3.2) | 3 personas |
| Informe PDF de los candidatos desbloqueados | Sí |

Condiciones: empresa **verificada** (email de dominio corporativo, no Gmail; CIF opcional) para proteger a los candidatos (ya propuesto en `04_estrategia.md`: pool solo para empresas verificadas). Al terminar, pasa a pago por uso (49 €) sin hacer nada; no hay cobro automático de suscripción.

Coste para TalentPact: casi cero (un desbloqueo no tiene coste variable). El riesgo es otro: que la empresa use los 2 contactos y no vuelva. Por eso la prueba está atada a **una oferta concreta**: lo que se mide es si contrata.

### 3.2 «Haz el reto tú»: calibración con su propio equipo

La medida de confianza más potente y la más barata:

1. La empresa elige el reto de su oferta y **lo hacen 1–3 personas de su equipo actual** (las que hacen bien ese trabajo hoy).
2. Ven su propia nota, el feedback y la evidencia citada. Si el corrector se equivoca con alguien de su equipo, lo ven, y lo vemos nosotros.
3. Ese resultado se convierte en **la referencia de su puesto**: «Tus candidatos frente a tu equipo» (en bandas, nunca nombres).

Tres ventajas: la empresa entiende el producto haciendo, no leyendo; desaparece la objeción de «la IA no sabe»; y cada respuesta de un profesional en activo alimenta el **gold set** del corrector (doc 05). Las notas del equipo de la empresa **no entran en el pool** y se borran al acabar la prueba salvo que la empresa quiera conservarlas como referencia.

### 3.3 Garantía de respuesta

Si un candidato desbloqueado no responde en **7 días**, el crédito del desbloqueo se devuelve. Es creíble porque el candidato ya ha dicho que acepta contacto (`allow_contact`). Se mide la tasa real de respuesta y se publica cuando haya datos.

### 3.4 Sesión guiada de 30 minutos (no una demo con datos falsos)

Una videollamada con la empresa **sobre su propia vacante**: se crea la oferta juntos, se elige el reto, se ve qué hay en el pool de su área y se lanza la calibración del §3.2. Es «la sesión gratis» de la nota de la reunión, pero con su caso real. Ideal para Eventos Impact y empresas grandes.

### 3.5 Centro de confianza (página pública)

Una página `/confianza` con:

- **Cómo se corrige**: rúbricas, escala, evidencia citada, doble corrección, revisión humana (doc 05). Lo que no hace la IA: decidir.
- **Cómo se evitan trampas**: niveles de integridad (doc 08).
- **Calidad medida**: acuerdo con correctores humanos, estabilidad, pruebas de sesgo, con fecha. Solo cifras reales del banco v2; si aún no hay, «en medición» y la fecha prevista.
- **Cumplimiento**: Reglamento de IA (sistema de alto riesgo, supervisión humana), RGPD, contrato de encargo de tratamiento descargable, registro de cambios del corrector.
- **Verificar una credencial** (doc 03).
- **Para candidatos**: «Pagar nunca cambia tu nota ni tu posición».

### 3.6 Ver el pool antes de registrarse

En la página de empresas, un buscador público que devuelve **solo cifras agregadas reales**: «En Operaciones, nivel junior, Madrid o remoto: 37 candidatos con al menos 2 skills verificadas». Con el mismo mínimo de 20 por celda del doc 07; si hay menos, «menos de 20». Si el pool de un área es pequeño, mejor saberlo antes que después.

### 3.7 Otras vías de acceso

| Vía | Para quién | Qué es |
| --- | --- | --- |
| **Primera oferta gratis para siempre** | Pymes | 1 oferta activa gratis (como LinkedIn); se paga el desbloqueo. Alternativa a la prueba de 30 días si se prefiere algo más simple. |
| **Piloto pagado con devolución** | Empresas grandes | Pro durante 3 meses; si no hay ninguna contratación, se devuelve el último mes. |
| **Programa de primeras empresas** | Las 10 primeras | Precio fijado 12 meses a cambio de una reunión de opinión al mes y permiso para citar su experiencia (con su aprobación expresa). |
| **Asociaciones y escuelas de negocio** | Grupos de empresas | Acceso para las empresas de una asociación empresarial o de la bolsa de empleo de un máster (canal natural del TFM). |
| **Eventos Impact** | Grandes empresas | La empresa ve el producto funcionando con candidatos reales el día del evento. |
| **Accesibilidad real** | Todas | Panel usable con teclado y lector de pantalla, contraste AA, informe imprimible. Además, los ajustes razonables a candidatos con discapacidad (tiempo extra, sin cámara) se le explican a la empresa: es un argumento de diversidad. |

## 4. Qué hay que construir

1. Estado `trial` en `companies` (inicio, fin, desbloqueos restantes) y verificación de dominio corporativo.
2. Calibración con el equipo: invitar por email a 3 personas a un reto, con notas apartadas del pool (`evaluations.origen = 'calibracion_empresa'`).
3. Pantalla «Tus candidatos frente a tu equipo» (bandas, sin nombres).
4. Garantía de respuesta: plazo de 7 días tras el desbloqueo y devolución del crédito.
5. Página `/confianza` y buscador agregado del pool.

## 5. Decisiones para el equipo

- [ ] ¿Prueba de 30 días con 2 desbloqueos, o primera oferta gratis para siempre?
- [ ] ¿Garantía de respuesta de 7 días?
- [ ] ¿Calibración con el equipo de la empresa incluida en la prueba? (Recomendado: sí; es la mejor prueba y alimenta el corrector.)
- [ ] ¿Verificación de empresa por dominio corporativo obligatoria para ver el pool?
