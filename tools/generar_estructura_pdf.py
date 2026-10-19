# Genera los PDF estructurales (no técnicos) del plan a partir de su .md en docs/plan_post_reunion/.
# Uso: python3 tools/generar_estructura_pdf.py            → TalentPact_Estructura_plataforma.pdf
#      python3 tools/generar_estructura_pdf.py skills     → TalentPact_Skills_en_la_plataforma.pdf
# Los bloques ```flujo, ```mapa, ```arbol, ```tarjetas, ```escalera, ```buscador, ```perfil, ```requisitos
# y ```encaje del .md se dibujan como diagramas o bocetos de pantalla;
# el resto del texto sale tal cual. Reutiliza estilos, impresión con Chrome y numeración de generar_plan_pdf.py.
import html
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generar_plan_pdf as base  # noqa: E402

DOCUMENTOS = {
    "estructura": {
        "fuente": "estructura_plataforma.md", "salida": "TalentPact_Estructura_plataforma.pdf",
        "titulo": "Cómo estructurar la plataforma",
        "sub": "Quién la usa, qué secciones tiene, cómo se ordena la información, los recorridos de candidato y empresa, "
               "la rama de IA, la confianza y qué es gratis y qué de pago.",
        "datos": [("4", "zonas de la plataforma"), ("3", "pilares de skills"), ("7 · 12", "áreas funcionales y sectores"),
                  ("7", "pasos para construirla")],
        "intro": "La plataforma de arriba abajo: primero qué es y cómo se organiza, después cómo la recorren el candidato "
                 "y la empresa, y al final el orden para construirla.",
    },
    "skills": {
        "fuente": "skills_en_la_plataforma.md", "salida": "TalentPact_Skills_en_la_plataforma.pdf",
        "titulo": "Hard y soft skills en la plataforma",
        "sub": "Qué pedimos a los candidatos, cómo lo exigen las empresas y cómo lo mostramos en TalentPact.",
        "datos": [("3", "pilares: soft, transferibles y hard"), ("3", "grados: declarada, demostrada y verificada"),
                  ("4", "bandas en vez de una nota exacta"), ("8", "skills como máximo por oferta")],
        "intro": "Del candidato a la empresa: qué se pide, cómo se exige en una oferta y cómo se enseña en cada pantalla.",
    },
}
DOC = DOCUMENTOS[sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in DOCUMENTOS else "estructura"]
FUENTE = os.path.join(base.CARPETA, DOC["fuente"])
SALIDA = os.path.join(base.CARPETA, DOC["salida"])
FECHA = "19/10/2026"

