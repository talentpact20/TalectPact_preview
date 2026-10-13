#!/usr/bin/env python3
"""Genera assets/css/tokens.css: la paleta, los tokens semánticos y el modo oscuro.

Es la única fuente de colores, tamaños de letra, espaciado, radios, sombras y
movimiento de la web. Los demás CSS solo usan var(--…).

Modo oscuro: cada escala se invierte (el 50 pasa a ser el tono más oscuro y el
900 el más claro), así que un componente que en claro usa fondo slate-50 y texto
slate-900 se ve bien en oscuro sin tocarlo. Las "islas" son piezas que ya son
oscuras en modo claro (pie, franja del SkillPass, cabeceras de chat…): en modo
oscuro conservan la paleta clara para verse exactamente igual.

Se activa con la preferencia del sistema o con <html data-theme="dark|light">.

Uso:  python3 tools/generar_tokens.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "assets" / "css" / "tokens.css"

# Escalas: (paso, claro, oscuro)
ESCALAS = {
    "slate": [
        ("950", "#060a13", "#f9fafb"), ("900", "#0c1220", "#eef1f5"), ("800", "#1b2333", "#dde2e9"),
        ("700", "#323c4e", "#c5ccd7"), ("600", "#4a5568", "#a7b0bf"), ("500", "#667085", "#8a94a6"),
        ("400", "#98a2b3", "#5f6a7d"), ("300", "#d0d5dd", "#334055"), ("200", "#e4e7ec", "#253046"),
        ("100", "#f2f4f7", "#172133"), ("50", "#f9fafb", "#0f1726"),
    ],
    "emerald": [
        ("950", "#06281f", "#e8f7f3"), ("900", "#0b3d30", "#cdeee7"), ("800", "#0a463d", "#a8e3d6"),
        ("700", "#08574b", "#7fd3c1"), ("600", "#0b6e5f", "#4fbea7"), ("500", "#0f8a76", "#3aa892"),
        ("400", "#3aa892", "#2a8c78"), ("300", "#8fd0c0", "#1d6b5c"), ("200", "#bfe3da", "#185246"),
        ("100", "#dcefea", "#123a33"), ("50", "#f1f8f6", "#0d2925"),
    ],
    "amber": [
        ("800", "#6e3d06", "#f7dcae"), ("700", "#8a4d07", "#f2cb8c"), ("600", "#a85f08", "#ebb86c"),
        ("500", "#c2700b", "#e0a24a"), ("400", "#e0a24a", "#b98025"), ("300", "#f0c36b", "#8a6019"),
        ("200", "#f8dca8", "#5a3e10"), ("100", "#fdf1dc", "#3a2809"), ("50", "#fffaf0", "#2a1d07"),
    ],
    "red": [
        ("700", "#8c261f", "#f7b8b2"), ("600", "#a92e25", "#f39a92"), ("500", "#c8372d", "#ef7a70"),
        ("400", "#e0645a", "#c2473d"), ("300", "#f19b93", "#8f2f28"), ("200", "#f9c9c4", "#5e211d"),
        ("100", "#fde8e6", "#3d1614"), ("50", "#fef4f3", "#2c1110"),
    ],
    "blue": [
        ("700", "#1f3f99", "#c6d4f8"), ("600", "#284db8", "#a8bef4"), ("500", "#2f5bd3", "#8aa6f0"), ("400", "#5b7fe0", "#6d8de6"),
        ("200", "#c9d6f8", "#233a6e"), ("100", "#e8eefc", "#15244a"), ("50", "#f2f6fe", "#101b33"),
    ],
    "violet": [("500", "#5b4bc4", "#a99ef0"), ("100", "#eeecfb", "#221d4a")],
}

# Tokens semánticos: (nombre, valor claro, valor oscuro o None si se deriva de la escala)
SEMANTICOS = [
    ("--white", "#ffffff", "#111a2b"),             # compatibilidad: superficie
    ("--c-fondo", "var(--slate-50)", None),
    ("--c-superficie", "#ffffff", "#111a2b"),
    ("--c-superficie-2", "var(--slate-100)", None),
    ("--c-borde", "var(--slate-200)", None),
    ("--c-borde-fuerte", "var(--slate-300)", None),
    ("--c-texto", "var(--slate-900)", None),
    ("--c-texto-2", "var(--slate-600)", None),
    ("--c-texto-3", "var(--slate-500)", None),
    ("--c-marca", "var(--emerald-600)", None),
    ("--c-marca-hover", "var(--emerald-700)", None),
    ("--c-marca-suave", "var(--emerald-50)", None),
    ("--c-sobre-tinta", "#ffffff", "#0a0f1a"),     # texto sobre fondos de tinta o de marca
    ("--c-foco", "#2f5bd3", "#8aa6f0"),
    ("--c-ok", "var(--emerald-500)", None),
    ("--c-ok-suave", "var(--emerald-50)", None),
    ("--c-aviso", "var(--amber-500)", None),
    ("--c-aviso-suave", "var(--amber-50)", None),
    ("--c-error", "var(--red-500)", None),
    ("--c-error-suave", "var(--red-50)", None),
    ("--c-info", "var(--blue-500)", None),
    ("--c-info-suave", "var(--blue-50)", None),
    ("--c-velo", "rgba(12,18,32,.5)", "rgba(0,0,0,.6)"),
    ("--c-nav", "rgba(255,255,255,.92)", "rgba(17,26,43,.9)"),
    ("--c-evento", "var(--emerald-600)", None),   # acento del evento (lo fija el organizador)
]

FIJOS = """
  /* Tipografía: 8 tamaños */
  --font-sans:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --fs-micro:.75rem;      /* 12 · etiquetas, chips, ejes */
  --fs-peq:.8125rem;      /* 13 · tablas, ayudas, metadatos */
  --fs-cuerpo:.9375rem;   /* 15 · texto */
  --fs-dest:1.0625rem;    /* 17 · entradillas */
  --fs-t3:1.25rem;        /* 20 · tarjeta, modal */
  --fs-t2:1.5rem;         /* 24 · sección */
  --fs-t1:2rem;           /* 32 · página */
  --fs-display:2.75rem;   /* 44 · portada */
  /* Espaciado (múltiplos de 4) */
  --sp-1:4px;--sp-2:8px;--sp-3:12px;--sp-4:16px;--sp-6:24px;--sp-8:32px;--sp-12:48px;--sp-16:64px;
  /* Radios */
  --radius:8px;--radius-lg:12px;--radius-xl:16px;--radius-full:999px;
  /* Elevación */
  --shadow-sm:0 1px 2px rgba(16,24,40,.05);
  --shadow:0 1px 3px rgba(16,24,40,.07),0 1px 2px rgba(16,24,40,.04);
  --shadow-md:0 6px 16px -4px rgba(16,24,40,.08),0 2px 4px -2px rgba(16,24,40,.04);
  --shadow-lg:0 14px 28px -8px rgba(16,24,40,.12);
  --shadow-xl:0 24px 48px -12px rgba(16,24,40,.18);
  /* Movimiento */
  --dur-corta:150ms;--dur-media:250ms;--curva:cubic-bezier(.2,.7,.3,1);
  /* Capas */
  --z-nav:900;--z-panel:1000;--z-modal:1100;--z-aviso:1200;
