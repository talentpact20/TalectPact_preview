#!/usr/bin/env python3
"""Compila el business plan en un HTML profesional listo para PDF."""
from pathlib import Path
import re
import sys

try:
    import markdown
except ImportError:
    sys.exit("pip3 install markdown")

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "TalentPact_TFM_Business_Plan.html"

CHAPTERS = [
    ("00", "Resumen ejecutivo", "00_resumen_ejecutivo.md"),
    ("M", "Objetivos y metodología", "00_objetivos_metodologia.md"),
    ("01", "Concepto de negocio", "01_concepto.md"),
    ("02", "Estudio de mercado", "02_mercado.md"),
    ("03", "Modelo de negocio", "03_modelo_negocio.md"),
    ("04", "Plan financiero", "04_plan_financiero.md"),
    ("05", "Marketing y ventas", "05_marketing_ventas.md"),
    ("06", "Tecnología y producto", "06_tecnologia_producto.md"),
    ("07", "Regulación y compliance", "07_regulacion_compliance.md"),
    ("08", "Riesgos y contingencias", "08_riesgos.md"),
    ("09", "Conclusiones y limitaciones", "09_conclusiones.md"),
]

CSS = r"""
:root{
  --ink:#0f172a;--muted:#475569;--line:#e2e8f0;--paper:#f8fafc;--white:#fff;
  --em:#059669;--em-d:#064e3b;--em-s:#ecfdf5;--gold:#b45309;
  --cover:#06281f;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;background:#e8edf2;color:var(--ink);
  font-family:"Source Serif 4",Georgia,"Times New Roman",serif;
  font-size:16.5px;line-height:1.65;
}
.toolbar{
  position:sticky;top:0;z-index:20;display:flex;gap:10px;align-items:center;justify-content:space-between;
  padding:10px 22px;background:#111827;color:#f9fafb;
  font-family:Sora,sans-serif;font-size:13px;
}
.toolbar b{font-family:Sora,sans-serif;font-weight:600}
.toolbar button,.toolbar a.btn{
  background:#fff;color:#111827;border:0;border-radius:8px;padding:8px 14px;
  font-weight:700;cursor:pointer;font-family:Sora,sans-serif;text-decoration:none;font-size:13px;
}
.sheet{max-width:860px;margin:0 auto 48px;background:var(--white);box-shadow:0 18px 50px rgba(15,23,42,.12)}
.cover{
  min-height:100vh;background:#fff;color:var(--ink);
  padding:64px 56px 56px;display:flex;flex-direction:column;justify-content:space-between;
  page-break-after:always;
}
.brand{font-family:Sora,sans-serif;font-weight:800;font-size:20px;letter-spacing:.2px}
.ub{font-family:Sora,sans-serif;font-size:12.5px;color:#64748b;letter-spacing:.06em;text-transform:uppercase;margin-top:6px}
.kicker{font-family:Sora,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;font-weight:700}
.cover-rule{width:56px;height:2px;background:var(--ink);margin:28px 0 22px}
.cover h1{font-family:Sora,sans-serif;font-size:34px;line-height:1.15;letter-spacing:-.03em;margin:0 0 16px;font-weight:700;max-width:22ch}
.cover h1 em{font-style:italic;font-weight:600}
.cover .lead{max-width:540px;color:var(--muted);font-size:17px}
.cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:18px;border-top:1px solid var(--ink);padding-top:22px;font-family:Sora,sans-serif;font-size:13px}
.cover-meta small{display:block;color:#64748b;letter-spacing:.08em;text-transform:uppercase;font-size:10px;margin-bottom:4px}

.inner{padding:48px 56px 64px}
.toc h2,.chapter>h1{font-family:Sora,sans-serif}
.toc{page-break-after:always}
.toc ol{list-style:none;padding:0;margin:0}
.toc li{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-family:Sora,sans-serif;font-size:14.5px}
.toc a{color:var(--ink);text-decoration:none}
.toc a:hover{color:#111827}
.toc .n{color:#111827;font-weight:800;margin-right:10px}

.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0 8px}
.kpi{background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.kpi b{display:block;font-family:Sora,sans-serif;font-size:20px;color:var(--ink)}
.kpi span{font-size:11px;color:var(--muted);font-family:Sora,sans-serif}

.chapter{page-break-before:always;padding-top:8px}
.chapter>h1{
  font-size:28px;letter-spacing:-.03em;margin:0 0 8px;padding-bottom:14px;
  border-bottom:2px solid var(--ink);
}
.num{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:6px;font-weight:700}

h2{font-family:Sora,sans-serif;font-size:18px;margin:28px 0 10px;letter-spacing:-.02em}
h3{font-family:Sora,sans-serif;font-size:15.5px;margin:20px 0 8px;color:var(--ink)}
p{margin:0 0 12px}
ul,ol{margin:0 0 14px;padding-left:22px}
li{margin:0 0 5px}
strong{font-weight:700}
a{color:#0f172a}
blockquote{
  margin:16px 0;padding:12px 16px 12px 18px;background:#f8fafc;
  border-left:3px solid var(--ink);border-radius:0 10px 10px 0;color:var(--ink);
}
blockquote p:last-child{margin:0}
table{width:100%;border-collapse:collapse;margin:12px 0 20px;font-size:13.5px;font-family:Sora,sans-serif}
th{text-align:left;background:#111827;color:#fff;padding:8px 10px;font-weight:600}
td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr:nth-child(even) td{background:#f8fafc}
code,pre{font-family:"JetBrains Mono",ui-monospace,monospace}
code{font-size:.82em;background:#f1f5f9;padding:1px 6px;border-radius:4px}
pre{
  background:#0f172a;color:#d1fae5;padding:16px 18px;border-radius:12px;overflow:auto;
  font-size:11.5px;line-height:1.45;margin:12px 0 18px;
}
pre code{background:none;color:inherit;padding:0}
.caption{font-size:12.5px;color:var(--muted);font-style:italic}
.fig{margin:22px 0}
.fig img{width:100%;border-radius:12px;border:1px solid var(--line);display:block}
.fig p{font-family:Sora,sans-serif;font-size:12px;color:var(--muted);margin:8px 0 0}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}
.card{border:1px solid var(--line);border-radius:14px;padding:16px 18px}
.card h3{margin:0 0 6px}
.mono{font-family:"JetBrains Mono",monospace;font-size:12px;word-break:break-all;color:var(--em-d)}
.refs{font-size:14px}
.refs li{margin-bottom:8px}
.footer-doc{
  padding:22px 56px 36px;border-top:1px solid var(--line);color:var(--muted);
  font-family:Sora,sans-serif;font-size:12px;
}
hr{border:0;border-top:1px solid var(--line);margin:22px 0}
img{max-width:100%}
*{print-color-adjust:exact;-webkit-print-color-adjust:exact}

@media print{
  body{background:#fff;font-size:11pt}
  .toolbar{display:none}
  .sheet{max-width:none;margin:0;box-shadow:none}
  .cover{min-height:100vh}
  .inner{padding:0}
  a{text-decoration:none;color:inherit}
  tr{page-break-inside:avoid}
  @page{size:A4;margin:16mm 14mm 18mm}
}
@media (max-width:720px){
  .cover,.inner,.footer-doc{padding:28px 20px}
  .kpis,.cards,.cover-meta{grid-template-columns:1fr 1fr}
  .cover h1{font-size:30px}
}
"""

