# Genera docs/corrector.pdf — El corrector de TalentPact: diagnóstico, mejoras y propuestas.
# Uso: python3 tools/generar_corrector_pdf.py docs/corrector.pdf
# Requiere reportlab y las fuentes Arial y Georgia de macOS (/System/Library/Fonts/Supplemental).
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether, ListFlowable, ListItem)

SUP = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Arial", SUP + "Arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", SUP + "Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", SUP + "Arial Italic.ttf"))
pdfmetrics.registerFont(TTFont("Georgia", SUP + "Georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", SUP + "Georgia Bold.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-Bold")

OUT = sys.argv[1]
VERDE = colors.HexColor("#0b6e5f")
TINTA = colors.HexColor("#1e293b")
GRIS = colors.HexColor("#64748b")
LINEA = colors.HexColor("#cbd5e1")
FONDO = colors.HexColor("#f1f5f9")
FONDO_V = colors.HexColor("#ecfdf5")
AMBAR = colors.HexColor("#92400e")
FONDO_A = colors.HexColor("#fffbeb")

st = {
    "titulo": ParagraphStyle("titulo", fontName="Georgia-Bold", fontSize=26, leading=31, textColor=TINTA, spaceAfter=6),
    "sub": ParagraphStyle("sub", fontName="Arial", fontSize=12.5, leading=17, textColor=GRIS, spaceAfter=4),
    "h1": ParagraphStyle("h1", fontName="Georgia-Bold", fontSize=17, leading=22, textColor=TINTA, spaceBefore=16, spaceAfter=8, keepWithNext=1),
    "h2": ParagraphStyle("h2", fontName="Arial-Bold", fontSize=12.2, leading=16, textColor=VERDE, spaceBefore=10, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName="Arial-Bold", fontSize=10.5, leading=14, textColor=TINTA, spaceBefore=6, spaceAfter=2),
    "p": ParagraphStyle("p", fontName="Arial", fontSize=10, leading=14.6, textColor=TINTA, spaceAfter=6, alignment=TA_LEFT),
    "peq": ParagraphStyle("peq", fontName="Arial", fontSize=8.6, leading=12, textColor=GRIS, spaceAfter=4),
    "celda": ParagraphStyle("celda", fontName="Arial", fontSize=8.8, leading=12, textColor=TINTA),
    "celdab": ParagraphStyle("celdab", fontName="Arial-Bold", fontSize=8.8, leading=12, textColor=TINTA),
    "caja": ParagraphStyle("caja", fontName="Arial", fontSize=9.4, leading=13.4, textColor=TINTA, spaceAfter=3),
    "cajat": ParagraphStyle("cajat", fontName="Arial-Bold", fontSize=9.6, leading=13.4, textColor=VERDE, spaceAfter=3),
    "mono": ParagraphStyle("mono", fontName="Arial", fontSize=8.8, leading=12.4, textColor=TINTA, leftIndent=8),
}

def P(t, s="p"): return Paragraph(t, st[s])

def lista(items, s="p", num=False):
    return ListFlowable([ListItem(P(t, s), leftIndent=12, value=None) for t in items],
                        bulletType="1" if num else "bullet", start="1" if num else None,
                        bulletFontName="Arial", bulletFontSize=8 if not num else 9.5,
                        bulletColor=VERDE, leftIndent=14, spaceAfter=6)

def tabla(filas, anchos, cab=True):
    data = [[P(c, "celdab" if (cab and i == 0) else "celda") for c in f] for i, f in enumerate(filas)]
    t = Table(data, colWidths=anchos, repeatRows=1 if cab else 0)
    estilo = [("VALIGN", (0, 0), (-1, -1), "TOP"),
              ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINEA),
              ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
              ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    if cab: estilo += [("BACKGROUND", (0, 0), (-1, 0), FONDO), ("LINEBELOW", (0, 0), (-1, 0), 0.8, VERDE)]
    t.setStyle(TableStyle(estilo))
    return t

def caja(titulo, cuerpo, fondo=FONDO_V, borde=VERDE):
    filas = ([P(titulo, "cajat")] if titulo else []) + [P(x, "caja") if isinstance(x, str) else x for x in cuerpo]
    t = Table([[filas]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fondo), ("LINEBEFORE", (0, 0), (0, -1), 2.2, borde),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return KeepTogether([t, Spacer(1, 8)])

def aviso(titulo, cuerpo): return caja(titulo, cuerpo, FONDO_A, colors.HexColor("#d97706"))

def pie(canv, doc):
    canv.saveState()
    canv.setFont("Arial", 7.8); canv.setFillColor(GRIS)
    canv.drawString(20 * mm, 12 * mm, "TalentPact · El corrector · 15/10/2026")
    canv.drawRightString(190 * mm, 12 * mm, str(doc.page))
    canv.setStrokeColor(LINEA); canv.setLineWidth(0.4); canv.line(20 * mm, 16 * mm, 190 * mm, 16 * mm)
    canv.restoreState()

def portada(canv, doc):
    canv.saveState()
    canv.setFillColor(VERDE); canv.rect(0, A4[1] - 9 * mm, A4[0], 9 * mm, fill=1, stroke=0)
    canv.restoreState()

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=22 * mm,
                      title="El corrector de TalentPact", author="Xagri e Iván Sánchez (con Claude)",
                      subject="Diagnóstico, mejoras aplicadas y propuestas del corrector")
marco = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="m")
doc.addPageTemplates([PageTemplate(id="portada", frames=[marco], onPage=portada),
                      PageTemplate(id="normal", frames=[marco], onPage=pie)])
