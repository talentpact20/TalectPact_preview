# Genera el PDF del plan tras la reunión a partir de los .md de docs/plan_post_reunion/.
# Uso: python3 tools/generar_plan_pdf.py              → TalentPact_Plan_resumen.pdf (resumen_general.md, máx. 2 páginas por concepto)
#      python3 tools/generar_plan_pdf.py --completo   → TalentPact_Plan_completo.pdf (los documentos 00–10 enteros + anexo)
# Requiere: markdown, pypdf, reportlab y Google Chrome (lo usa en modo headless para imprimir el HTML).
# El contenido sale de los .md sin cambios; se añade portada, índice, resumen visual y aperturas de capítulo.
import html
import os
import re
import subprocess
import sys
import tempfile
from io import BytesIO

import markdown
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA = os.path.join(RAIZ, "docs", "plan_post_reunion")
COMPLETO = "--completo" in sys.argv
SALIDA = os.path.join(CARPETA, "TalentPact_Plan_completo.pdf" if COMPLETO else "TalentPact_Plan_resumen.pdf")
RESUMEN = os.path.join(CARPETA, "resumen_general.md")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LOGO = os.path.join(RAIZ, "brand", "talentpact-logo.svg")

# (fichero, número, título, idea principal, tarea de la reunión)
CAPITULOS = [
    ("00_plan_maestro.md", "00", "Plan maestro",
     "Visión de conjunto, hallazgos, orden de trabajo y decisiones pendientes.", "Documento completo de cómo enfocarlo todo"),
    ("01_sectores_areas_y_vocabulario.md", "01", "Sectores, áreas funcionales y vocabulario",
     "Sector para la empresa, área funcional para el puesto. El primer nivel se ve; el segundo se busca.", "Áreas de creación de empleo como LinkedIn · vocabulario · sectores y áreas"),
    ("02_rama_ia.md", "02", "La rama de IA",
     "Rama propia con 24 hard skills en 6 itinerarios, más «IA en el trabajo» para todos.", "Tema IA: sí, con actividades; rama especial"),
    ("03_blockchain_de_pago.md", "03", "Blockchain de pago",
     "Verificar siempre es gratis; se cobra el sello público. Pequeño para el candidato, apartado propio para la empresa.", "Tema blockchain: cómo hacerlo de pago"),
    ("04_modelo_de_negocio_y_precios.md", "04", "Modelo de negocio y precios",
     "El B2B es el motor. Candidato: gratis o Plus. Pagar nunca cambia una nota ni una posición.", "Revisar modelo financiero · precios para candidatos"),
    ("05_corrector_completo.md", "05", "Un corrector completo",
     "Arquitectura v3 en 10 etapas y el camino desde la v2.1 en 10 pasos.", "Corrector: todo tipo de mejoras y cómo mejorarlo"),
    ("06_hard_y_soft_skills.md", "06", "Hard y soft skills",
     "El diccionario como vocabulario canónico: 8 competencias cubiertas, 10 parciales, 14 sin reto.", "Acabar de enfocar hard y soft skills"),
    ("07_base_de_datos_y_servidores.md", "07", "Base de datos, servidores y entrega a empresas",
     "Grafo de skills en PostgreSQL, datos en la UE y la información en el formato de cada empresa.", "Base de datos: qué tenemos y cómo guardarlo en servidores"),
    ("08_seguridad_antitrampas.md", "08", "Seguridad avanzada: antitrampas",
     "Intento de un solo uso, reloj de servidor, variantes, cámara proporcionada y defensa de la respuesta.", "Seguridad avanzada: todas las maneras de hacer trampa"),
    ("09_ejercicio_por_ejercicio.md", "09", "Definir ejercicio por ejercicio",
     "Una ficha única; los 42 ejercicios de soft skills definidos y 6 retos nuevos.", "Definir ejercicio por ejercicio"),
    ("10_confianza_y_acceso_empresas.md", "10", "Confianza y acceso para empresas",
     "Probar con su caso real: prueba sin tarjeta, «haz el reto tú», garantía de respuesta. Nunca datos inventados.", "Nuevas maneras de accesibilidad para empresa · ¿sesión gratis?"),
    ("09b_inventario_ejercicios.md", "A", "Anexo · Inventario de los 309 ejercicios",
     "Hoja de trabajo para cerrar la ficha de cada ejercicio.", "Definir ejercicio por ejercicio"),
]
ANCLA = {f: ("cap-anexo" if n == "A" else f"cap-{n}") for f, n, *_ in CAPITULOS}