ANNEX = r"""
<section class="chapter" id="anexos">
  <div class="num">Anexos</div>
  <h1>Evidencia, modelo financiero y fuentes</h1>

  <h2>A. SkillPass on-chain (Ethereum Sepolia)</h2>
  <p>Contrato <code>SkillPassRegistry</code> desplegado el 19 de agosto de 2026. On-chain solo se publica el hash; el JSON vive off-chain (RGPD). Producto: <a href="https://talentpact.es">talentpact.es</a>.</p>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Red</td><td>Ethereum Sepolia · chainId 11155111</td></tr>
    <tr><td>Contrato</td><td class="mono">0x85418F3d978e691C0f784bA63E4cB2826478f73A</td></tr>
    <tr><td>Emisor (demo)</td><td class="mono">0x80cEB844bB4382BB586495721b9431014A285c0F</td></tr>
    <tr><td>Tx de despliegue</td><td class="mono">0x0408bef73c350caea921e837df1133a14bc46ed158327676dec07756aaae4f5e</td></tr>
  </table>
  <p>Explorador:
    <a href="https://sepolia.etherscan.io/address/0x85418F3d978e691C0f784bA63E4cB2826478f73A">contrato</a> ·
    <a href="https://sepolia.etherscan.io/tx/0x0408bef73c350caea921e837df1133a14bc46ed158327676dec07756aaae4f5e">transacción</a>
  </p>
  <p>Verificador público: <code>verify.html?h=0x…</code></p>

  <h2>B. Motor de IA — capturas de la PoC</h2>
  <div class="fig">
    <img src="../entrega_final/img/captura-correccion.png" alt="Corrección IA de un ejercicio">
    <p>Figura B1. Corrección en vivo: Skill Score, criterios y feedback (producto).</p>
  </div>
  <div class="fig">
    <img src="../entrega_final/img/captura-costes.png" alt="Coste y trazabilidad de la evaluación">
    <p>Figura B2. Trazabilidad de tokens y coste real por evaluación.</p>
  </div>
  <div class="fig">
    <img src="../entrega_final/img/captura-injection.png" alt="Detección de prompt injection">
    <p>Figura B3. Detección de prompt injection: la manipulación no eleva la nota.</p>
  </div>

  <h2>C. Equipo</h2>
  <div class="cards">
    <div class="card">
      <h3>Xavier Griñó</h3>
      <p>Growth y comercial. Go-to-market B2B, ventas y relato de producto.</p>
    </div>
    <div class="card">
      <h3>Ivan Sánchez</h3>
      <p>Finanzas y producto-tech. Modelo financiero, arquitectura, IA y SkillPass.</p>
    </div>
  </div>
  <p class="caption">Universitat de Barcelona. El investor deck citaba cuatro perfiles; este TFM lo firman únicamente los dos autores.</p>

  <h2>D. Extracto del modelo financiero (escenario base)</h2>
  <p>Fuente: <code>assets/TalentPact_modelo_financiero.xlsx</code>, 17/04/2026. No se reproducen las 36 columnas mensuales (ilegibles en PDF); sí el cierre anual, KPIs, caja y balance. El archivo Excel es el anexo digital de auditoría.</p>

  <h3>D.1 Cuenta de resultados (€)</h3>
  <table>
    <thead><tr><th>Partida</th><th>2026</th><th>2027</th><th>2028</th></tr></thead>
    <tbody>
      <tr><td>Ingreso bruto</td><td>16.636</td><td>110.970</td><td>367.575</td></tr>
      <tr><td>Ingreso neto</td><td>16.303</td><td>108.750</td><td>360.224</td></tr>
      <tr><td>COGS</td><td>(1.063)</td><td>(7.262)</td><td>(22.428)</td></tr>
      <tr><td>Gross profit</td><td>15.240</td><td>101.488</td><td>337.796</td></tr>
      <tr><td>SG&amp;A</td><td>(77.761)</td><td>(187.884)</td><td>(292.629)</td></tr>
      <tr><td>EBITDA</td><td>(62.521)</td><td>(86.396)</td><td>45.167</td></tr>
      <tr><td>Resultado neto</td><td>(64.271)</td><td>(89.417)</td><td>34.178</td></tr>
    </tbody>
  </table>

  <h3>D.2 Clientes, rentabilidad unitaria y caja</h3>
  <table>
    <thead><tr><th>KPI</th><th>2026</th><th>2027</th><th>2028</th></tr></thead>
    <tbody>
      <tr><td>Empresas (dic)</td><td>24</td><td>129</td><td>284</td></tr>
      <tr><td>Candidatos (dic)</td><td>746</td><td>3.607</td><td>8.746</td></tr>
      <tr><td>ARR (dic)</td><td>41.973</td><td>224.878</td><td>496.530</td></tr>
      <tr><td>Gross margin</td><td>93,5 %</td><td>93,3 %</td><td>93,8 %</td></tr>
      <tr><td>CAC B2B (€)</td><td>238</td><td>195</td><td>256</td></tr>
      <tr><td>LTV / CAC</td><td>11,5×</td><td>17,3×</td><td>15,2×</td></tr>
      <tr><td>Caja 31 dic (€)</td><td>160.729</td><td>63.312</td><td>73.458</td></tr>
    </tbody>
  </table>

  <h3>D.3 Break-even y financiación</h3>
  <table>
    <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
    <tbody>
      <tr><td>Primer mes EBITDA ≥ 0</td><td>mayo 2028</td></tr>
      <tr><td>Caja mínima (valle)</td><td>€38.003 (abril 2028)</td></tr>
      <tr><td>Equity pre-seed (mes 1)</td><td>€180.000</td></tr>
      <tr><td>ENISA no dilutivo (jun 2026)</td><td>€50.000</td></tr>
      <tr><td>Deuda ENISA viva a dic-2028</td><td>€40.968</td></tr>
      <tr><td>Pérdida acumulada hasta BE</td><td>−€153.688</td></tr>
    </tbody>
  </table>

  <h3>D.4 Balance simplificado a 31 de diciembre (€)</h3>
  <table>
    <thead><tr><th></th><th>2026</th><th>2027</th><th>2028</th></tr></thead>
    <tbody>
      <tr><td>Inmovilizado (equipos)</td><td>5.000</td><td>13.000</td><td>28.000</td></tr>
      <tr><td>Tesorería</td><td>160.729</td><td>63.312</td><td>73.458</td></tr>
      <tr><td><strong>Total activo</strong></td><td>165.729</td><td>76.312</td><td>101.458</td></tr>
      <tr><td>Capital pre-seed</td><td>180.000</td><td>180.000</td><td>180.000</td></tr>
      <tr><td>Resultados acumulados + del ejercicio</td><td>(64.271)</td><td>(153.688)</td><td>(119.510)</td></tr>
      <tr><td>Préstamo ENISA</td><td>50.000</td><td>50.000</td><td>40.968</td></tr>
      <tr><td><strong>Pasivo + PN</strong></td><td>165.729</td><td>76.312</td><td>101.458</td></tr>
    </tbody>
  </table>
  <p class="caption">Hojas origen: Análisis, KPI Dashboard, P&amp;L, Cashflow, Balance. No se incluyen MODELO NORMAL mes a mes ni Full1.</p>

  <h2>E. Referencias</h2>
  <ol class="refs">
    <li>SHRM (2024). <em>Talent Acquisition Benchmarking</em>.</li>
    <li>Glassdoor / Adecco Institute — coste medio por contratación en España.</li>
    <li>ResumeLab (2024) — información falsa o exagerada en CVs.</li>
    <li>Leadership IQ — fracasos de contratación y <em>soft skills</em>.</li>
    <li>InfoJobs–Esade (2025). <em>Estado del mercado laboral en España</em>.</li>
    <li>Mordor Intelligence (2026). Mercado global de recruiting.</li>
    <li>Future Market Insights — <em>talent-acquisition technology</em> (2025).</li>
    <li>Vendr, Capterra, LinkedIn Recruiter pricing (2026); Equip Benchmark (feb 2026) — precios de competencia (MVP).</li>
    <li>Reglamento (UE) 2024/1689 (AI Act), Anexo III.</li>
    <li>Reglamento (UE) 2016/679 (RGPD) y LOPDGDD.</li>
    <li>Ley 34/2002 (LSSI).</li>
    <li>Reglamento (UE) 2023/1114 (MiCA).</li>
    <li>W3C, <em>Verifiable Credentials Data Model</em>; eIDAS 2.0 / EU Digital Identity Wallet.</li>
    <li>TalentPact, modelo financiero escenario base (17/04/2026), archivo Excel en <code>tfm/assets/</code>.</li>
    <li>Equipo TalentPact (2026). <em>Presentación MVP</em> — sección «Feedback recibido» (encuestas, expertos, tracción).</li>
    <li>Equipo TalentPact (2026). <em>Investor Deck</em> v2 — tracción y citas cualitativas.</li>
  </ol>
</section>
"""