CSS_EXTRA = """
body { font-size: 9.8pt; }
.apertura { padding: 14px 18px 12px; margin-bottom: 12px; }
.apertura h1 { font-size: 20pt; }
h2 { font-size: 12pt; margin: 14px 0 6px; padding: 4px 0 4px 10px; }
/* Flujo horizontal */
.flujo { display: flex; gap: 0; margin: 10px 0 12px; break-inside: avoid; }
.flujo .paso { flex: 1; background: #f1f8f6; border: 1px solid #bfe3da; border-radius: 8px; padding: 9px 10px; position: relative; }
.flujo .flecha { width: 18px; display: flex; align-items: center; justify-content: center; color: #0f8a76; font-size: 14pt; font-weight: 700; }
.flujo .paso b { display: block; color: #08574b; font-size: 10pt; margin-bottom: 3px; }
.flujo .paso span { color: #323c4e; font-size: 8.4pt; line-height: 1.38; display: block; }
.flujo .paso:first-child { background: #0b6e5f; border-color: #0b6e5f; }
.flujo .paso:first-child b, .flujo .paso:first-child span { color: #fff; }
/* Flujo vertical (más de 4 pasos) */
.linea { margin: 10px 0 12px; break-inside: avoid; position: relative; }
.linea .p { display: grid; grid-template-columns: 26px 44mm 1fr; gap: 10px; align-items: center; padding: 5px 0; position: relative; }
.linea .p::before { content: ""; position: absolute; left: 12px; top: 0; bottom: 0; width: 2px; background: #bfe3da; z-index: 0; }
.linea .p:first-child::before { top: 50%; } .linea .p:last-child::before { bottom: 50%; }
.linea .n { width: 26px; height: 26px; border-radius: 50%; background: #0b6e5f; color: #fff; font-weight: 700; font-size: 9pt;
            display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
.linea .t { font-weight: 650; color: #0c1220; }
.linea .d { color: #4a5568; font-size: 8.8pt; background: #f9fafb; border: 1px solid #e4e7ec; border-radius: 6px; padding: 5px 9px; }
/* Tarjetas */
.tarjetas { display: grid; gap: 8px; margin: 10px 0 12px; }
.tarjetas.c2 { grid-template-columns: 1fr 1fr; } .tarjetas.c3 { grid-template-columns: repeat(3, 1fr); }
.tarjetas .tj { border: 1px solid #e4e7ec; border-top: 3px solid #0f8a76; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
.tarjetas .tj b { display: block; font-size: 9.8pt; margin-bottom: 3px; }
.tarjetas .tj span { color: #4a5568; font-size: 8.4pt; line-height: 1.4; display: block; }
/* Mapa */
.mapa { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0 12px; }
.mapa .zona { border: 1px solid #e4e7ec; border-radius: 10px; overflow: hidden; break-inside: avoid; }
.mapa .zona h4 { margin: 0; padding: 8px 10px; color: #fff; font-size: 10pt; }
.mapa .zona:nth-child(1) h4 { background: #4a5568; } .mapa .zona:nth-child(2) h4 { background: #0f8a76; }
.mapa .zona:nth-child(3) h4 { background: #2f5bd3; } .mapa .zona:nth-child(4) h4 { background: #8a4d07; }
.mapa .it { padding: 6px 10px; border-top: 1px solid #f2f4f7; font-size: 8.6pt; }
.mapa .it b { display: block; font-weight: 600; }
.mapa .it span { color: #667085; font-size: 7.8pt; }
/* Buscador (boceto tipo LinkedIn Recruiter) */
.buscador { border: 1px solid #d0d5dd; border-radius: 10px; overflow: hidden; margin: 10px 0 12px; break-inside: avoid; font-size: 8pt; }
.bbarra { background: #0c1220; color: #fff; padding: 7px 12px; display: flex; align-items: center; gap: 10px; }
.bbarra b { font-size: 9.6pt; }
.bcont { background: #0f8a76; border-radius: 10px; padding: 1px 8px; font-weight: 600; font-size: 8pt; }
.bej { color: #98a2b3; font-size: 7pt; margin-left: auto; }
.bcuerpo { display: grid; grid-template-columns: 52mm 1fr; }
.bcol { background: #f9fafb; border-right: 1px solid #e4e7ec; padding: 6px 10px; }
.bcol-t { font-weight: 700; color: #08574b; font-size: 8.6pt; margin: 2px 0 4px; }
.bcol .bf { padding: 4px 0; border-bottom: 1px solid #e4e7ec; }
.bf b { display: block; font-weight: 600; color: #0c1220; font-size: 8.2pt; }
.bf span { color: #667085; font-size: 7.2pt; line-height: 1.3; display: block; }
.bder { padding: 6px 10px; }
.bgrupo { margin-bottom: 6px; }
.bg-t { font-weight: 700; font-size: 8.8pt; color: #0c1220; margin: 2px 0 4px; }
.bg-items { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e4e7ec; border-radius: 4px; }
.bg-items .bf { padding: 4px 8px; border-bottom: 1px solid #e4e7ec; border-right: 1px solid #e4e7ec; }
/* Perfil de skills */
.perfil { border: 1px solid #d0d5dd; border-radius: 10px; padding: 6px 12px 8px; margin: 10px 0 12px; break-inside: avoid; }
.pf-t { font-weight: 700; color: #08574b; font-size: 9pt; margin: 6px 0 2px; padding-bottom: 3px; border-bottom: 1px solid #e4e7ec; }
.pf-f { display: grid; grid-template-columns: 50mm 44mm 24mm 1fr; gap: 8px; align-items: center; padding: 4px 0; border-bottom: 1px solid #f2f4f7; font-size: 8.4pt; }
.pf-d { color: #667085; font-size: 7.8pt; }
.banda { display: inline-flex; align-items: center; gap: 2px; }
.banda i { display: inline-block; width: 16px; height: 7px; border-radius: 2px; background: #e4e7ec; }
.banda i.on.b0 { background: #e0645a; } .banda i.on.b1 { background: #e0a24a; } .banda i.on.b2 { background: #3aa892; } .banda i.on.b3 { background: #0b6e5f; }
.banda em { font-style: normal; font-size: 7.8pt; color: #323c4e; margin-left: 5px; font-weight: 600; }
.sinb { color: #98a2b3; font-size: 7.8pt; font-style: italic; }
.grado { display: inline-block; border-radius: 10px; padding: 1px 7px; font-size: 7.2pt; font-weight: 600; text-align: center; }
.g-dec { background: #f2f4f7; color: #4a5568; border: 1px dashed #98a2b3; }
.g-dem { background: #dcefea; color: #08574b; }
.g-ver { background: #0b6e5f; color: #fff; }
/* Requisitos de la oferta */
.requisitos { border: 1px solid #d0d5dd; border-radius: 10px; overflow: hidden; margin: 10px 0 12px; break-inside: avoid; }
.rq-cab { background: #0c1220; color: #fff; padding: 6px 12px; font-weight: 700; font-size: 9pt; }
.rq-f { display: grid; grid-template-columns: 26mm 52mm 26mm 1fr; gap: 8px; align-items: center; padding: 5px 12px; border-top: 1px solid #f2f4f7; font-size: 8.4pt; }
.rq-tipo { border-radius: 10px; padding: 1px 8px; font-size: 7.4pt; font-weight: 700; text-align: center; }
.rq-tipo.imp { background: #0b6e5f; color: #fff; } .rq-tipo.val { background: #e8eefc; color: #1f3f99; }
.rq-p { color: #667085; font-size: 7.8pt; } .rq-b { font-size: 7.8pt; color: #667085; }
/* Encaje */
.encaje { border: 1px solid #d0d5dd; border-radius: 10px; padding: 4px 12px; margin: 10px 0 12px; break-inside: avoid; }
.en-f { display: grid; grid-template-columns: 18px 50mm 1fr; gap: 8px; align-items: center; padding: 5px 0; border-bottom: 1px solid #f2f4f7; font-size: 8.4pt; }
.en-f:last-child { border-bottom: 0; }
.en-m { width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 8pt; color: #fff; }
.e-ok .en-m { background: #0f8a76; } .e-bajo .en-m { background: #c2700b; } .e-falta .en-m { background: #98a2b3; }
.en-f span:last-child { color: #4a5568; }
/* Árbol */
.arbol { margin: 10px 0 12px; break-inside: avoid; }
.arbol .nodo { position: relative; border: 1px solid #bfe3da; background: #f1f8f6; border-radius: 8px; padding: 6px 10px; margin: 6px 0; }
.arbol .nodo b { color: #08574b; } .arbol .nodo span { color: #323c4e; font-size: 8.6pt; }
.arbol .nodo::before { content: ""; position: absolute; left: -12px; top: 50%; width: 12px; border-top: 2px solid #8fd0c0; }
.arbol .nodo.raiz::before { display: none; }
.arbol .nodo.raiz { background: #0b6e5f; border-color: #0b6e5f; } .arbol .nodo.raiz b, .arbol .nodo.raiz span { color: #fff; }
.arbol .ejes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.arbol .ejes .nodo { margin: 0 0 4px; }
.arbol .ejes .nodo::before { display: none; }
.arbol .nodo span { display: block; }
.arbol .hermano { background: #fffaf0; border-color: #f8dca8; } .arbol .hermano b { color: #8a4d07; }
"""