CSS = """
@page { size: A4; margin: 16mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: -apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif; color: #0c1220;
       font-size: 9.6pt; line-height: 1.5; margin: 0; }
h1, h2, h3, h4 { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif; line-height: 1.25; }
h2 { font-size: 13.5pt; margin: 20px 0 8px; padding: 6px 0 6px 10px; border-left: 4px solid #0b6e5f;
     background: #f1f8f6; color: #08574b; break-after: avoid; }
h3 { font-size: 11pt; margin: 16px 0 6px; color: #0c1220; break-after: avoid; }
h3::before { content: ""; display: inline-block; width: 7px; height: 7px; background: #0f8a76; border-radius: 2px;
             margin-right: 7px; vertical-align: 1px; }
p { margin: 6px 0; }
a { color: #0b6e5f; text-decoration: none; }
strong { color: #060a13; }
code { font-family: "SF Mono", Menlo, monospace; font-size: 8.2pt; background: #f2f4f7; border: 1px solid #e4e7ec;
       border-radius: 3px; padding: 0 3px; color: #323c4e; }
pre { background: #0c1220; color: #e4e7ec; border-radius: 6px; padding: 10px 12px; font-size: 7.4pt; line-height: 1.4;
      break-inside: avoid; overflow: hidden; }
pre code { background: none; border: 0; color: inherit; padding: 0; font-size: inherit; }
hr { border: 0; border-top: 1px solid #e4e7ec; margin: 14px 0; }
ul, ol { margin: 6px 0 6px 0; padding-left: 20px; }
li { margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 8.4pt; line-height: 1.38; }
thead { display: table-header-group; }
th { background: #0b6e5f; color: #fff; text-align: left; padding: 5px 6px; font-weight: 600; }
td { padding: 4px 6px; border-bottom: 1px solid #e4e7ec; vertical-align: top; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) td { background: #f9fafb; }
blockquote { margin: 10px 0; padding: 8px 12px; background: #fffaf0; border-left: 4px solid #c2700b; color: #6e3d06;
             border-radius: 0 6px 6px 0; }
blockquote p { margin: 2px 0; }
.pill { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 7.6pt; font-weight: 600; white-space: nowrap; }
.p-ok { background: #dcefea; color: #08574b; } .p-mid { background: #fdf1dc; color: #8a4d07; }
.p-bad { background: #fde8e6; color: #a92e25; } .p-info { background: #e8eefc; color: #1f3f99; }
.p-neutral { background: #f2f4f7; color: #4a5568; }
li.check { list-style: none; margin-left: -18px; }
.box { display: inline-block; width: 10px; height: 10px; border: 1.5px solid #0b6e5f; border-radius: 2px;
       margin-right: 7px; vertical-align: -1px; background: #fff; }
.decide { border: 1.5px solid #0b6e5f; border-radius: 8px; padding: 4px 14px 10px; margin: 16px 0; background: #f1f8f6;
          break-inside: avoid; }
.decide h2 { background: none; border: 0; padding: 4px 0; margin: 6px 0 4px; }
.tarea { background: #f2f6fe; border-left: 4px solid #2f5bd3; padding: 8px 12px; border-radius: 0 6px 6px 0; color: #1f3f99; }
.tarea strong { color: #1f3f99; }

/* Portada */
.portada { height: 263mm; display: flex; flex-direction: column; justify-content: space-between; break-after: page;
           padding: 8mm 4mm; }
.portada .marca svg { height: 34px; width: auto; }
.portada .centro { margin-top: 40mm; }
.portada .kicker { color: #0b6e5f; font-weight: 700; letter-spacing: .12em; font-size: 9pt; text-transform: uppercase; }
.portada h1 { font-size: 34pt; margin: 10px 0 8px; letter-spacing: -.01em; }
.portada .sub { font-size: 13pt; color: #4a5568; max-width: 150mm; }
.portada .franja { height: 6px; width: 70mm; background: linear-gradient(90deg, #0b6e5f, #3aa892); border-radius: 3px; margin: 18px 0; }
.portada .datos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18mm; }
.portada .dato { border: 1px solid #e4e7ec; border-radius: 8px; padding: 10px 12px; }
.portada .dato b { display: block; font-size: 20pt; color: #0b6e5f; }
.portada .dato span { color: #4a5568; font-size: 8.4pt; }
.portada .pie { color: #667085; font-size: 8.4pt; border-top: 1px solid #e4e7ec; padding-top: 8px; }

/* Índice */
.indice { break-after: page; }
.indice h1, .visual h1 { font-size: 22pt; margin: 0 0 4px; }
.indice .intro, .visual .intro { color: #4a5568; margin-bottom: 14px; }
.fila { display: grid; grid-template-columns: 14mm 1fr 14mm; gap: 8px; align-items: start; padding: 8px 0;
        border-bottom: 1px solid #e4e7ec; break-inside: avoid; }
a.fila { color: inherit; }
.fila .n { font-size: 15pt; font-weight: 700; color: #0b6e5f; }
.fila .t { font-weight: 650; font-size: 10.4pt; }
.fila .i { color: #4a5568; font-size: 8.6pt; }
.fila .pg { text-align: right; font-weight: 600; color: #323c4e; font-variant-numeric: tabular-nums; }

/* Resumen visual */
.visual { break-after: page; }
.panel { border: 1px solid #e4e7ec; border-radius: 10px; padding: 10px 14px 12px; margin: 0 0 12px; break-inside: avoid; }
.panel h3 { margin: 2px 0 8px; }
.panel .nota { color: #667085; font-size: 7.8pt; margin-top: 6px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tarjeta { border: 1px solid #e4e7ec; border-radius: 8px; padding: 8px 10px; break-inside: avoid; background: #fff; }
.tarjeta .n { font-size: 8pt; font-weight: 700; color: #0b6e5f; letter-spacing: .06em; }
.tarjeta .t { font-weight: 650; font-size: 9.4pt; margin: 2px 0 3px; }
.tarjeta .i { color: #4a5568; font-size: 8pt; line-height: 1.38; }
.gantt { width: 100%; font-size: 8pt; }
.g-fila { display: grid; grid-template-columns: 40mm 1fr; align-items: center; gap: 8px; margin: 4px 0; }
.g-pista { position: relative; height: 16px; background: repeating-linear-gradient(90deg, #f2f4f7 0, #f2f4f7 calc(100%/18 - 1px), #fff calc(100%/18 - 1px), #fff calc(100%/18)); border-radius: 3px; }
.g-barra { position: absolute; top: 0; height: 16px; border-radius: 3px; background: #0f8a76; color: #fff; font-size: 7.4pt;
           padding: 0 5px; line-height: 16px; white-space: nowrap; overflow: hidden; }
.g-barra.urg { background: #c8372d; } .g-barra.cont { background: repeating-linear-gradient(45deg, #8fd0c0 0 6px, #bfe3da 6px 12px); color: #08574b; }
.g-eje { display: grid; grid-template-columns: 40mm 1fr; gap: 8px; color: #667085; font-size: 7.2pt; }
.g-eje .marcas { display: flex; justify-content: space-between; }
.barra-h { display: grid; grid-template-columns: 34mm 1fr 10mm; gap: 6px; align-items: center; margin: 3px 0; font-size: 8.2pt; }
.barra-h .pista { height: 12px; background: #f2f4f7; border-radius: 3px; overflow: hidden; display: flex; }
.barra-h .v { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.seg { height: 100%; }
.s-ok { background: #0f8a76; } .s-mid { background: #e0a24a; } .s-bad { background: #e0645a; } .s-blue { background: #5b7fe0; }
.leyenda { display: flex; gap: 12px; font-size: 7.8pt; color: #4a5568; margin-top: 6px; }
.leyenda i { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; }
.precio { border: 1px solid #e4e7ec; border-radius: 8px; padding: 8px 10px; text-align: left; }
.precio.destacado { border: 1.5px solid #0b6e5f; background: #f1f8f6; }
.precio .k { font-size: 7.8pt; color: #667085; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
.precio .p { font-size: 15pt; font-weight: 700; color: #0c1220; margin: 2px 0; }
.precio .p small { font-size: 8pt; color: #667085; font-weight: 500; }
.precio ul { padding-left: 14px; margin: 4px 0 0; font-size: 7.9pt; color: #323c4e; }
.escalera { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; align-items: end; }
.peldano { border-radius: 8px 8px 0 0; padding: 8px 8px; color: #fff; font-size: 7.8pt; line-height: 1.35; }
.peldano b { display: block; font-size: 9.6pt; margin-bottom: 3px; }
.alerta { border: 1.5px solid #c8372d; background: #fef4f3; border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; color: #8c261f; break-inside: avoid; }
.alerta b { color: #a92e25; }

/* Apertura de capítulo */
.capitulo { break-before: page; }
.apertura { background: #0c1220; color: #fff; border-radius: 12px; padding: 18px 20px 16px; margin-bottom: 14px;
            position: relative; overflow: hidden; }
.apertura::after { content: ""; position: absolute; right: -30px; top: -30px; width: 140px; height: 140px; border-radius: 50%;
                   background: radial-gradient(circle, rgba(58,168,146,.55), rgba(58,168,146,0) 70%); }
.apertura .kicker { color: #8fd0c0; font-size: 9pt; font-weight: 700; }
.apertura h1 { font-size: 21pt; margin: 4px 0 8px; color: #fff; }
.apertura .idea { color: #d0d5dd; font-size: 10pt; max-width: 150mm; }
.apertura .tareachip { display: inline-block; margin-top: 10px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
                       border-radius: 14px; padding: 3px 10px; font-size: 8pt; color: #e4e7ec; }
.anexo table { font-size: 7.6pt; }
"""

