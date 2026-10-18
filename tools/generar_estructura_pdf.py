# Genera docs/plan_post_reunion/TalentPact_Estructura_plataforma.pdf a partir de estructura_plataforma.md.
# Uso: python3 tools/generar_estructura_pdf.py
# Los bloques ```flujo, ```mapa, ```arbol, ```tarjetas y ```escalera del .md se dibujan como diagramas;
# el resto del texto sale tal cual. Reutiliza estilos, impresión con Chrome y numeración de generar_plan_pdf.py.
import html
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generar_plan_pdf as base  # noqa: E402

FUENTE = os.path.join(base.CARPETA, "estructura_plataforma.md")
SALIDA = os.path.join(base.CARPETA, "TalentPact_Estructura_plataforma.pdf")

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
    colores = ["#98a2b3", "#0f8a76", "#0b6e5f", "#08574b"]
    alturas = [24, 34, 44, 54]
    pel = "".join(f'<div class="peldano" style="background:{colores[i % 4]};height:{alturas[i % 4]}mm"><b>{html.escape(t.strip())}</b>{html.escape(d.strip())}</div>'
                  for i, (t, d) in enumerate(l.split("|", 1) for l in lineas))
    return f'<div class="escalera">{pel}</div>'


BLOQUES = {"flujo": b_flujo, "tarjetas": b_tarjetas, "mapa": b_mapa, "arbol": b_arbol, "escalera": b_escalera}


def render(md):
    guardados = []

    def guardar(m):
        lineas = [l for l in m.group(2).splitlines() if l.strip()]
        guardados.append(BLOQUES[m.group(1)](lineas))
        return f"\n\nBLOQUE{len(guardados) - 1}FIN\n\n"
    md = re.sub(r"```(flujo|tarjetas|mapa|arbol|escalera)\n(.*?)```", guardar, md, flags=re.S)
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
<h1>Cómo estructurar la plataforma</h1>
<div class="sub">Quién la usa, qué secciones tiene, cómo se ordena la información, los recorridos de candidato y empresa,
la rama de IA, la confianza y qué es gratis y qué de pago.</div><div class="franja"></div>
<div class="datos"><div class="dato"><b>4</b><span>zonas de la plataforma</span></div>
<div class="dato"><b>3</b><span>pilares de skills</span></div>
<div class="dato"><b>7 · 12</b><span>áreas funcionales y sectores</span></div>
<div class="dato"><b>7</b><span>pasos para construirla</span></div></div></div>
<div class="pie">Versión estructural · 18 de octubre de 2026 · Para Xagri e Iván Sánchez · Propuestas pendientes de aprobación.<br>
Fuente: <code>docs/plan_post_reunion/estructura_plataforma.md</code> · detalle técnico en los documentos 00–10 de la misma carpeta.</div></section>"""


def indice(lista, paginas):
    filas = "".join(f'<a class="fila" href="#parte-{n}"><div class="n">{n}</div><div><div class="t">{html.escape(t)}</div></div>'
                    f'<div class="pg">{paginas.get(n, "")}</div></a>' for n, t, _ in lista)
    return f"""<section class="indice"><h1>Índice</h1>
<div class="intro">La plataforma de arriba abajo: primero qué es y cómo se organiza, después cómo la recorren el candidato y la empresa, y al final el orden para construirla.</div>{filas}</section>"""


def construir(paginas):
    lista = partes()
    total = len(lista)
    caps = "".join(f"""<section class="capitulo" id="parte-{n}"><div class="apertura"><div class="kicker">Parte {n} de {total:02d}</div>
<h1>{html.escape(t)}</h1></div>{render(c)}</section>""" for n, t, c in lista)
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>TalentPact · Estructura de la plataforma</title>
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
        total = base.numerar(p2, SALIDA, "TalentPact · Cómo estructurar la plataforma · 18/10/2026", "TalentPact · Cómo estructurar la plataforma")
    # Páginas por parte, para comprobar el límite de 2
    orden = sorted(paginas.items(), key=lambda x: x[1])
    largos = {n: (orden[i + 1][1] if i + 1 < len(orden) else total + 1) - p for i, (n, p) in enumerate(orden)}
    print(f"{SALIDA} · {total} páginas · páginas por parte: {largos}")


if __name__ == "__main__":
    main()