def b_flujo(lineas):
    pasos = [l.split("|", 1) for l in lineas]
    if len(pasos) <= 4:
        partes = []
        for i, (t, d) in enumerate(pasos):
            if i:
                partes.append('<div class="flecha">&#8250;</div>')
            partes.append(f'<div class="paso"><b>{html.escape(t.strip())}</b><span>{html.escape(d.strip())}</span></div>')
        return f'<div class="flujo">{"".join(partes)}</div>'
    filas = []
    for i, (t, d) in enumerate(pasos, start=1):
        t = t.strip()
        m = re.match(r"^(\d+)\s*·\s*(.*)$", t)
        num, tit = (m.group(1), m.group(2)) if m else (str(i), t)
        filas.append(f'<div class="p"><div class="n">{num}</div><div class="t">{html.escape(tit)}</div>'
                     f'<div class="d">{html.escape(d.strip())}</div></div>')
    return f'<div class="linea">{"".join(filas)}</div>'


def b_tarjetas(lineas):
    cols = "c2" if len(lineas) in (2, 4) else "c3"
    tj = "".join(f'<div class="tj"><b>{html.escape(t.strip())}</b><span>{html.escape(d.strip())}</span></div>'
                 for t, d in (l.split("|", 1) for l in lineas))
    return f'<div class="tarjetas {cols}">{tj}</div>'