CSS_RESUMEN = """
body { font-size: 9.8pt; }
.apertura { padding: 14px 18px 12px; margin-bottom: 10px; }
.apertura h1 { font-size: 19pt; }
h2 { font-size: 12pt; margin: 14px 0 6px; padding: 4px 0 4px 10px; }
"""

PILLS = {
    "Cubierta": "p-ok", "Parcial": "p-mid", "Falta": "p-bad", "Alta": "p-bad", "Media": "p-mid", "Baja": "p-ok",
    "Pendiente": "p-neutral", "Propuesta en doc 09": "p-info", "Ninguno": "p-ok", "Ninguno tras el cambio": "p-ok",
    "Bajo": "p-ok", "Medio": "p-mid", "Bajo con defensa": "p-ok", "Bajo en eventos, medio online": "p-mid",
    "Sí": "p-ok", "No": "p-neutral", "Incluido": "p-ok", "Gratis": "p-ok",
}


def md_a_html(texto):
    # El título H1 de cada .md lo sustituye la apertura del capítulo.
    lineas = texto.splitlines()
    if lineas and lineas[0].startswith("# "):
        lineas = lineas[1:]
    texto = "\n".join(lineas)
    # python-markdown necesita línea en blanco antes de una lista.
    texto = re.sub(r"(?m)^([^\n\-\d|>].*)\n(- |\d+\. )", r"\1\n\n\2", texto)
    h = markdown.markdown(texto, extensions=["tables", "fenced_code", "sane_lists"])
    # Casillas de decisión
    h = re.sub(r"<li>\s*\[ \]\s*", '<li class="check"><span class="box"></span>', h)
    h = re.sub(r"<li>\s*\[x\]\s*", '<li class="check"><span class="box">&#10003;</span>', h)
    # Enlaces entre documentos → anclas internas
    for f, a in ANCLA.items():
        h = h.replace(f'href="{f}"', f'href="#{a}"')
    # Píldoras de estado en celdas
    def pill(m):
        bruto = m.group(1)
        txt = re.sub(r"</?strong>", "", bruto).strip()
        if txt in PILLS:
            return f'<td><span class="pill {PILLS[txt]}">{txt}</span></td>'
        return m.group(0)
    h = re.sub(r"<td>(.*?)</td>", pill, h)
    # Párrafo de «Tarea(s) de la reunión»
    h = re.sub(r"<p>(Tareas? de la reunión:.*?)</p>", r'<div class="tarea"><p>\1</p></div>', h, count=1, flags=re.S)
    # Recuadro para las secciones de decisiones
    partes = re.split(r"(?=<h2>)", h)
    for i, p in enumerate(partes):
        if p.startswith("<h2>") and ("Decisiones" in p[:120] or "Decidir" in p[:40]):
            partes[i] = f'<div class="decide">{p}</div>'
    return "".join(partes)


