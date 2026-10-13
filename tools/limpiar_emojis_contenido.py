"""Limpia emojis del contenido de los retos (enunciados, categorías, tablas).
✅/❌ pasan a ✓/✕, ⚠️ a su forma de texto monocroma, y el resto se quita.
El campo `icon:` de cada reto se conserva (dato), pero ya no se pinta: la
interfaz usa monogramas."""
import re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
EMO = re.compile('[\U0001F300-\U0001FAFF☀-⛿✀-➿⭐⬆⏩-⏺]️?')
def limpiar(s):
    # Protege los valores de icon:'…' (se reponen tal cual).
    iconos = []
    s = re.sub(r"icon:'[^']*'", lambda m: (iconos.append(m.group(0)), "\x00%d\x00" % (len(iconos) - 1))[1], s)
    s = s.replace('✅', '✓').replace('❌', '✕').replace('✔️', '✓').replace('✔', '✓').replace('✖️', '✕')
    s = s.replace('⚠️', '⚠︎').replace('⚠', '⚠︎').replace('⚠︎︎', '⚠︎')
    def quitar(m):
        c = m.group(0)
        if c[0] in '✓✕⚠✦→←↑↓': return c
        return ''
    s = EMO.sub(quitar, s)
    s = re.sub(r"(['`>]) +", r"\1", s) if False else s
    s = re.sub(r"'\s+([^'])", lambda m: "'" + m.group(1) if m.group(0).startswith("' ") and False else m.group(0), s)
    return re.sub("\x00(\\d+)\x00", lambda m: iconos[int(m.group(1))], s)
for f in ["01-datos-ofertas", "02-grabacion", "03-datos-retos", "07-retos-comunes", "10-paneles-y-pagos", "11-superadmin", "14-empleo", "16-pool-real"]:
    p = R / ("assets/js/app/%s.js" % f); s = p.read_text(encoding="utf-8"); n = limpiar(s)
    # Espacio sobrante al principio de una cadena tras quitar el emoji: '🔴 P1' → ' P1' → 'P1'
    n = re.sub(r"(['`])  ?(?=[A-ZÁÉÍÓÚÑ¿¡0-9])", lambda m: m.group(1), n) if False else n
    if n != s: p.write_text(n, encoding="utf-8"); print("limpiado", f)