def b_mapa(lineas):
    zonas, actual = [], None
    for l in lineas:
        if l.startswith("# "):
            actual = [l[2:].strip(), []]
            zonas.append(actual)
        elif actual:
            t, _, d = l.partition(" — ")
            actual[1].append((t.strip(), d.strip()))
    out = []
    for nombre, items in zonas:
        its = "".join(f'<div class="it"><b>{html.escape(t)}</b>{f"<span>{html.escape(d)}</span>" if d else ""}</div>' for t, d in items)
        out.append(f'<div class="zona"><h4>{html.escape(nombre)}</h4>{its}</div>')
    return f'<div class="mapa">{"".join(out)}</div>'


def b_arbol(lineas):
    """Los nodos de nivel 0 son ejes paralelos (sector y área); el resto cuelga del último eje."""
    ejes, hijos = [], []
    for l in lineas:
        nivel = (len(l) - len(l.lstrip(" "))) // 2
        t, _, d = l.strip().partition(" — ")
        (ejes if nivel == 0 else hijos).append((nivel, t, d))
    def nodo(clase, t, d, sangria=0):
        estilo = f' style="margin-left:{sangria}mm"' if sangria else ""
        return (f'<div class="nodo {clase}"{estilo}><b>{html.escape(t)}</b>'
                f'{f"<span>{html.escape(d)}</span>" if d else ""}</div>')
    fila = "".join(nodo("raiz" if i == len(ejes) - 1 else "hermano", t, d) for i, (_, t, d) in enumerate(ejes))
    resto = "".join(nodo("", t, d, n * 12) for n, t, d in hijos)
    return f'<div class="arbol"><div class="ejes">{fila}</div>{resto}</div>'


def b_escalera(lineas):
    # De menos a más: gris → verde oscuro, y cada peldaño más alto.
    if len(lineas) == 3:
        colores, alturas = ["#98a2b3", "#0f8a76", "#08574b"], [24, 36, 48]
    else:
        colores, alturas = ["#98a2b3", "#0f8a76", "#0b6e5f", "#08574b"], [24, 34, 44, 54]
    pel = "".join(f'<div class="peldano" style="background:{colores[i % 4]};height:{alturas[i % 4]}mm"><b>{html.escape(t.strip())}</b>{html.escape(d.strip())}</div>'
                  for i, (t, d) in enumerate(l.split("|", 1) for l in lineas))
    cols = f' style="grid-template-columns:repeat({len(lineas)},1fr)"' if len(lineas) != 4 else ""
    return f'<div class="escalera"{cols}>{pel}</div>'