from reportlab.platypus import NextPageTemplate

S = []
W = 170 * mm

# ─── Portada ────────────────────────────────────────────────────────────────
S += [Spacer(1, 40 * mm), P("El corrector de TalentPact", "titulo"),
      P("Cómo funciona, qué fallaba, qué hemos cambiado y cómo hacer que corrija de forma más elaborada y concreta", "sub"),
      Spacer(1, 6 * mm),
      P("Documento de trabajo para Xagri e Iván · 15 de octubre de 2026 · Corrector versión 2.1.0", "peq"),
      Spacer(1, 14 * mm)]
S.append(caja("En una frase", [
    "El corrector ya no pone la nota «a ojo». Ahora puntúa criterios fijos con una escala igual para todos, "
    "tiene que citar frases reales de la respuesta y deja que el servidor haga la cuenta. "
    "El siguiente paso, imprescindible, es <b>medir</b> cuánto coincide con una persona de RRHH."]))
S.append(Spacer(1, 6 * mm))
S.append(P("Contenido", "h3"))
S.append(lista([
    "Resumen para leer en dos minutos",
    "Cómo funciona el corrector hoy",
    "Qué fallaba en la versión 2.0",
    "Qué hemos cambiado en la versión 2.1, con ejemplos",
    "Límites de la versión 2.1 (lo que todavía no sabemos)",
    "Propuestas para mejorarlo: medir, rúbricas, técnica de corrección, trampas, justicia, feedback, empresa, nuevos ejercicios, coste y cumplimiento",
    "Hoja de ruta y decisiones pendientes",
    "Anexo: pesos, escala, topes y ficheros"], num=True))
S += [NextPageTemplate("normal"), PageBreak()]

# ─── 1. Resumen ─────────────────────────────────────────────────────────────
S.append(P("1. Resumen para leer en dos minutos", "h1"))
S.append(P("El corrector es la pieza que da sentido a TalentPact: convierte la respuesta de un candidato a un reto en una nota "
           "que una empresa se pueda creer. Si la nota no es <b>concreta</b> (qué hizo bien y qué no), <b>justificada</b> "
           "(con pruebas sacadas de la respuesta) y <b>estable</b> (la misma respuesta saca la misma nota), la empresa no paga "
           "y el candidato no aprende nada."))
S.append(P("Qué fallaba", "h2"))
S.append(lista([
    "Todos los retos se corregían con los mismos cuatro criterios genéricos, y el feedback salía vago.",
    "La nota final la decidía el modelo de IA sin que nadie comprobara que cuadrara con las notas de cada criterio.",
    "El modelo podía justificar una nota con algo que el candidato no había escrito.",
    "En los ejercicios de clasificación (95 de 309), el navegador enviaba también la respuesta correcta: se podía hacer trampa, y además se pagaba una llamada a la IA por una simple cuenta.",
    "Las cifras de calidad del TFM se midieron con otro prompt y otros retos: no describen el corrector que usa la web."]))
S.append(P("Qué hemos cambiado (versión 2.1)", "h2"))
S.append(lista([
    "Criterios fijos y con peso según el tipo de ejercicio (análisis, correo, otros).",
    "Una escala por niveles igual para todos los criterios, para que un 70 signifique siempre lo mismo.",
    "Indicadores concretos de cada ejercicio, que el corrector revisa uno a uno.",
    "Citas literales obligatorias, comprobadas por el servidor. Sin pruebas, un criterio no pasa de 40.",
    "La nota final y los topes los calcula el servidor, no el modelo.",
    "Feedback por criterio: cita, qué está bien, qué falta y una acción concreta para subir.",
    "Las clasificaciones se corrigen sin IA, con la solución oficial y descontando el acierto por azar."]))
S.append(P("Qué proponemos", "h2"))
S.append(P("Lo primero es <b>medir</b>: unas 30 respuestas reales puntuadas por la asesora y por uno de vosotros, y un banco de pruebas "
           "que llame al corrector de verdad. Con eso se decide todo lo demás. Después: rúbricas escritas por expertos para los retos de "
           "Personas y equipo, corrección en dos pasadas, doble corrección cerca de los cortes, bandas para la empresa, variantes de "
           "cada reto contra la trampa, transcripción del audio y una repregunta adaptativa. La sección 6 lo explica todo con detalle."))
S.append(PageBreak())

