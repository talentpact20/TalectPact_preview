#!/usr/bin/env python3
"""Sustituye en los CSS los colores y tamaños de letra escritos a mano por tokens.

- Colores hexadecimales -> var(--escala-paso) de assets/css/tokens.css.
- white / #fff como color de texto -> var(--c-sobre-tinta); como fondo o borde -> var(--c-superficie).
- Tamaños de letra en rem/px -> uno de los 8 pasos --fs-*.
- Quita los bloques :root con la paleta antigua (ahora vive en tokens.css).

Es idempotente: se puede volver a ejecutar sin cambiar nada más.
Uso:  python3 tools/normalizar_css.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FICHEROS = ["assets/css/app.css", "assets/css/modulos.css", "assets/css/tema.css", "assets/css/componentes.css"]

HEX = {
    # neutros
    "#060a13": "slate-950", "#0a0f1a": "slate-950", "#0d1117": "slate-950", "#04110e": "slate-950",
    "#0c1220": "slate-900", "#0f172a": "slate-900", "#111827": "slate-900",
    "#1b2333": "slate-800", "#1e293b": "slate-800", "#1f2937": "slate-800",
    "#323c4e": "slate-700", "#334155": "slate-700", "#374151": "slate-700",
    "#4a5568": "slate-600", "#475569": "slate-600", "#4b5563": "slate-600",
    "#667085": "slate-500", "#64748b": "slate-500", "#6b7280": "slate-500",
    "#98a2b3": "slate-400", "#94a3b8": "slate-400", "#9ca3af": "slate-400",
    "#d0d5dd": "slate-300", "#cbd5e1": "slate-300", "#d1d5db": "slate-300",
    "#e4e7ec": "slate-200", "#e2e8f0": "slate-200",
    "#f2f4f7": "slate-100", "#f1f5f9": "slate-100",
    "#f9fafb": "slate-50", "#f8fafc": "slate-50",
    # marca (verde azulado)
    "#06281f": "emerald-950", "#042f2e": "emerald-950", "#0b3d30": "emerald-900", "#12382c": "emerald-900",
    "#064e3b": "emerald-800", "#3f6b5c": "emerald-800", "#08574b": "emerald-700",
    "#0b6e5f": "emerald-600", "#059669": "emerald-600", "#0891b2": "emerald-600",
    "#0f8a76": "emerald-500", "#10b981": "emerald-500", "#0d9488": "emerald-500",
    "#3aa892": "emerald-400", "#34d399": "emerald-400",
    "#6ee7b7": "emerald-300", "#86efac": "emerald-300", "#22d3ee": "emerald-300",
    "#bfe3da": "emerald-200", "#a7f3d0": "emerald-200",
    "#dcefea": "emerald-100", "#d1fae5": "emerald-100",
    "#f1f8f6": "emerald-50", "#ecfdf5": "emerald-50", "#f8fffc": "emerald-50",
    # ámbar
    "#92400e": "amber-800", "#b45309": "amber-700", "#c2410c": "amber-700", "#d97706": "amber-600",
    "#c2700b": "amber-500", "#f59e0b": "amber-500", "#fbbf24": "amber-400",
    "#fde68a": "amber-200", "#fed7aa": "amber-200", "#fdf1dc": "amber-100", "#fef3c7": "amber-100",
    "#fffbeb": "amber-50",
    # rojo
    "#b91c1c": "red-700", "#c8372d": "red-500", "#ef4444": "red-500", "#f43f5e": "red-500",
    "#f87171": "red-400", "#fca5a5": "red-300", "#fda4af": "red-300", "#fecaca": "red-200",
    "#fde8e6": "red-100", "#fee2e2": "red-100", "#fef2f2": "red-50", "#fff5f5": "red-50",
    # azul y violeta
    "#2f5bd3": "blue-500", "#3b82f6": "blue-500", "#dbeafe": "blue-100", "#e8eefc": "blue-100",
    "#eff6ff": "blue-50", "#5b4bc4": "violet-500", "#8b5cf6": "violet-500", "#3f3a9c": "violet-500",
    "#635bff": "violet-500", "#e0defe": "violet-100", "#eef0fb": "violet-100",
}
BLANCOS = {"#fff", "#ffffff", "white"}
PROPS_TEXTO = {"color", "fill", "stroke", "caret-color", "-webkit-text-fill-color", "text-decoration-color"}

# (límite superior en rem, token)
ESCALA_FS = [(0.79, "micro"), (0.86, "peq"), (0.96, "cuerpo"), (1.13, "dest"), (1.41, "t3"),
             (1.8, "t2"), (2.6, "t1"), (99, "display")]

DECL = re.compile(r"([-a-zA-Z]+)\s*:\s*([^;{}]+)")
COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b|(?<![-\w])white\b")
TAM = re.compile(r"^\s*([0-9]*\.?[0-9]+)(rem|px)\s*(!important)?\s*$")


def token_fs(valor):
    m = TAM.match(valor)
    if not m:
        return None
    n = float(m.group(1)) / (16 if m.group(2) == "px" else 1)
    for limite, nombre in ESCALA_FS:
        if n <= limite:
            return f"var(--fs-{nombre})" + (" !important" if m.group(3) else "")


def cambiar_decl(m):
    prop, valor = m.group(1), m.group(2)
    p = prop.lower()
    if p in ("white-space",):
        return m.group(0)
    if p == "font-size":
        nuevo = token_fs(valor)
        return f"{prop}:{nuevo}" if nuevo else m.group(0)

    def color(c):
        v = c.group(0).lower()
        if v in BLANCOS:
            return "var(--c-sobre-tinta)" if p in PROPS_TEXTO else "var(--c-superficie)"
        if v in HEX:
            return f"var(--{HEX[v]})"
        return c.group(0)

    return f"{prop}:{COLOR.sub(color, valor)}"


def procesar(texto):
    # Sin la paleta antigua: vive en tokens.css.
    texto = re.sub(r"(?m)^:root\{[^}]*\}\n?", "", texto, count=1)
    salida, i = [], 0
    # Solo dentro de los cuerpos de regla, nunca en selectores ni comentarios.
    for bloque in re.finditer(r"/\*.*?\*/|\{([^{}]*)\}", texto, flags=re.S):
        salida.append(texto[i:bloque.start()])
        if bloque.group(0).startswith("/*"):
            salida.append(bloque.group(0))
        else:
            salida.append("{" + DECL.sub(cambiar_decl, bloque.group(1)) + "}")
        i = bloque.end()
    salida.append(texto[i:])
    return "".join(salida)


def main():
    for f in FICHEROS:
        ruta = RAIZ / f
        antes = ruta.read_text(encoding="utf-8")
        despues = procesar(antes)
        if despues != antes:
            ruta.write_text(despues, encoding="utf-8")
        resto = sorted(set(m.lower() for m in re.findall(r"#[0-9a-fA-F]{3,8}\b", re.sub(r"/\*.*?\*/", "", despues, flags=re.S))))
        print(f"{f}: colores sin token: {resto or 'ninguno'}")


if __name__ == "__main__":
    main()