def clean_md(text: str) -> str:
    lines = text.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    text = "\n".join(lines).strip()
    text = re.sub(r"\n---\n\s*\*[^*]+\*\s*$", "", text)
    text = text.replace("⭐", "")
    text = re.sub(r"`tfm/[^`]+`", lambda m: m.group(0).replace("tfm/", ""), text)
    return text


def to_html(md: str) -> str:
    return markdown.markdown(
        md,
        extensions=["tables", "fenced_code", "sane_lists"],
        output_format="html5",
    )


def kpi_strip() -> str:
    items = [
        ("€49", "por contacto"),
        ("~94 %", "margen bruto"),
        ("11–17×", "LTV / CAC"),
        ("May 2028", "break-even"),
    ]
    cells = "".join(f'<div class="kpi"><b>{a}</b><span>{b}</span></div>' for a, b in items)
    return f'<div class="kpis">{cells}</div>'


def chapter_label(num: str) -> str:
    if num == "00":
        return "Documento"
    if num == "M":
        return "Marco del TFM"
    if num == "09":
        return "Cierre académico"
    return f"Apartado {int(num)}"


def main() -> None:
    toc = []
    body = []
    for num, title, fname in CHAPTERS:
        raw = (ROOT / fname).read_text(encoding="utf-8")
        html = to_html(clean_md(raw))
        cid = f"cap-{num}"
        toc.append(f'<li><a href="#{cid}"><span><span class="n">{num}</span>{title}</span></a></li>')
        extra = kpi_strip() if num == "00" else ""
        body.append(
            f'<section class="chapter" id="{cid}">'
            f'<div class="num">{chapter_label(num)}</div><h1>{title}</h1>{extra}{html}</section>'
        )

    toc.append('<li><a href="#anexos"><span><span class="n">A–E</span>Anexos</span></a></li>')

    html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>TalentPact — Business Plan · TFM · Universitat de Barcelona</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<style>{CSS}</style>