# ─── 2. Cómo funciona ───────────────────────────────────────────────────────
S.append(P("2. Cómo funciona el corrector hoy", "h1"))
S.append(P("Este es el recorrido de una respuesta desde que el candidato pulsa «Enviar» hasta que su nota llega al pool de empresas:"))
S.append(tabla([
    ["Paso", "Qué pasa", "Dónde"],
    ["1. Respuesta", "El navegador envía el identificador del reto y del ejercicio, y la respuesta del candidato.", "Web (08-ofertas-y-ejercicios.js)"],
    ["2. Enunciado oficial", "Si el reto es del catálogo, el servidor ignora el enunciado que llega del navegador y usa el suyo (título, escenario, datos e indicadores).", "Servidor (catalogo-retos.json)"],
    ["3. Clasificaciones", "Si el ejercicio es de clasificar, se corrige aquí con la solución oficial, sin IA.", "Servidor (corregirDecision)"],
    ["4. Filtro de manipulación", "Si la respuesta intenta dar órdenes al corrector («ignora las instrucciones», «ponme un 100»), se pone un 0 sin llamar al modelo. Si hay una señal leve, la nota se limita a 60.", "Servidor (detectInjection)"],
    ["5. Corrección con IA", "El modelo recibe las reglas, la rúbrica, los indicadores y la respuesta entre etiquetas con un código aleatorio, para que no pueda colar instrucciones. Devuelve una nota y pruebas por criterio.", "Anthropic (temperatura 0)"],
    ["6. Nota final", "El servidor comprueba las citas, aplica pesos y topes y redacta el feedback.", "Servidor (puntuar)"],
    ["7. Recibo firmado", "La nota sale con un recibo firmado (HMAC). Al guardarla, el servidor comprueba que la firma es suya, que el reto es del catálogo y que la nota cuadra.", "Servidor (save-evaluation)"],
    ["8. Pool y SkillPass", "Solo las notas con recibo válido salen como «verificadas». En el pool y en el SkillPass, una verificada manda sobre una no verificada.", "Servidor"],
], [30 * mm, 96 * mm, 44 * mm]))
S.append(Spacer(1, 6))
S.append(aviso("Importante para producción", [
    "Sin la variable <b>EVAL_SIGNING_SECRET</b> configurada en Netlify, los recibos no se firman y <b>ninguna nota sale verificada</b>. "
    "Es lo primero que hay que hacer, independientemente de todo lo demás."]))

# ─── 3. Qué fallaba ─────────────────────────────────────────────────────────
S.append(P("3. Qué fallaba en la versión 2.0", "h1"))
fallos = [
    ("Rúbrica genérica",
     "Un correo para comunicar una mala noticia al equipo y un análisis de métricas de un SaaS se medían con los mismos cuatro criterios: relevancia, profundidad, estructura y aplicabilidad.",
     "El modelo no sabía qué mirar en cada ejercicio, y el feedback acababa siendo «profundiza más» o «sé más concreto», que no ayuda a nadie."),
    ("Nota global «a ojo»",
     "El prompt pedía «la media ponderada de los criterios», pero no decía los pesos exactos y nadie comprobaba la cuenta.",
     "Podía salir un 70 global con todos los criterios en 50. La nota no se podía reproducir ni explicar."),
    ("Sin pruebas",
     "El feedback podía decir «calcula bien el CAC» aunque el candidato no hubiera mencionado el CAC.",
     "Feedback que no se puede auditar. Para un sistema que influye en decisiones de empleo (alto riesgo en el Reglamento europeo de IA) es un problema serio."),
    ("Topes solo en el prompt",
     "Reglas como «si no aborda el escenario, máximo 10» eran texto en el prompt.",
     "El modelo podía no cumplirlas y nadie lo detectaba."),
    ("Guías desaprovechadas",
     "Muchos ejercicios traen una guía muy concreta: «Incluye: 1) Apertura sin atacar 2) Hechos concretos 3) Pregunta abierta». Se pasaba como texto suelto.",
     "Eran los indicadores más útiles que teníamos y el corrector no los usaba como lista de comprobación."),
    ("Clasificaciones con IA y con la solución en el navegador",
     "En los 95 ejercicios de clasificar, el navegador mandaba lo que eligió el candidato y cuál era la respuesta correcta.",
     "Bastaba con cambiar la «correcta» para sacar buena nota. Y cada intento costaba una llamada a la IA para hacer una cuenta."),
    ("El banco de pruebas mide otra cosa",
     "Las cifras de calidad del TFM (acuerdo de banda, error medio) salen del modo «crudo» con dos retos del POC (Python y SQL).",
     "No describen el corrector que usan los 103 retos de la web. No sabemos cuánto acierta en producción."),
]
S.append(tabla([["Fallo", "Qué pasaba", "Consecuencia"]] + [list(f) for f in fallos], [32 * mm, 70 * mm, 68 * mm]))
S.append(PageBreak())