def b_buscador(lineas):
    """Boceto del buscador: «< Sección» va en la columna fija; «> Sección» son grupos plegables a la derecha."""
    izquierda, derecha, actual = [], [], None
    for l in lineas:
        if l[:2] in ("< ", "> "):
            actual = [l[2:].strip(), []]
            (izquierda if l[0] == "<" else derecha).append(actual)
        elif actual:
            t, _, d = l.partition("|")
            actual[1].append((t.strip(), d.strip()))
    def item(t, d):
        return f'<div class="bf"><b>+ {html.escape(t)}</b>{f"<span>{html.escape(d)}</span>" if d else ""}</div>'
    col = "".join(f'<div class="bcol-t">{html.escape(n)}</div>{"".join(item(t, d) for t, d in its)}' for n, its in izquierda)
    grupos = "".join(f'<div class="bgrupo"><div class="bg-t">&#8963; {html.escape(n)}</div><div class="bg-items">{"".join(item(t, d) for t, d in its)}</div></div>'
                     for n, its in derecha)
    return (f'<div class="buscador"><div class="bbarra"><b>Búsqueda avanzada de candidatos</b>'
            f'<span class="bcont">37 candidatos encajan</span><span class="bej">cifra de ejemplo del boceto</span></div>'
            f'<div class="bcuerpo"><div class="bcol">{col}</div><div class="bder">{grupos}</div></div></div>')


BANDAS = ["Insuficiente", "Aceptable", "Bueno", "Muy bueno"]


def banda_html(banda):
    """Cuatro segmentos; se rellenan hasta la banda indicada."""
    if banda not in BANDAS:
        return f'<span class="sinb">{html.escape(banda)}</span>'
    k = BANDAS.index(banda)
    segs = "".join(f'<i class="{"on" if j <= k else ""} b{k}"></i>' for j in range(4))
    return f'<span class="banda">{segs}<em>{html.escape(banda)}</em></span>'


GRADOS = {"Declarada": "g-dec", "Demostrada": "g-dem", "Verificada": "g-ver"}


def b_perfil(lineas):
    """Boceto de perfil de skills: «# Bloque» y filas «skill | banda | grado | detalle»."""
    out, cab = [], None
    for l in lineas:
        if l.startswith("# "):
            out.append(f'<div class="pf-t">{html.escape(l[2:].strip())}</div>')
            continue
        c = [x.strip() for x in l.split("|")] + ["", "", ""]
        grado = f'<span class="grado {GRADOS.get(c[2], "")}">{html.escape(c[2])}</span>' if c[2] else "<span></span>"
        out.append(f'<div class="pf-f"><b>{html.escape(c[0])}</b>{banda_html(c[1])}{grado}<span class="pf-d">{html.escape(c[3])}</span></div>')
    return f'<div class="perfil">{"".join(out)}</div>'


def b_requisitos(lineas):
    """Boceto del paso «Qué tiene que demostrar» de una oferta: «tipo | skill | pilar | banda mínima»."""
    filas = []
    for l in lineas:
        tipo, skill, pilar, banda = ([x.strip() for x in l.split("|")] + ["", "", "", ""])[:4]
        imp = tipo.lower().startswith("impres")
        filas.append(f'<div class="rq-f"><span class="rq-tipo {"imp" if imp else "val"}">{html.escape(tipo)}</span>'
                     f'<b>{html.escape(skill)}</b><span class="rq-p">{html.escape(pilar)}</span>'
                     f'<span class="rq-b">mínimo {banda_html(banda) if banda else "—"}</span></div>')
    return f'<div class="requisitos"><div class="rq-cab">Paso 2 · Qué tiene que demostrar</div>{"".join(filas)}</div>'


def b_encaje(lineas):
    """Boceto del encaje de un candidato con una oferta: «estado | skill | texto»."""
    marcas = {"ok": ("&#10003;", "e-ok"), "bajo": ("&#8211;", "e-bajo"), "falta": ("?", "e-falta")}
    filas = []
    for l in lineas:
        est, skill, txt = ([x.strip() for x in l.split("|")] + ["", "", ""])[:3]
        m, cl = marcas.get(est, ("·", ""))
        filas.append(f'<div class="en-f {cl}"><span class="en-m">{m}</span><b>{html.escape(skill)}</b><span>{html.escape(txt)}</span></div>')
    return f'<div class="encaje">{"".join(filas)}</div>'


BLOQUES = {"perfil": b_perfil, "requisitos": b_requisitos, "encaje": b_encaje, "flujo": b_flujo, "tarjetas": b_tarjetas, "mapa": b_mapa, "arbol": b_arbol, "escalera": b_escalera,
           "buscador": b_buscador}