def portada():
    logo = open(LOGO, encoding="utf-8").read()
    logo = re.sub(r"<title>.*?</title>", "", logo, flags=re.S)
    return f"""
<section class="portada">
  <div class="marca">{logo}</div>
  <div class="centro">
    <div class="kicker">Documento de trabajo · Equipo TalentPact</div>
    <h1>Plan tras la reunión</h1>
    <div class="sub">Cómo enfocar cada tarea acordada: taxonomía, rama IA, blockchain de pago, precios, corrector,
    hard y soft skills, datos, antitrampas, ejercicios y confianza para empresas.</div>
    <div class="franja"></div>
    <div class="datos">
      <div class="dato"><b>10</b><span>tareas de la reunión, una por capítulo</span></div>
      <div class="dato"><b>309</b><span>ejercicios inventariados</span></div>
      <div class="dato"><b>32 + 24</b><span>competencias soft e IA</span></div>
      <div class="dato"><b>8</b><span>decisiones clave pendientes</span></div>
    </div>
  </div>
  <div class="pie">{"Versión completa" if COMPLETO else "Versión resumida"} · 18 de octubre de 2026 · Para Xagri e Iván Sánchez · Propuestas pendientes de aprobación: ninguna cifra canónica cambia hasta decidirlo.<br>
  Fuente: <code>docs/plan_post_reunion/*.md</code> · Generado con <code>tools/generar_plan_pdf.py</code></div>
</section>"""