# ─── 4. Qué hemos cambiado ──────────────────────────────────────────────────
S.append(P("4. Qué hemos cambiado en la versión 2.1", "h1"))
S.append(P("4.1 Criterios fijos con peso, según el tipo de ejercicio", "h2"))
S.append(P("Los criterios y sus pesos los define el servidor. El modelo puntúa cada criterio por separado, pero no decide la nota final."))
S.append(tabla([
    ["Tipo de ejercicio", "Criterios (peso)"],
    ["Análisis de datos (88 ejercicios)", "Interpretación de los datos (25) · Diagnóstico (25) · Plan de acción priorizado (30) · Justificación con datos (20)"],
    ["Correo o comunicación (124)", "Contenido y cobertura (30) · Propuesta concreta (25) · Tono y adecuación (20) · Estructura (15) · Concisión (10)"],
    ["Resto (audio y otros)", "Relevancia (30) · Profundidad (30) · Aplicabilidad (25) · Estructura (15)"],
    ["Clasificación (95)", "Sin IA: porcentaje de acierto con la solución oficial, descontando el azar"],
], [52 * mm, 118 * mm]))
S.append(P("4.2 Una escala igual para todos los criterios", "h2"))
S.append(P("Sin una escala descrita, «70» significa cosas distintas en cada corrección. Ahora cada tramo tiene una definición:"))
S.append(tabla([
    ["Nota", "Qué significa"],
    ["0–20", "No lo hace, o lo hace mal."],
    ["21–40", "Lo menciona sin desarrollarlo, o de forma genérica que valdría para cualquier caso."],
    ["41–60", "Correcto pero poco concreto; usa poco el escenario."],
    ["61–80", "Concreto y aplicado a este escenario, con alguna carencia."],
    ["81–100", "Concreto, justificado con datos del escenario y sin carencias relevantes."],
], [24 * mm, 146 * mm]))
S.append(P("4.3 Indicadores concretos de cada ejercicio", "h2"))
S.append(P("Cuando la guía de un ejercicio viene numerada, el servidor la convierte en una lista de indicadores. El modelo tiene que decir, "
           "uno a uno, cuáles se cumplen y cuáles faltan. En los análisis se añaden los conceptos esperados y la tabla de datos del escenario."))
S.append(caja("Ejemplo: reto de Liderazgo, «Conversación difícil»", [
    "Guía original: <i>«Incluye: 1) Apertura (cómo empiezas sin atacar). 2) Hechos concretos (no sensaciones). 3) Pregunta abierta…»</i>",
    "Indicadores que revisa el corrector: <b>Apertura sin atacar</b> · <b>Hechos concretos, no sensaciones</b> · <b>Pregunta abierta</b>."]))
S.append(P("4.4 Pruebas obligatorias y comprobadas", "h2"))
S.append(P("Por cada criterio, el modelo tiene que copiar de una a tres frases <b>literales</b> de la respuesta que justifiquen la nota. "
           "El servidor comprueba que esas frases están de verdad en la respuesta (sin importar mayúsculas, tildes o puntos suspensivos):"))
S.append(lista([
    "Una cita que no aparece en la respuesta se descarta. El feedback nunca atribuye al candidato algo que no escribió.",
    "Si un criterio se queda sin ninguna cita válida, su nota no puede pasar de 40, y el feedback lo dice.",
    "Si el modelo se salta un criterio, cuenta 0 y se avisa («el corrector no puntuó este criterio»)."]))
S.append(P("4.5 La nota final la calcula el servidor", "h2"))
S.append(caja("Ejemplo resuelto: análisis de churn", [
    "Respuesta del candidato: <i>«El churn sube al 7,2 % este trimestre. La causa es el onboarding: los clientes no activan la cuenta. "
    "Propongo un onboarding guiado en 30 días con responsable de Customer Success y medir la activación semanal.»</i>",
    tabla([["Criterio", "Peso", "Nota", "Cita comprobada"],
           ["Interpretación de los datos", "25", "80", "«El churn sube al 7,2 % este trimestre»"],
           ["Diagnóstico", "25", "60", "«La causa es el onboarding»"],
           ["Plan de acción priorizado", "30", "70", "«onboarding guiado en 30 días con responsable…»"],
           ["Justificación con datos", "20", "50", "«medir la activación semanal»"]],
          [50 * mm, 14 * mm, 14 * mm, 70 * mm]),
    Spacer(1, 4),
    "Cuenta del servidor: (80 × 25 + 60 × 25 + 70 × 30 + 50 × 20) / 100 = <b>66</b>. "
    "Si el modelo hubiera propuesto un 90 global, se ignoraría."]))
S.append(P("4.6 Topes que aplica el servidor", "h2"))
S.append(P("El modelo marca tres banderas (si aborda el escenario, si es genérica y si copia el enunciado) y el servidor aplica el tope:"))
S.append(tabla([["Situación", "Nota máxima"],
                ["No aborda el escenario", "10"], ["Copia o parafrasea el enunciado", "15"],
                ["Respuesta genérica, que valdría para cualquier caso", "40"],
                ["Grabación corregida sin transcripción", "60"],
                ["Señal leve de manipulación (ya existía)", "60"]], [130 * mm, 40 * mm]))
