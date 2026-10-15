#!/usr/bin/env python3
"""Pasa a clases de utilidad los style="…" estáticos de las plantillas de assets/js/app/*.js.

Solo toca los que no llevan ${…} (los dinámicos se quedan en línea) y las
etiquetas sin '>' dentro de sus atributos (un onclick con => se deja tal cual).
Reutiliza la normalización de tools/estilos_a_clases.py. Idempotente.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from estilos_a_clases import decls, nombre_clase, estado, escribir_utilidades  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
TAG = re.compile(r"<([a-zA-Z][a-zA-Z0-9]*)\b((?:(?!\$\{)[^<>`])*?)\sstyle=\"([^\"$`'+]*)\"((?:(?!\$\{)[^<>`])*)>")


def convertir(js, reglas):
    def f(m):
        tag, antes, estilo, despues = m.groups()
        en_linea, clases = [], []
        for p, v in decls(estilo):
            # Colores literales (p. ej. las lucecitas de una ventana de ejemplo) se quedan en línea.
            if estado(p, v) or re.search(r"#[0-9a-fA-F]{3,8}\b", v):
                en_linea.append(f"{p}:{v}")
            else:
                c = nombre_clase(p, v)
                reglas[c] = f"{p}:{v}"
                clases.append(c)
        if not clases:
            return m.group(0)
        resto = antes + despues
        cm = re.search(r'\sclass="([^"]*)"', resto)
        if cm:
            resto = resto[:cm.start()] + f' class="{cm.group(1)} {" ".join(clases)}"' + resto[cm.end():]
            antes, despues = resto, ""
        else:
            despues = despues + f' class="{" ".join(clases)}"'
        st = f' style="{";".join(en_linea)}"' if en_linea else ""
        return f"<{tag}{antes}{st}{despues}>"
    return TAG.sub(f, js)


def main():
    reglas = {}
    total = 0
    for ruta in sorted((RAIZ / "assets/js/app").glob("*.js")):
        antes = ruta.read_text(encoding="utf-8")
        despues = convertir(antes, reglas)
        if despues != antes:
            ruta.write_text(despues, encoding="utf-8")
        total += len(re.findall(r'style="[^"]*"', despues))
    escribir_utilidades(reglas)
    print(f"{len(reglas)} utilidades; style restantes en scripts: {total}")


if __name__ == "__main__":
    main()
