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
    ("01", "Concepto de negocio", "01_concepto.md"),
    ("02", "Estudio de mercado", "02_mercado.md"),
    ("03", "Modelo de negocio", "03_modelo_negocio.md"),
    ("04", "Plan financiero", "04_plan_financiero.md"),
    ("05", "Marketing y ventas", "05_marketing_ventas.md"),
    ("06", "Tecnología y producto", "06_tecnologia_producto.md"),
    ("07", "Regulación y compliance", "07_regulacion_compliance.md"),
    ("08", "Riesgos y contingencias", "08_riesgos.md"),
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
  padding:10px 22px;background:rgba(6,40,31,.94);color:#ecfdf5;backdrop-filter:blur(10px);
  font-family:Sora,sans-serif;font-size:13px;
}
.toolbar b{font-family:Sora,sans-serif}
.toolbar button,.toolbar a.btn{
  background:var(--em);color:#042f2e;border:0;border-radius:8px;padding:8px 14px;
  font-weight:700;cursor:pointer;font-family:Sora,sans-serif;text-decoration:none;font-size:13px;
}
.sheet{max-width:860px;margin:0 auto 48px;background:var(--white);box-shadow:0 18px 50px rgba(15,23,42,.12)}
.cover{
  min-height:100vh;background:
    radial-gradient(900px 380px at 10% -10%,rgba(52,211,153,.28),transparent 55%),
    linear-gradient(165deg,#06281f 0%,#0b3d30 45%,#0f172a 100%);
  color:#ecfdf5;padding:56px 56px 48px;display:flex;flex-direction:column;justify-content:space-between;
  page-break-after:always;
}
.brand{font-family:Sora,sans-serif;font-weight:800;font-size:22px;letter-spacing:.3px}
.brand span{color:#34d399}
.kicker{font-family:Sora,sans-serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#a7f3d0;font-weight:700}
.cover h1{font-family:Sora,sans-serif;font-size:42px;line-height:1.08;letter-spacing:-.03em;margin:18px 0 12px;font-weight:800}
.cover h1 em{font-style:normal;color:#34d399}
.cover .lead{max-width:520px;color:#cbd5e1;font-size:18px}
.cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:18px;border-top:1px solid rgba(167,243,208,.2);padding-top:22px;font-family:Sora,sans-serif;font-size:13px}
.cover-meta small{display:block;color:#86efac;letter-spacing:.08em;text-transform:uppercase;font-size:10px;margin-bottom:4px}
.seal{
  width:86px;height:86px;border-radius:50%;
  background:conic-gradient(from 210deg,#34d399,#059669,#a7f3d0,#34d399);
  display:flex;align-items:center;justify-content:center;margin-left:auto;
}
.seal i{width:68px;height:68px;border-radius:50%;background:#06281f;display:flex;align-items:center;justify-content:center;
  font-style:normal;font-family:Sora,sans-serif;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-align:center;line-height:1.2;color:#a7f3d0}

.inner{padding:48px 56px 64px}
.toc h2,.chapter>h1{font-family:Sora,sans-serif}
.toc{page-break-after:always}
.toc ol{list-style:none;padding:0;margin:0}
.toc li{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-family:Sora,sans-serif;font-size:14.5px}
.toc a{color:var(--ink);text-decoration:none}
.toc a:hover{color:var(--em)}
.toc .n{color:var(--em);font-weight:800;margin-right:10px}

.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0 8px}
.kpi{background:var(--em-s);border:1px solid #a7f3d0;border-radius:12px;padding:12px 14px}
.kpi b{display:block;font-family:Sora,sans-serif;font-size:20px;color:var(--em-d)}
.kpi span{font-size:11px;color:var(--muted);font-family:Sora,sans-serif}

.chapter{page-break-before:always;padding-top:8px}
.chapter>h1{
  font-size:28px;letter-spacing:-.03em;margin:0 0 8px;padding-bottom:14px;
  border-bottom:3px solid var(--em);
}
.num{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--em);margin-bottom:6px;font-weight:700}

h2{font-family:Sora,sans-serif;font-size:18px;margin:28px 0 10px;letter-spacing:-.02em}
h3{font-family:Sora,sans-serif;font-size:15.5px;margin:20px 0 8px;color:var(--em-d)}
p{margin:0 0 12px}
ul,ol{margin:0 0 14px;padding-left:22px}
li{margin:0 0 5px}
strong{font-weight:700}
a{color:var(--em-d)}
blockquote{
  margin:16px 0;padding:12px 16px 12px 18px;background:var(--em-s);
  border-left:4px solid var(--em);border-radius:0 10px 10px 0;color:var(--em-d);
}
blockquote p:last-child{margin:0}
table{width:100%;border-collapse:collapse;margin:12px 0 20px;font-size:13.5px;font-family:Sora,sans-serif}
th{text-align:left;background:var(--em-d);color:#ecfdf5;padding:8px 10px;font-weight:600}
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
<section class="chapter" id="cierre">
  <div class="num">Cierre</div>
  <h1>Lo que se defiende</h1>
  <p>Este trabajo no presenta un mockup ni un token. Presenta un <strong>plan de negocio completo</strong> y un <strong>producto que ya ejecuta</strong> el relato del máster:</p>
  <ol>
    <li>La IA evalúa un reto real (Claude, ~€0,02).</li>
    <li>El resultado se guarda en una base de datos europea (Supabase).</li>
    <li>El candidato sella un <strong>SkillPass</strong>: solo el hash viaja a Ethereum Sepolia.</li>
    <li>Cualquiera verifica el sello en una página pública, sin cuenta TalentPact.</li>
  </ol>
  <div class="cards">
    <div class="card">
      <h3>Demo pública</h3>
      <p><a href="https://talentpact20.netlify.app/">talentpact20.netlify.app</a></p>
      <p class="caption">Candidato · empresa · SkillPass · verificador</p>
    </div>
    <div class="card">
      <h3>Verificador</h3>
      <p><a href="https://talentpact20.netlify.app/verify.html">verify.html</a></p>
      <p class="caption">JSON, hash 0x… o enlace ?h=</p>
    </div>
  </div>
</section>

<section class="chapter" id="anexos">
  <div class="num">Anexos</div>
  <h1>Evidencia del demo y fuentes</h1>

  <h2>A. SkillPass on-chain (Ethereum Sepolia)</h2>
  <p>Contrato <code>SkillPassRegistry</code> desplegado el 19 de agosto de 2026. On-chain solo se publica el hash; el JSON vive off-chain (RGPD).</p>
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
  <p class="caption">Barcelona. Máster en Fintech, Mercados Financieros y Blockchain. El investor deck citaba cuatro perfiles; este TFM lo firman únicamente los dos autores.</p>

  <h2>D. Referencias</h2>
  <ol class="refs">
    <li>SHRM (2024). <em>Talent Acquisition Benchmarking</em> — duración media del proceso de contratación.</li>
    <li>Glassdoor / Adecco — coste medio por contratación en España (~€4.700).</li>
    <li>ResumeLab (2024) — incidencia de información falsa o exagerada en CVs (78 %).</li>
    <li>Leadership IQ — fracasos de contratación atribuidos a soft skills (89 %).</li>
    <li>InfoJobs–Esade (2025). Estado del mercado laboral en España (vacantes, candidatos/vacante, paro juvenil).</li>
    <li>Mordor Intelligence (2026). Mercado global de recruiting.</li>
    <li>Future Market Insights — talent-acquisition technology (~$169 B, 2025).</li>
    <li>Reglamento (UE) 2024/1689 (AI Act), Anexo III — sistemas de alto riesgo en empleo.</li>
    <li>Reglamento (UE) 2016/679 (RGPD) y LOPDGDD.</li>
    <li>Ley 34/2002 (LSSI).</li>
    <li>Reglamento (UE) 2023/1114 (MiCA) — se cita para delimitar que el SkillPass no es un criptoactivo ofertado al público.</li>
    <li>W3C Verifiable Credentials Data Model; eIDAS 2.0 / EU Digital Identity Wallet (visión de interoperabilidad).</li>
    <li>Modelo financiero TalentPact, escenario base, 17/04/2026 (anexo Excel en <code>tfm/assets/</code>).</li>
    <li>Investigación primaria del equipo (2026): encuestas, entrevistas RRHH/Hays y tracción del MVP.</li>
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


def main() -> None:
    toc = []
    body = []
    for num, title, fname in CHAPTERS:
        raw = (ROOT / fname).read_text(encoding="utf-8")
        html = to_html(clean_md(raw))
        cid = f"cap-{num}"
        toc.append(f'<li><a href="#{cid}"><span><span class="n">{num}</span>{title}</span></a></li>')
        extra = kpi_strip() if num == "00" else ""
        label = "Documento" if num == "00" else f"Apartado {int(num)}"
        body.append(
            f'<section class="chapter" id="{cid}">'
            f'<div class="num">{label}</div><h1>{title}</h1>{extra}{html}</section>'
        )

    toc.append('<li><a href="#cierre"><span><span class="n">—</span>Cierre</span></a></li>')
    toc.append('<li><a href="#anexos"><span><span class="n">A–D</span>Anexos</span></a></li>')

    html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>TalentPact — Business Plan · TFM</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<style>{CSS}</style>
</head>
<body>
<div class="toolbar">
  <div><b>talent<span style="color:#34d399">pact</span></b> · Business Plan TFM</div>
  <div>
    <button type="button" onclick="window.print()">Guardar como PDF</button>
  </div>
</div>
<article class="sheet">
  <header class="cover">
    <div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div>
          <div class="brand">talent<span>pact</span></div>
          <p class="kicker" style="margin-top:28px">Trabajo Fin de Máster · Septiembre 2026</p>
        </div>
        <div class="seal"><i>Skill<br/>Pass</i></div>
      </div>
      <h1>Contrata por<br/><em>habilidades reales.</em><br/>No por currículum.</h1>
      <p class="lead">Plan de negocio de una fintech de talento anónimo: evaluación con IA, persistencia real y credencial verificable en blockchain.</p>
    </div>
    <div class="cover-meta">
      <div><small>Programa</small>Máster en Fintech, Mercados Financieros y Blockchain</div>
      <div><small>Autores</small>Xavier Griñó · Ivan Sánchez</div>
      <div><small>Documento</small>Business Plan · 8 apartados + anexos</div>
      <div><small>Demo</small>talentpact20.netlify.app</div>
    </div>
  </header>

  <div class="inner">
    <nav class="toc" id="indice">
      <div class="num">Contenido</div>
      <h2 style="font-family:Sora,sans-serif;font-size:28px;margin:0 0 18px;border-bottom:3px solid var(--em);padding-bottom:12px">Índice</h2>
      <ol>{''.join(toc)}</ol>
    </nav>
    {''.join(body)}
    {ANNEX}
  </div>
  <footer class="footer-doc">
    TalentPact · Business Plan TFM · Xavier Griñó e Ivan Sánchez · Documento interno académico · Las cifras financieras proceden del modelo base (17/04/2026).
  </footer>
</article>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"OK → {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