S.append(P("4.7 Feedback que sirve para mejorar", "h2"))
S.append(P("Cada criterio llega al candidato con este formato, y al final hay un resumen y un siguiente paso:"))
S.append(caja(None, ["<b>Plan de acción priorizado · 70</b>",
                     "Cita: «onboarding guiado en 30 días con responsable de Customer Success». "
                     "Falta: priorizar entre varias acciones. Para subir: ordena tres acciones por impacto y di cuál harías primero."], FONDO, LINEA))
S.append(P("4.8 Clasificaciones sin IA y descontando el azar", "h2"))
S.append(KeepTogether([P("Los ejercicios de clasificar (por ejemplo, ordenar tareas en «urgente» y «puede esperar») se corrigen en el servidor con la "
           "solución oficial. Lo que diga el navegador sobre cuál era la correcta se ignora. Como con dos categorías se acierta la mitad "
           "eligiendo al azar, la nota descuenta ese azar:"),
*caja("Fórmula y ejemplos", [
    "nota = (acierto − 1/k) / (1 − 1/k) × 100, donde k es el número de categorías.",
    "Con 2 categorías: 8 de 8 bien da <b>100</b>; 7 de 8 da <b>75</b>; 6 de 8 da <b>50</b>; 4 de 8 (lo que sale al azar) da <b>0</b>.",
    "Ventajas: no se puede hacer trampa, la nota es exacta y no se gasta ninguna llamada a la IA en casi un tercio de los ejercicios."])._content]))
S.append(P("4.9 Compatibilidad y pruebas", "h2"))
S.append(P("Si el modelo devuelve el formato antiguo, se usa como antes. El modo «crudo» del banco de pruebas del TFM no cambia, así que "
           "sus cifras siguen siendo válidas para lo que miden. Cada recibo lleva la versión 2.1.0, de modo que siempre se sabe con qué rúbrica "
           "se puso cada nota. Los tests nuevos están en <i>tests/corrector-v21.test.js</i> (138 tests en total, todos en verde)."))
S.append(Spacer(1, 10))

# ─── 5. Límites ─────────────────────────────────────────────────────────────
S.append(P("5. Límites de la versión 2.1: lo que todavía no sabemos", "h1"))
S.append(P("Conviene ser honestos con lo que esta versión aún no ha demostrado:"))
S.append(tabla([
    ["Límite", "Por qué importa", "Cómo se resuelve"],
    ["No se ha probado con el modelo real", "Los tests simulan la respuesta del modelo. No sabemos si cita bien o si respeta el formato en todos los casos.", "Corregir 20–30 respuestas reales y revisarlas a mano (propuesta A1)."],
    ["El tope de 40 sin pruebas puede ser injusto", "Si el modelo parafrasea en vez de copiar literalmente, se castiga al candidato por un fallo del corrector.", "Medir el porcentaje de citas descartadas. Si supera el 10 %, relajar la comprobación o pedir las citas en un paso previo (C1)."],
    ["Descontar el azar es exigente", "Un 6 de 8 da 50, cuando antes parecía un 75.", "Decisión de producto: la propuesta es mantenerlo y explicarlo en pantalla."],
    ["Los indicadores salen de la guía", "Algunas guías no están numeradas o son pobres.", "Indicadores escritos a mano para los retos clave (B1)."],
    ["Sube el coste por corrección", "La salida es más larga (de 1.000 a 1.800 tokens como máximo).", "Caché del prompt y revisión del coste real tras una semana (I1)."],
], [40 * mm, 65 * mm, 65 * mm]))

# ─── 6. Propuestas ──────────────────────────────────────────────────────────
S.append(P("6. Propuestas para mejorar el corrector", "h1"))
S.append(P("Las propuestas están agrupadas por objetivo. Cada una indica qué es, por qué ayuda y el esfuerzo aproximado. "
           "Las marcadas como <b>prioridad 1</b> son las que recomendamos hacer primero."))

def bloque(titulo, props):
    """Título de grupo pegado a su primera propuesta (keepWithNext no basta con bloques agrupados)."""
    # Sin anidar KeepTogether: uno dentro de otro mide «infinito» y fuerza salto de página.
    return [KeepTogether([P(titulo, "h2")] + list(props[0]._content))] + props[1:]

def propuesta(cod, titulo, que, porque, esfuerzo, prioridad=None):
    cab = f"{cod} · {titulo}" + (f"  —  prioridad {prioridad}" if prioridad else "")
    return KeepTogether([P(cab, "h3"), P(que), P("<b>Por qué ayuda:</b> " + porque), P("<b>Esfuerzo:</b> " + esfuerzo, "peq"), Spacer(1, 3)])