"""

SOMBRAS_OSCURO = """
  --shadow-sm:0 0 0 1px rgba(255,255,255,.04);
  --shadow:0 0 0 1px rgba(255,255,255,.05);
  --shadow-md:0 0 0 1px rgba(255,255,255,.06),0 8px 20px -6px rgba(0,0,0,.5);
  --shadow-lg:0 0 0 1px rgba(255,255,255,.06),0 16px 32px -8px rgba(0,0,0,.6);
  --shadow-xl:0 0 0 1px rgba(255,255,255,.08),0 24px 48px -12px rgba(0,0,0,.7);
"""

# Piezas oscuras por diseño que conservan la paleta clara en modo oscuro.
ISLAS = ["footer", ".sp-sec-band", ".cta-sec", ".stats-strip", ".auth-brand-cand", ".auth-brand-emp",
         ".ranking-header", ".ai-chat-header", ".pay-header", ".chat-header", ".rec-container",
         ".video-container", ".tp-proctor", ".tp-toast", ".sp-pass"]


def paleta(modo):
    lineas = []
    for nombre, pasos in ESCALAS.items():
        idx = 1 if modo == "claro" else 2
        lineas.append("  " + "".join(f"--{nombre}-{p[0]}:{p[idx]};" for p in pasos))
    return "\n".join(lineas)


def semanticos(modo):
    out = []
    for nombre, claro, oscuro in SEMANTICOS:
        if modo == "claro":
            out.append(f"{nombre}:{claro};")
        elif oscuro is not None:
            out.append(f"{nombre}:{oscuro};")
    return "  " + "".join(out)


def bloque(selector, cuerpo):
    return f"{selector}{{\n{cuerpo}\n}}\n"


def main():
    islas = ",".join(ISLAS)
    claro = paleta("claro") + "\n" + semanticos("claro")
    oscuro = paleta("oscuro") + "\n" + semanticos("oscuro") + "\n" + SOMBRAS_OSCURO.rstrip() + "\n  color-scheme:dark;"
    isla_clara = paleta("claro") + "\n" + semanticos("claro") + "\n  color-scheme:light;"
    css = []
    css.append("/* Generado por tools/generar_tokens.py: no editar a mano. */\n")
    css.append(bloque(":root", FIJOS.strip("\n") + "\n" + claro + "\n  color-scheme:light;"))
    css.append("@media (prefers-color-scheme:dark){\n"
               + bloque(":root:not([data-theme=\"light\"])", oscuro)
               + bloque(f":root:not([data-theme=\"light\"]) :is({islas})", isla_clara)
               + "}\n")
    css.append(bloque(":root[data-theme=\"dark\"]", oscuro))
    css.append(bloque(f":root[data-theme=\"dark\"] :is({islas})", isla_clara))
    SALIDA.write_text("".join(css), encoding="utf-8")
    print(f"Escrito {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