def indice(paginas):
    filas = []
    for f, n, t, idea, _ in CAPITULOS:
        if not COMPLETO and n == "A":
            continue
        pg = paginas.get(n, "")
        filas.append(f'<a class="fila" href="#{ANCLA[f]}"><div class="n">{n}</div>'
                     f'<div><div class="t">{html.escape(t)}</div><div class="i">{html.escape(idea)}</div></div>'
                     f'<div class="pg">{pg}</div></a>')
    filas.insert(0, f'<a class="fila" href="#resumen"><div class="n">—</div><div><div class="t">Resumen visual</div>'
                    f'<div class="i">Hoja de ruta, precios, cobertura de competencias, catálogo e integridad de un vistazo.</div></div>'
                    f'<div class="pg">{paginas.get("R", "")}</div></a>')
    return f"""<section class="indice"><h1>Índice</h1>
<div class="intro">{"Cada capítulo es uno de los documentos Markdown de la carpeta, con el mismo contenido." if COMPLETO else "Lo general de cada concepto, en una o dos páginas. El detalle completo está en cada documento de docs/plan_post_reunion/."} Las decisiones para el equipo van en recuadro verde con casillas para marcar.</div>
{''.join(filas)}</section>"""


def barra(etq, valores, total, clases):
    segs = "".join(f'<div class="seg {c}" style="width:{v / total * 100:.2f}%"></div>' for v, c in zip(valores, clases))
    return f'<div class="barra-h"><div>{etq}</div><div class="pista">{segs}</div><div class="v">{sum(valores)}</div></div>'