def render(md):
    guardados = []

    def guardar(m):
        lineas = [l for l in m.group(2).splitlines() if l.strip()]
        guardados.append(BLOQUES[m.group(1)](lineas))
        return f"\n\nBLOQUE{len(guardados) - 1}FIN\n\n"
    md = re.sub(r"```(flujo|tarjetas|mapa|arbol|escalera|buscador|perfil|requisitos|encaje)\n(.*?)```", guardar, md, flags=re.S)
    h = base.md_a_html("# x\n" + md)
    return re.sub(r"<p>BLOQUE(\d+)FIN</p>", lambda m: guardados[int(m.group(1))], h)


def partes():
    texto = open(FUENTE, encoding="utf-8").read()
    trozos = re.split(r"(?m)^## (\d\d) · (.*)$", texto)
    out = []
    for i in range(1, len(trozos), 3):
        cuerpo = trozos[i + 2].strip()
        # Primera frase del cuerpo como subtítulo de la apertura si es un párrafo
        out.append((trozos[i], trozos[i + 1].strip(), re.sub(r"(?m)^### ", "## ", cuerpo)))
    return out


def portada():
    logo = re.sub(r"<title>.*?</title>", "", open(base.LOGO, encoding="utf-8").read(), flags=re.S)
    return f"""<section class="portada"><div class="marca">{logo}</div><div class="centro">
<div class="kicker">Documento de trabajo · Equipo TalentPact</div>
<h1>{html.escape(DOC["titulo"])}</h1>
<div class="sub">{html.escape(DOC["sub"])}</div><div class="franja"></div>
<div class="datos">{"".join(f'<div class="dato"><b>{a}</b><span>{html.escape(b)}</span></div>' for a, b in DOC["datos"])}</div></div>
<div class="pie">Versión estructural · {FECHA} · Para Xagri e Iván Sánchez · Propuestas pendientes de aprobación.<br>
Fuente: <code>docs/plan_post_reunion/{DOC["fuente"]}</code> · detalle técnico en los documentos 00–10 de la misma carpeta.</div></section>"""


def indice(lista, paginas):
    filas = "".join(f'<a class="fila" href="#parte-{n}"><div class="n">{n}</div><div><div class="t">{html.escape(t)}</div></div>'
                    f'<div class="pg">{paginas.get(n, "")}</div></a>' for n, t, _ in lista)
    return f"""<section class="indice"><h1>Índice</h1>
<div class="intro">{html.escape(DOC["intro"])}</div>{filas}</section>"""


def construir(paginas):
    lista = partes()
    total = len(lista)
    caps = "".join(f"""<section class="capitulo" id="parte-{n}"><div class="apertura"><div class="kicker">Parte {n} de {total:02d}</div>
<h1>{html.escape(t)}</h1></div>{render(c)}</section>""" for n, t, c in lista)
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>TalentPact · {html.escape(DOC["titulo"])}</title>
<style>{base.CSS}{CSS_EXTRA}</style></head><body>{portada()}{indice(lista, paginas)}{caps}</body></html>"""


def localizar(ruta, lista):
    paginas = {}
    for i, pag in enumerate(base.PdfReader(ruta).pages, start=1):
        txt = re.sub(r"\s+", " ", pag.extract_text() or "")
        for n, *_ in lista:
            if n not in paginas and f"Parte {n} de" in txt:
                paginas[n] = i
    return paginas


def main():
    lista = partes()
    with tempfile.TemporaryDirectory() as tmp:
        p1 = base.imprimir(construir({}), tmp, "e1")
        paginas = localizar(p1, lista)
        p2 = base.imprimir(construir(paginas), tmp, "e2")
        total = base.numerar(p2, SALIDA, f"TalentPact · {DOC['titulo']} · {FECHA}", f"TalentPact · {DOC['titulo']}")
    # Páginas por parte, para comprobar el límite de 2
    orden = sorted(paginas.items(), key=lambda x: x[1])
    largos = {n: (orden[i + 1][1] if i + 1 < len(orden) else total + 1) - p for i, (n, p) in enumerate(orden)}
    print(f"{SALIDA} · {total} páginas · páginas por parte: {largos}")


if __name__ == "__main__":
    main()