</head>
<body>
<div class="toolbar">
  <div><b>TalentPact</b> · TFM · Universitat de Barcelona</div>
  <div>
    <button type="button" onclick="window.print()">Guardar como PDF</button>
  </div>
</div>
<article class="sheet">
  <header class="cover">
    <div>
      <p class="ub">Universitat de Barcelona</p>
      <p class="kicker" style="margin-top:14px">Trabajo Fin de Máster · Septiembre 2026</p>
      <div class="cover-rule"></div>
      <h1>TalentPact: plan de negocio de una fintech de credenciales de habilidad verificables</h1>
      <p class="lead">Marketplace de talento anónimo, evaluación por inteligencia artificial y sello criptográfico (SkillPass). Business plan y demostración funcional.</p>
    </div>
    <div class="cover-meta">
      <div><small>Programa</small>Máster en Fintech, Mercados Financieros y Blockchain</div>
      <div><small>Autores</small>Xavier Griñó · Ivan Sánchez</div>
      <div><small>Centro</small>Universitat de Barcelona</div>
      <div><small>Producto</small>talentpact.es</div>
    </div>
  </header>

  <div class="inner">
    <nav class="toc" id="indice">
      <div class="num">Contenido</div>
      <h2 style="font-family:Sora,sans-serif;font-size:28px;margin:0 0 18px;border-bottom:2px solid var(--ink);padding-bottom:12px">Índice</h2>
      <ol>{''.join(toc)}</ol>
    </nav>
    {''.join(body)}
    {ANNEX}
  </div>
  <footer class="footer-doc">
    Universitat de Barcelona · Máster en Fintech, Mercados Financieros y Blockchain · Xavier Griñó e Ivan Sánchez · Septiembre 2026 · talentpact.es · Cifras: modelo base 17/04/2026.
  </footer>
</article>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"OK → {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