def resumen_visual():
    # Hoja de ruta (doc 00 §4): fase, inicio (semana), duración, clase
    fases = [("0 · Arreglar", 0, 1, "urg"), ("1 · Vocabulario", 1, 2, ""), ("2 · Medir", 3, 2, ""),
             ("3 · Catálogo", 5, 3, ""), ("4 · Confianza", 8, 2, ""), ("5 · Ingresos", 10, 2, ""),
             ("6 · Rama IA", 12, 4, ""), ("7 · Escalar", 16, 2, "cont")]
    total = 18
    gantt = "".join(
        f'<div class="g-fila"><div>{n}</div><div class="g-pista"><div class="g-barra {c}" '
        f'style="left:{s / total * 100:.2f}%;width:{d / total * 100:.2f}%">{"continuo" if c == "cont" else (f"{d} sem." if d > 1 else "1")}</div></div></div>'
        for n, s, d, c in fases)
    marcas = "".join(f"<span>{i}</span>" for i in range(0, 19, 2))

    # Cobertura de competencias por dimensión (doc 06 §2.1): cubiertas, parciales, sin reto
    dims = [("01 Estrategia y criterio", 3, 1, 1), ("02 Ejecución", 1, 1, 3), ("03 Liderazgo", 0, 4, 1),
            ("04 Influencia y relaciones", 2, 2, 2), ("05 Transformación", 2, 1, 3), ("06 Autoliderazgo", 0, 1, 4)]
    cob = "".join(barra(d, [c, p, f], c + p + f, ["s-ok", "s-mid", "s-bad"]) for d, c, p, f in dims)
    cob_total = barra("<b>Total (32)</b>", [8, 10, 14], 32, ["s-ok", "s-mid", "s-bad"])

    # Catálogo (doc 09 y 09b)
    tipos = [("Redacción", 124), ("Clasificación", 95), ("Análisis", 88), ("Secuencias", 1), ("Audio", 1)]
    tip = "".join(barra(t, [v], 124, ["s-blue"]) for t, v in tipos)
    areas = [("Tecnología", 28), ("Marketing, ventas y com.", 22), ("Operaciones", 15), ("Soft y transferibles", 14),
             ("Finanzas", 6), ("Recursos humanos", 5), ("Jurídica y cumplimiento", 5), ("Idiomas", 4),
             ("Se reparten en soft", 2), ("Rama IA", 1), ("Sostenibilidad", 1)]
    are = "".join(barra(t, [v], 28, ["s-ok"]) for t, v in areas)

    tarjetas = "".join(
        f'<div class="tarjeta"><div class="n">CAPÍTULO {n}</div><div class="t">{html.escape(t)}</div><div class="i">{html.escape(idea)}</div></div>'
        for f, n, t, idea, _ in CAPITULOS[1:11])

    return f"""
<section class="visual" id="resumen">
<h1>Resumen visual</h1>
<div class="intro">Lo esencial de los diez documentos en una vista. Todas las cifras salen de los capítulos y del catálogo real.</div>

<div class="alerta"><b>Hallazgo grave.</b> Los enunciados de los retos y las soluciones de las clasificaciones viajan en el código público de la web
(<code>07-retos-comunes.js</code>): se pueden leer sin empezar el reto y sacar un 100 en una clasificación. Es la fase 0 del plan (capítulo 08).</div>

<div class="panel"><h3>Hoja de ruta (semanas)</h3>
<div class="gantt">{gantt}<div class="g-eje"><div></div><div class="marcas">{marcas}</div></div></div>
<div class="nota">Por dependencias: lo que desbloquea a lo demás va primero. Cada fase con tests en verde, changelog y commit solo con aprobación.</div></div>

<div class="grid3">{tarjetas}</div>
</section>

<section class="visual">
<div class="panel"><h3>Precios propuestos (capítulos 02, 03 y 04)</h3>
<div class="grid3">
  <div class="precio"><div class="k">Candidato · Gratis</div><div class="p">0 €</div>
    <ul><li>Perfil, pool anónimo y postulaciones</li><li>Catálogo completo</li><li>1 intento oficial por reto cada 30 días</li><li>Feedback por criterio y SkillPass firmado</li></ul></div>
  <div class="precio destacado"><div class="k">Candidato · Plus</div><div class="p">6,99 € <small>/mes</small> · 49 € <small>/año</small></div>
    <ul><li>Modo práctica ilimitado</li><li>Plan de práctica y comparación de intentos</li><li>Estadísticas del pool e informe PDF</li><li>Sello público incluido</li></ul></div>
  <div class="precio"><div class="k">Candidato · Sueltos</div><div class="p">desde 4,99 €</div>
    <ul><li>Sello público: 4,99 €</li><li>Revisión humana: 9,99 €</li><li>Pack de práctica (5): 4,99 €</li><li>Certificación IA: 39 €</li></ul></div>
  <div class="precio"><div class="k">Empresa · Por uso</div><div class="p">49 € <small>/contacto</small></div>
    <ul><li>Perfil IA certificado: 89 €</li><li>Garantía de respuesta en 7 días</li><li>Verificar credenciales: gratis</li></ul></div>
  <div class="precio"><div class="k">Empresa · Planes</div><div class="p">199 / 499 € <small>/mes</small></div>
    <ul><li>Pro: 5 contactos, ofertas ilimitadas, verificación por lotes</li><li>Enterprise: API, ATS, SSO</li><li>Reto a medida: 299 € (IA: 499 €)</li></ul></div>
  <div class="precio destacado"><div class="k">Empresa · Prueba</div><div class="p">0 € <small>30 días</small></div>
    <ul><li>1 oferta y pool completo</li><li>2 desbloqueos gratis</li><li>«Haz el reto tú» con 3 personas de su equipo</li><li>Sin tarjeta</li></ul></div>
</div>
<div class="nota">Regla fija: pagar nunca cambia una nota, un ranking ni el encaje. Son propuestas: las cifras canónicas no cambian hasta aprobarlas.</div></div>

<div class="panel"><h3>Niveles de integridad (capítulo 08)</h3>
<div class="escalera">
  <div class="peldano" style="background:#98a2b3;height:26mm"><b>Práctica</b>Sin medidas. No cuenta para el pool.</div>
  <div class="peldano" style="background:#0f8a76;height:36mm"><b>Estándar</b>Intento de servidor, variantes, reloj de servidor, antipegado, pestañas, patrón de escritura, marca de agua.</div>
  <div class="peldano" style="background:#0b6e5f;height:46mm"><b>Supervisado</b>+ cámara (presencia, 2.ª persona, móvil), pantalla completa, 2.º monitor, defensa de 2 preguntas.</div>
  <div class="peldano" style="background:#08574b;height:56mm"><b>Alto</b>+ escaneo de sala, móvil como 2.ª cámara, voz, pantalla compartida, identidad con consentimiento. Eventos Impact.</div>
</div>
<div class="nota">La integridad nunca descarta sola: riesgo alto = revisión humana. Nunca se infieren emociones.</div></div>
<div class="grid2">
<div class="panel"><h3>Competencias del diccionario: cobertura actual</h3>{cob}{cob_total}
<div class="leyenda"><span><i class="s-ok"></i>Cubierta (8)</span><span><i class="s-mid"></i>Parcial (10)</span><span><i class="s-bad"></i>Sin reto (14)</span></div>
<div class="nota">Capítulo 06, §2.1.</div></div>
<div class="panel"><h3>Blockchain: qué es gratis y qué se paga</h3>
<table><thead><tr><th></th><th>Firmado</th><th>Sellado</th></tr></thead><tbody>
<tr><td>Precio</td><td><span class="pill p-ok">Gratis</span></td><td>4,99 € o en Plus</td></tr>
<tr><td>Lo verifica</td><td>Cualquiera, en talentpact.es</td><td>Cualquiera, incluso sin TalentPact</td></tr>
<tr><td>Demuestra</td><td>Autenticidad e integridad</td><td>Además, fecha e inmutabilidad públicas</td></tr>
<tr><td>Caduca / revocable</td><td>12 meses · sí</td><td>12 meses · sí</td></tr>
<tr><td>Coste para nosotros</td><td>Nulo</td><td>Céntimos al día (lote Merkle)</td></tr>
</tbody></table>
<div class="nota">Capítulo 03.</div></div>
</div>

<div class="grid2">
<div class="panel"><h3>Catálogo: ejercicios por tipo (309)</h3>{tip}
<div class="nota">El 40 % son correos: el capítulo 06 propone simulación conversacional, bandeja de entrada y caso con giro.</div></div>
<div class="panel"><h3>Catálogo: retos por área (103)</h3>{are}
<div class="nota">Áreas funcionales de la versión resumida (capítulo 01); inventario en el anexo.</div></div>
</div>

</section>"""


