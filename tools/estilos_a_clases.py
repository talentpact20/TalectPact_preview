#!/usr/bin/env python3
"""Convierte los atributos style="…" de index.html en clases de utilidad.

Cada declaración pasa a una clase de una sola propiedad (u-mb-16, u-fs-peq,
u-c-slate-500…) que se escribe en assets/css/utilidades.css. Los colores y
tamaños se normalizan a tokens antes. Se conserva en línea solo el estado que
cambia el JavaScript: display:none y los anchos de las barras de progreso.

Pasos (para poder comparar el estilo calculado antes y después en el navegador):
  python3 tools/estilos_a_clases.py marcar      # data-ix en cada elemento y valores normalizados
  python3 tools/estilos_a_clases.py convertir   # style -> clases
  python3 tools/estilos_a_clases.py desmarcar   # quita data-ix
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalizar_css import HEX, BLANCOS, PROPS_TEXTO, token_fs  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
HTML = RAIZ / "index.html"
UTIL = RAIZ / "assets" / "css" / "utilidades.css"

ABREV = {
    "margin": "m", "margin-top": "mt", "margin-bottom": "mb", "margin-left": "ml", "margin-right": "mr",
    "padding": "p", "padding-top": "pt", "padding-bottom": "pb", "padding-left": "pl", "padding-right": "pr",
    "font-size": "fs", "font-weight": "fw", "font-family": "ff", "color": "c", "background": "bg",
    "background-color": "bg", "display": "d", "gap": "gap", "flex": "flex", "flex-wrap": "fw-wrap",
    "width": "w", "max-width": "maxw", "min-width": "minw", "height": "h", "text-align": "ta",
    "text-transform": "tt", "letter-spacing": "ls", "line-height": "lh", "border-radius": "r",
    "border": "b", "border-top": "bt", "border-bottom": "bb", "border-color": "bc", "cursor": "cur",
    "justify-content": "jc", "align-items": "ai", "box-sizing": "bs", "white-space": "ws",
    "position": "pos", "overflow": "ov", "opacity": "op", "text-decoration": "td", "flex-shrink": "fsh",
    "border-bottom-color": "bbc", "vertical-align": "va", "font-style": "fst", "word-break": "wb",
}
ESTADO = [("display", "none")]  # se queda en línea

RGBA = {"rgba(245,158,11,.3)": "var(--amber-300)", "rgba(16,185,129,.3)": "var(--emerald-300)"}


def normalizar_valor(prop, valor):
    valor = valor.strip()
    if prop == "font-size":
        return token_fs(valor) or valor
    for k, v in RGBA.items():
        valor = valor.replace(k, v)

    def color(c):
        v = c.group(0).lower()
        if v in BLANCOS:
            return "var(--c-sobre-tinta)" if prop in PROPS_TEXTO else "var(--c-superficie)"
        return f"var(--{HEX[v]})" if v in HEX else c.group(0)

    return re.sub(r"#[0-9a-fA-F]{3,8}\b|(?<![-\w])white\b", color, valor)


def decls(estilo):
    out = []
    for parte in estilo.split(";"):
        if ":" in parte:
            p, v = parte.split(":", 1)
            p = p.strip().lower()
            out.append((p, normalizar_valor(p, v)))
    return out


def nombre_clase(prop, valor):
    v = valor.lower()
    v = re.sub(r"var\(--fs-([a-z0-9]+)\)", r"\1", v)
    v = re.sub(r"var\(--(?:c-)?([a-z0-9-]+)\)", r"\1", v)
    v = v.replace("'jetbrains mono',monospace", "mono").replace("%", "pct").replace("!important", "")
    v = re.sub(r"(\d)px", r"\1", v)
    v = re.sub(r"[^a-z0-9.-]+", "-", v).strip("-").replace(".", "_")
    return f"u-{ABREV.get(prop, prop)}-{v}"


def estado(prop, valor):
    return (prop, valor) in ESTADO or (prop == "width" and valor != "100%" and valor.endswith("%") and valor[:-1].replace(".", "").isdigit())


TAG = re.compile(r"<([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*?)\sstyle=\"([^\"]*)\"([^<>]*)>")


def marcar(html):
    n = [0]

    def f(m):
        n[0] += 1
        estilo = ";".join(f"{p}:{v}" for p, v in decls(m.group(3)))
        return f'<{m.group(1)}{m.group(2)} data-ix="{n[0]}" style="{estilo}"{m.group(4)}>'
    return TAG.sub(f, html)


def convertir(html):
    reglas = {}

    def f(m):
        tag, antes, estilo, despues = m.groups()
        en_linea, clases = [], []
        for p, v in decls(estilo):
            if estado(p, v):
                en_linea.append(f"{p}:{v}")
            else:
                c = nombre_clase(p, v)
                reglas[c] = f"{p}:{v}"
                clases.append(c)
        resto = antes + despues
        if clases:
            cm = re.search(r'\sclass="([^"]*)"', resto)
            if cm:
                nuevo = cm.group(1) + " " + " ".join(clases)
                resto = resto[:cm.start()] + f' class="{nuevo}"' + resto[cm.end():]
                antes, despues = resto, ""
            else:
                despues = despues + f' class="{" ".join(clases)}"'
        st = f' style="{";".join(en_linea)}"' if en_linea else ""
        return f"<{tag}{antes}{st}{despues}>"

    html = TAG.sub(f, html)
    return html, reglas


def escribir_utilidades(reglas):
    previas = {}
    if UTIL.exists():
        for m in re.finditer(r"\.(u-[a-z0-9_-]+)\{([^}]*)\}", UTIL.read_text(encoding="utf-8")):
            previas[m.group(1)] = m.group(2)
    previas.update(reglas)
    cuerpo = "\n".join(f".{c}{{{d}}}" for c, d in sorted(previas.items()))
    UTIL.write_text("/* Utilidades de una sola propiedad (las genera tools/estilos_a_clases.py a partir\n"
                    "   de los antiguos style=\"…\" de index.html). Se cargan las últimas. */\n" + cuerpo + "\n",
                    encoding="utf-8")


def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else ""
    html = HTML.read_text(encoding="utf-8")
    if modo == "marcar":
        HTML.write_text(marcar(html), encoding="utf-8")
    elif modo == "convertir":
        html, reglas = convertir(html)
        HTML.write_text(html, encoding="utf-8")
        escribir_utilidades(reglas)
        print(f"{len(reglas)} utilidades")
    elif modo == "desmarcar":
        HTML.write_text(re.sub(r' data-ix="\d+"', "", html), encoding="utf-8")
    else:
        print(__doc__)
        return
    print("style restantes:", len(re.findall(r'\sstyle="', HTML.read_text(encoding="utf-8"))))


if __name__ == "__main__":
    main()