S += bloque("A. Medir antes de seguir", [
    propuesta("A1", "Gold set del catálogo con notas humanas",
              "Preparar unas 30 respuestas sobre 5 retos reales de la web (un análisis, dos correos de Personas y equipo, un reto de sector y uno de comunicación), "
              "de excelente a mala, más 2 intentos de manipulación. Que la asesora de RRHH y uno de vosotros las puntúen por separado con la misma rúbrica.",
              "Es la única forma de saber si el corrector acierta. Permite hablar de acuerdo con personas, algo que hoy el informe no puede afirmar.",
              "2–3 días de redacción, más la sesión con la asesora.", 1),
    propuesta("A2", "Banco de pruebas v2 sobre el corrector real",
              "Que <i>npm run bench</i> llame al corrector de la web (modo v2) con el gold set del catálogo y mida: acuerdo de banda (kappa cuadrática), "
              "error medio, estabilidad (misma respuesta dos veces), porcentaje de citas descartadas, porcentaje de topes aplicados y coste por corrección.",
              "Cada cambio de prompt, rúbrica o modelo se puede comparar con números antes de publicarlo.",
              "2 días.", 1),
    propuesta("A3", "Pruebas de sesgo",
              "Corregir la misma respuesta con variaciones que no deberían cambiar la nota: más larga pero sin más contenido, con faltas de ortografía, "
              "en inglés, con estilo más informal. Si la nota se mueve más de 5 puntos, hay un sesgo que corregir.",
              "El corrector puede estar premiando la longitud o el estilo en vez del contenido sin que nos demos cuenta.",
              "1 día, reutilizando el banco v2.", 2),
])
S += bloque("B. Rúbricas más ricas", [
    propuesta("B1", "Indicadores escritos por expertos para los retos clave",
              "Para cada reto de Personas y equipo, entre 3 y 5 indicadores observables, revisados por la asesora. Por ejemplo, en Liderazgo: "
              "«nombra un hecho concreto», «escucha antes de proponer», «acuerda un plazo», «no culpa a la persona».",
              "Los indicadores observables son lo que hace que dos correctores (humanos o IA) coincidan.",
              "Medio día por reto; empezar por los 7 de Personas.", 1),
    propuesta("B2", "Descriptores por nivel en cada criterio",
              "Además de la escala general, describir qué es un 40, un 60 y un 80 en cada criterio concreto. Por ejemplo, en «Plan de acción»: "
              "40 = lista de ideas sin orden; 60 = acciones con orden; 80 = acciones con orden, responsable y métrica.",
              "Reduce la ambigüedad entre tramos, que es donde más discrepan los correctores.",
              "1–2 días para los tres tipos de ejercicio.", 2),
    propuesta("B3", "Rúbrica según el nivel del reto",
              "Los ejercicios tienen dificultad básica, intermedia o avanzada. Ajustar las expectativas: en uno básico, un plan con dos acciones bien elegidas puede ser un 80.",
              "Hoy se exige lo mismo en todos los niveles, lo que penaliza a quien hace bien un reto básico.",
              "1 día.", 3),
    propuesta("B4", "Errores de fondo como penalización explícita",
              "Lista de errores graves por tipo (una decisión poco ética, un dato inventado, culpar a una persona en público) que restan puntos fijos.",
              "Un error grave puede quedar escondido en una media de criterios que, por lo demás, están bien.",
              "1 día.", 3),
])
S += bloque("C. Técnica de corrección", [
    propuesta("C1", "Corrección en dos pasadas",
              "Primera pasada: el modelo solo extrae evidencias (citas) e indicadores cumplidos, sin poner nota. Segunda pasada: puntúa a partir de esas evidencias.",
              "Separar «qué hay» de «cuánto vale» reduce las notas por impresión general y hace el feedback más concreto.",
              "2 días. Coste: dos llamadas por corrección (se compensa en parte con la caché del prompt).", 2),
    propuesta("C2", "Ejemplos calibrados en el prompt",
              "Incluir, por tipo de ejercicio, una respuesta floja y una buena ya puntuadas con su justificación.",
              "Es la forma más eficaz de que el modelo use la escala igual que nosotros.",
              "1 día. Unos 1.500 tokens más por corrección (se reducen con caché).", 2),
    propuesta("C3", "Doble corrección cerca de los cortes",
              "Si la nota cae a menos de 3 puntos de un corte de banda (por ejemplo, entre 57 y 63) o si algún criterio quedó limitado por falta de pruebas, "
              "se corrige otra vez. Si las dos notas difieren más de 10 puntos, pasa a revisión humana.",
              "Las notas cerca de un corte son las que cambian decisiones; ahí merece la pena gastar una llamada más.",
              "1 día.", 2),
    propuesta("C4", "Salida con formato garantizado",
              "Usar la herramienta de salida estructurada de la API (un esquema JSON) en vez de pedir «responde solo con JSON».",
              "Elimina los fallos de formato y obliga a que estén todos los criterios.",
              "Medio día.", 2),
    propuesta("C5", "Comprobación de coherencia",
              "El servidor compara la nota de cada criterio con los indicadores cumplidos: un 85 con cero indicadores cumplidos, o un 20 con todos cumplidos, se marca para revisión.",
              "Detecta automáticamente las correcciones raras sin revisar todas a mano.",
              "Medio día.", 3),
])
S += bloque("D. Contra la trampa", [
    propuesta("D1", "Variantes de cada reto",
              "Para cada ejercicio, varias versiones con cifras, nombres o contexto distintos (por ejemplo, un churn del 7,2 % o del 5,8 %). El servidor asigna una al azar.",
              "Hoy los retos son fijos: quien repite se aprende el ejercicio, y las respuestas se pueden compartir.",
              "Continuo. Empezar por los 20 retos más usados.", 2),
    propuesta("D2", "Política de reintentos",
              "Un plazo entre intentos del mismo reto (por ejemplo, 30 días) y el número de intentos visible para la empresa.",
              "Hoy cuenta la mejor nota y no hay límite de intentos: la nota mide práctica, no competencia.",
              "1 día.", 1),
    propuesta("D3", "Detección de respuestas copiadas",
              "Comparar cada respuesta con las anteriores del mismo ejercicio. Si son casi iguales, se marca para revisión, sin penalizar automáticamente.",
              "Si alguien publica respuestas buenas, se detecta pronto.",
              "1–2 días.", 3),
])
S += bloque("E. Justicia y transparencia", [
    propuesta("E1", "Revisión humana de verdad",
              "Convertir «Pedir revisión» (hoy abre un correo) en una cola con estado, plazo de respuesta y registro de quién revisó y qué cambió. "
              "Más una muestra aleatoria del 5–10 % revisada cada semana.",
              "El Reglamento de IA y el RGPD (artículo 22) piden intervención humana real en decisiones automatizadas que afectan a personas.",
              "2–3 días.", 1),
    propuesta("E2", "Hoja de transparencia para el candidato",
              "Una página que explique qué se evalúa, cómo corrige la IA, qué ve la empresa y cómo pedir revisión.",
              "Genera confianza y es parte de las obligaciones de un sistema de alto riesgo.",
              "1 día.", 2),
    propuesta("E3", "Ajustes de accesibilidad",
              "Tiempo extra a petición en los retos con cronómetro y compatibilidad con lector de pantalla.",
              "Que la nota mida la competencia y no una dificultad ajena al puesto.",
              "1–2 días.", 3),
])
S += bloque("F. Mejor feedback para el candidato", [
    propuesta("F1", "Resultado como lista de comprobación",
              "Mostrar en la pantalla de resultado los indicadores cumplidos y los que faltan como una lista visual, y resaltar en su propio texto las frases citadas.",
              "El candidato ve exactamente qué hizo bien y qué le faltó, en vez de leer un párrafo.",
              "1–2 días (la información ya llega desde el servidor).", 2),
    propuesta("F2", "Comparación con su intento anterior",
              "Si repite un reto, enseñar qué criterios subieron y cuáles bajaron.",
              "Convierte el reto en aprendizaje y le da motivos para volver.",
              "1 día.", 3),
    propuesta("F3", "Plan de práctica",
              "A partir de sus criterios más débiles en todos los retos, recomendar los dos siguientes retos que más le ayudarían.",
              "Mejora la retención y llena el pool de candidatos con más evidencia.",
              "1–2 días.", 3),
])
S += bloque("G. Mejor información para la empresa", [
    propuesta("G1", "Bandas en vez del número exacto",
              "Enseñar Insuficiente / Aceptable / Bueno / Muy bueno, con el número disponible al pasar el ratón.",
              "Es lo que se puede garantizar: distinguir «bueno» de «aceptable» sí, acertar el 74 exacto no.",
              "Medio día.", 2),
    propuesta("G2", "«Por qué este 78»",
              "En la ficha anónima, mostrar por cada competencia los indicadores cumplidos y una cita (si el candidato lo autoriza).",
              "La empresa compra evidencia, no un número. Es nuestro argumento principal.",
              "1–2 días.", 2),
    propuesta("G3", "Contexto de la nota",
              "Junto a cada nota: fecha, número de intentos, versión del corrector y si una persona la revisó.",
              "Una nota sin contexto vale menos.",
              "Medio día.", 3),
])
S += bloque("H. Nuevos tipos de corrección", [
    propuesta("H1", "Transcripción del audio",
              "Transcribir la grabación antes de corregirla, con un servicio de voz a texto, y corregir el texto con la rúbrica de comunicación.",
              "Hoy el corrector solo recibe «[Grabación de N segundos]» y puede poner hasta 60 sin haber oído nada.",
              "2–3 días, más el coste del servicio.", 1),
    propuesta("H2", "Clasificación con justificación",
              "Después de clasificar, una frase: «¿Por qué esta es tu prioridad número 1?». La corrige la IA con un criterio de comprensión.",
              "Distingue a quien acierta por intuición de quien entiende la prioridad.",
              "1 día.", 2),
    propuesta("H3", "Repregunta adaptativa",
              "Tras la primera respuesta, el corrector hace una pregunta de seguimiento sobre el criterio más débil (por ejemplo, «¿y si el presupuesto se reduce a la mitad?»). La nota combina las dos respuestas.",
              "Se parece a una entrevista real y es mucho más difícil de preparar de memoria o de copiar.",
              "3–4 días.", 3),
    propuesta("H4", "Retos de oferta en el servidor",
              "Pasar los ejercicios específicos de las ofertas al catálogo del servidor, con su rúbrica e indicadores.",
              "Hoy se corrigen con el texto que manda el navegador y no se pueden verificar.",
              "1–2 días.", 2),
])
S += bloque("I. Coste y operación", [
    propuesta("I1", "Caché del prompt",
              "La parte fija del prompt (reglas, escala, rúbrica del tipo de ejercicio) es igual en muchas correcciones. La API de Anthropic permite guardarla en caché, y leerla de la caché cuesta una fracción del precio normal.",
              "Compensa el coste extra de la v2.1 y de los ejemplos calibrados.",
              "Medio día.", 2),
    propuesta("I2", "Panel de salud del corrector",
              "En el backoffice: coste medio, tiempo medio, porcentaje de citas descartadas, porcentaje de topes, porcentaje de dobles correcciones y de revisiones humanas, por semana.",
              "Si algo se degrada (por ejemplo, el modelo empieza a parafrasear las citas), se ve en días y no en meses.",
              "1–2 días.", 2),
    propuesta("I3", "Versionado y recorrección",
              "Guardar la versión del corrector con cada nota (ya se hace en el recibo) y, al cambiar de versión, no mezclar notas de versiones distintas sin indicarlo. Si hace falta, recorregir las respuestas guardadas.",
              "Una nota de la v2.0 y otra de la v2.1 no son comparables.",
              "1 día.", 3),
    propuesta("I4", "Probar un modelo más reciente",
              "Comparar con el banco v2 el modelo actual (claude-sonnet-4-6) con uno más reciente, en acuerdo, estabilidad y coste, antes de cambiar.",
              "Puede mejorar la calidad o bajar el coste, pero las cifras del TFM están calibradas con el modelo actual.",
              "1 día, una vez exista el banco v2.", 3),
])
S.append(PageBreak())