def secciones_resumen():
    """Trocea resumen_general.md por «## NN · Título»; devuelve {NN: markdown con ### subido a ##}."""
    texto = open(RESUMEN, encoding="utf-8").read()
    trozos = re.split(r"(?m)^## (\d\d) · .*$", texto)
    out = {}
    for i in range(1, len(trozos), 2):
        out[trozos[i]] = re.sub(r"(?m)^### ", "## ", trozos[i + 1].strip())
    return out


def construir(paginas):
    capitulos = []
    resumen = None if COMPLETO else secciones_resumen()
    for f, n, t, idea, tarea in CAPITULOS:
        if resumen is not None:
            if n not in resumen:
                continue
            cuerpo = md_a_html(resumen[n])
        else:
            cuerpo = md_a_html(open(os.path.join(CARPETA, f), encoding="utf-8").read())
        kicker = "Anexo de trabajo" if n == "A" else f"Capítulo {n} de 10"
        clase = "capitulo anexo" if n == "A" else "capitulo"
        capitulos.append(f"""<section class="{clase}" id="{ANCLA[f]}">
<div class="apertura"><div class="kicker">{kicker}</div><h1>{html.escape(t)}</h1>
<div class="idea">{html.escape(idea)}</div><div class="tareachip">Tarea de la reunión: {html.escape(tarea)}</div></div>
{cuerpo}</section>""")
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>TalentPact · Plan tras la reunión</title>
<style>{CSS}{"" if COMPLETO else CSS_RESUMEN}</style></head><body>{portada()}{indice(paginas)}{resumen_visual()}{''.join(capitulos)}</body></html>"""


def imprimir(html_txt, tmp, nombre):
    ruta_html = os.path.join(tmp, nombre + ".html")
    ruta_pdf = os.path.join(tmp, nombre + ".pdf")
    with open(ruta_html, "w", encoding="utf-8") as fh:
        fh.write(html_txt)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header",
                    f"--print-to-pdf={ruta_pdf}", "file://" + ruta_html],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    return ruta_pdf


def localizar(ruta_pdf):
    """Página (1-based) donde empieza cada capítulo y el resumen visual."""
    paginas = {}
    for i, pag in enumerate(PdfReader(ruta_pdf).pages, start=1):
        txt = re.sub(r"\s+", " ", pag.extract_text() or "")
        for _, n, *_ in CAPITULOS:
            marca = "Anexo de trabajo" if n == "A" else f"Capítulo {n} de 10"
            if n not in paginas and marca in txt and "Índice" not in txt:
                paginas[n] = i
        if "R" not in paginas and "Resumen visual" in txt and "Índice" not in txt:
            paginas["R"] = i
    return paginas


def numerar(ruta_pdf, destino):
    lector = PdfReader(ruta_pdf)
    escritor = PdfWriter()
    total = len(lector.pages)
    for i, pag in enumerate(lector.pages, start=1):
        if i > 1:
            buf = BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.setFont("Helvetica", 7.5)
            c.setFillColorRGB(0.4, 0.44, 0.52)
            c.drawString(16 * 2.8346, 9 * 2.8346, "TalentPact · Plan tras la reunión · 18/10/2026")
            c.drawRightString(A4[0] - 16 * 2.8346, 9 * 2.8346, f"{i} / {total}")
            c.save()
            buf.seek(0)
            pag.merge_page(PdfReader(buf).pages[0])
        escritor.add_page(pag)
    escritor.add_metadata({"/Title": "TalentPact · Plan tras la reunión", "/Author": "TalentPact",
                           "/Subject": "Enfoque de las tareas acordadas en la reunión (18/10/2026)"})
    with open(destino, "wb") as fh:
        escritor.write(fh)
    return total


def main():
    if not os.path.exists(CHROME):
        sys.exit("No se encuentra Google Chrome en " + CHROME)
    with tempfile.TemporaryDirectory() as tmp:
        borrador = imprimir(construir({}), tmp, "pasada1")
        paginas = localizar(borrador)
        final = imprimir(construir(paginas), tmp, "pasada2")
        if localizar(final) != paginas:
            print("Aviso: el índice ha movido páginas; revisar.", file=sys.stderr)
        total = numerar(final, SALIDA)
    print(f"{SALIDA} · {total} páginas · capítulos: {paginas}")


if __name__ == "__main__":
    main()
