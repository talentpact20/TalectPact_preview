# Marca TalentPact

Assets extraídos del SVG inline de `index.html` (barra de navegación, dashboards, footer y favicon).
El wordmark está **convertido a curvas** (Sora ExtraBold, OFL) — los SVG no dependen de ninguna fuente instalada.

## Archivos

| Archivo | Uso |
|---|---|
| `talentpact-logo.svg` / `.png` | Logotipo horizontal sobre fondo claro |
| `talentpact-logo-dark.svg` / `.png` | Logotipo horizontal sobre fondo oscuro |
| `talentpact-mark.svg` / `.png` | Solo símbolo (fondo claro) |
| `talentpact-mark-dark.svg` / `.png` | Solo símbolo (fondo oscuro) |
| `talentpact-favicon.svg` / `.png` | Icono en cuadrado redondeado (el del `<link rel="icon">`) |

PNG con transparencia: logo 1080×256, símbolo 1024×1024, favicon 512×512.

## Color

| Token | Hex | Dónde |
|---|---|---|
| `--emerald-600` | `#059669` | Barra izquierda del símbolo |
| `--emerald-500` | `#10b981` | "pact" en fondo claro |
| `--emerald-400` | `#34d399` | Círculo central · "pact" en fondo oscuro |
| `--slate-900` | `#0f172a` | Barra derecha · "talent" en fondo claro |
| `--slate-600` | `#475569` | Barra derecha en fondo oscuro |

## Tipografía

Sora ExtraBold (800), `letter-spacing: -0.04em`, todo en minúscula: `talentpact`.
En HTML el texto vivo usa `font-family:'Sora'` cargada desde Google Fonts.

## Área de respeto

Margen mínimo alrededor del logotipo = altura del círculo central (4 unidades del viewBox de 32,
es decir 1/8 de la altura del logo). Tamaño mínimo del lockup: 100 px de ancho; del símbolo: 20 px.