# ─── 7. Hoja de ruta ────────────────────────────────────────────────────────
S.append(P("7. Hoja de ruta propuesta", "h1"))
S.append(tabla([
    ["Fase", "Qué", "Duración orientativa", "Resultado"],
    ["0 · Ya", "Configurar EVAL_SIGNING_SECRET. Publicar la v2.1.", "1 día", "Notas verificadas en producción."],
    ["1 · Medir", "A1 gold set con la asesora · A2 banco v2 · revisar 20–30 correcciones reales de la v2.1.", "1–2 semanas", "Sabemos cuánto acierta el corrector."],
    ["2 · Concretar", "B1 indicadores de Personas · C2 ejemplos calibrados · C4 formato garantizado · D2 reintentos · H1 audio.", "2 semanas", "Feedback más concreto y notas más estables."],
    ["3 · Defender", "C3 doble corrección · E1 revisión humana · G1 bandas · G2 «por qué este 78» · I2 panel de salud.", "2 semanas", "Notas que se pueden explicar a una empresa y a un candidato."],
    ["4 · Escalar", "C1 dos pasadas · D1 variantes · H2 y H3 · H4 retos de oferta · I1 caché · I4 modelo.", "Continuo", "Más difícil de copiar, más barato y más parecido a una entrevista."],
], [24 * mm, 76 * mm, 28 * mm, 42 * mm]))
S.append(P("8. Decisiones pendientes", "h1"))
S.append(tabla([
    ["Decisión", "Recomendación"],
    ["¿Descontamos el azar en las clasificaciones?", "Sí, explicándolo en la pantalla de resultado."],
    ["¿Enseñamos bandas a la empresa en vez del número exacto?", "Sí, con el número disponible al pasar el ratón."],
    ["¿Quién pone las notas humanas del gold set?", "La asesora y uno de vosotros dos, por separado."],
    ["¿Plazo entre intentos del mismo reto?", "30 días, con el número de intentos visible."],
    ["¿Mantenemos el tope de 40 sin pruebas?", "Sí, pero revisarlo con el porcentaje de citas descartadas del banco v2."],
], [85 * mm, 85 * mm]))

# ─── Anexo ──────────────────────────────────────────────────────────────────
S.append(P("Anexo: dónde está cada cosa", "h1"))
S.append(tabla([
    ["Fichero", "Qué contiene"],
    ["netlify/functions/lib/evaluator.js", "Reglas del prompt, rúbricas (RUBRICAS), escala (NIVELES), topes (TOPES), indicadores, cálculo de la nota (puntuar) y corrección de clasificaciones (corregirDecision)."],
    ["netlify/functions/lib/handlers/evaluate-exercise.js", "La función que corrige: enunciado oficial, filtro anti-manipulación, llamada al modelo y recibo firmado."],
    ["netlify/functions/lib/catalogo-retos.json", "Copia de los 103 retos para el servidor. Se regenera con npm run catalogo; un test avisa si se desincroniza."],
    ["netlify/functions/lib/handlers/save-evaluation.js", "Guarda la nota y decide si está verificada."],
    ["tests/corrector-v21.test.js", "Tests de la v2.1: pesos, citas, topes, clasificaciones e indicadores."],
    ["docs/Cambios_prereunion/06_corrector.md", "Versión corta de este documento, en el repositorio."],
], [70 * mm, 100 * mm]))

doc.build(S)
print("ok", OUT)
