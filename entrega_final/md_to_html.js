/**
 * Conversor genérico Markdown → HTML imprimible (A4), sin dependencias.
 *
 * Uso:
 *   node md_to_html.js <entrada.md> <salida.html> "Título del documento"
 *
 * Pensado para exportar a PDF desde el navegador (Cmd/Ctrl+P → Guardar como PDF)
 * o vía Chrome headless (--print-to-pdf).
 */
const fs = require("fs");

const SRC = process.argv[2];
const OUT = process.argv[3];
const TITLE = process.argv[4] || "Documento";

if (!SRC || !OUT) {
  console.error("Uso: node md_to_html.js <entrada.md> <salida.html> \"Título\"");
  process.exit(1);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text) {
  const imgs = [];
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    imgs.push({ alt, src });
    return "\u0000IMG" + (imgs.length - 1) + "\u0000";
  });
  text = text.replace(/\\\*/g, "\u0000ESC_AST\u0000");
  text = escapeHtml(text);
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return "\u0000CODE" + (codes.length - 1) + "\u0000";
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => "<code>" + codes[+i] + "</code>");
  text = text.replace(/\u0000ESC_AST\u0000/g, "*");
  text = text.replace(/\u0000IMG(\d+)\u0000/g, (_, i) => {
    const { alt, src } = imgs[+i];
    return '<img src="' + src + '" alt="' + escapeHtml(alt) + '"/>';
  });
  return text;
}

function convert(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(escapeHtml(lines[i])); i++; }
      i++;
      out.push("<pre><code>" + buf.join("\n") + "</code></pre>");
      continue;
    }
    if (/^---\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const l = h[1].length; out.push("<h" + l + ">" + inline(h[2]) + "</h" + l + ">"); i++; continue; }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:\-|]+\|\s*$/.test(lines[i + 1])) {
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim())); i++; }
      let t = "<table><thead><tr>";
      header.forEach((c) => (t += "<th>" + inline(c) + "</th>"));
      t += "</tr></thead><tbody>";
      rows.forEach((r) => { t += "<tr>"; r.forEach((c) => (t += "<td>" + inline(c) + "</td>")); t += "</tr>"; });
      t += "</tbody></table>";
      out.push(t);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(inline(lines[i].replace(/^>\s?/, ""))); i++; }
      out.push("<blockquote>" + buf.join("<br/>") + "</blockquote>");
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { buf.push("<li>" + inline(lines[i].replace(/^\s*-\s+/, "")) + "</li>"); i++; }
      out.push("<ul>" + buf.join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push("<li>" + inline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>"); i++; }
      out.push("<ol>" + buf.join("") + "</ol>");
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }
    const buf = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !/^---\s*$/.test(lines[i]) && !/^\|.*\|\s*$/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*-\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push("<p>" + inline(buf.join(" ")) + "</p>");
  }
  return out.join("\n");
}

const CSS = `
:root{ --ink:#1f2933; --muted:#52616b; --accent:#0d9488; --accent2:#0f766e; --line:#e2e8f0; --code-bg:#f4f6f8; }
*{ box-sizing:border-box; }
html{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); line-height:1.6; max-width:820px; margin:0 auto; padding:56px 40px 80px; font-size:15px; }
h1{ font-size:30px; line-height:1.25; color:var(--accent2); margin:0 0 4px; letter-spacing:-.02em; }
h2{ font-size:22px; color:var(--accent2); margin:30px 0 12px; padding-bottom:6px; border-bottom:2px solid var(--accent); }
h3{ font-size:16px; color:var(--ink); margin:20px 0 8px; }
h4{ font-size:14px; color:var(--muted); margin:16px 0 6px; text-transform:uppercase; letter-spacing:.04em; }
p{ margin:9px 0; }
strong{ color:#0b3b39; }
hr{ border:none; border-top:1px solid var(--line); margin:22px 0; }
ul,ol{ margin:9px 0; padding-left:24px; }
li{ margin:4px 0; }
code{ background:var(--code-bg); border:1px solid var(--line); border-radius:4px; padding:1px 5px; font-family:"SF Mono",Menlo,Consolas,monospace; font-size:.86em; }
pre{ background:#0f172a; color:#e2e8f0; border-radius:8px; padding:14px 16px; overflow:auto; font-size:12.5px; line-height:1.5; }
pre code{ background:none; border:none; padding:0; color:inherit; }
blockquote{ margin:12px 0; padding:10px 16px; background:#f0fdfa; border-left:4px solid var(--accent); border-radius:0 6px 6px 0; color:#0b3b39; font-size:14.5px; }
img{ display:block; max-width:100%; height:auto; margin:14px auto 6px; border:1px solid var(--line); border-radius:8px; box-shadow:0 2px 10px rgba(15,23,42,.08); }
table{ width:100%; border-collapse:collapse; margin:14px 0; font-size:13.5px; }
th,td{ border:1px solid var(--line); padding:7px 10px; text-align:left; vertical-align:top; }
th{ background:var(--accent2); color:#fff; font-weight:600; }
tbody tr:nth-child(even){ background:#f8fafc; }
@page{ size:A4; margin:16mm 15mm; }
@media print{
  body{ padding:0; max-width:none; font-size:11.5pt; }
  h2,h3,h4{ page-break-after:avoid; }
  table,pre,blockquote,img{ page-break-inside:avoid; }
  tr{ page-break-inside:avoid; }
}
`;

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${TITLE}</title>
<style>${CSS}</style>
</head>
<body>
${convert(fs.readFileSync(SRC, "utf8"))}
</body>
</html>`;

fs.writeFileSync(OUT, html, "utf8");
console.log("Generado: " + OUT);
