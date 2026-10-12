"""Sustituye los emojis de la interfaz por iconos de línea y corrige textos.
Se ejecuta una vez; queda en el repo como registro de lo que se cambió."""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from iconos import svg

R = pathlib.Path(__file__).resolve().parent.parent
def rw(rel, fn):
    p = R / rel; s = p.read_text(encoding="utf-8"); n = fn(s)
    if n != s: p.write_text(n, encoding="utf-8"); print("actualizado", rel)

def rep(s, a, b, n=None):
    c = s.count(a)
    if c == 0: raise SystemExit("no encontrado: " + a[:80])
    if n is not None and c != n: raise SystemExit("esperaba %d, hay %d: %s" % (n, c, a[:60]))
    return s.replace(a, b)

def html(s):
    # Menú de acceso: sin entrada pública al backoffice (solo se muestra a quien tiene rol admin).
    s = rep(s, '<div class="access-icon" style="background:var(--emerald-50);color:var(--emerald-600)">🎯</div>',
            '<div class="access-icon" style="background:var(--emerald-50);color:var(--emerald-600)">' + svg("user") + '</div>')
    s = rep(s, '<div class="access-icon" style="background:var(--blue-100);color:var(--blue-500)">🏢</div>',
            '<div class="access-icon" style="background:var(--blue-100);color:var(--blue-500)">' + svg("building") + '</div>')
    s = rep(s, '<div class="access-option" onclick="closeAccessMenu();openAdmin()" style="border-top:1px solid var(--slate-100)"><div class="access-icon" style="background:rgba(239,68,68,.08);color:#ef4444">⚙️</div><div><h4>Admin</h4><p>Panel de administración</p></div></div>',
            '<div class="access-option" id="accessAdmin" onclick="closeAccessMenu();openAdmin()" style="display:none;border-top:1px solid var(--slate-100)"><div class="access-icon" style="background:var(--slate-100);color:var(--slate-700)">' + svg("settings") + '</div><div><h4>Backoffice</h4><p>Métricas, evaluaciones y pagos</p></div></div>')
    # Tarjetas de los modales de acceso: icono + textos que dicen lo que el producto hace.
    feats = [
        ('🔒', 'Perfil 100% anónimo', 'Las empresas solo ven tus skills y puntuaciones.', 'lock', 'Perfil anónimo', 'Las empresas ven tus skills y notas, nunca tu nombre ni tu foto.'),
        ('⚡', 'Retos prácticos reales', 'Sandboxes que replican situaciones laborales.', 'layers', 'Retos prácticos reales', 'Escenarios que replican situaciones de trabajo, corregidos con una rúbrica.'),
        ('📊', 'Ranking y visibilidad', 'Mejor puntuación = más visibilidad ante empresas.', 'trending', 'Visibilidad por mérito', 'Tus mejores notas verificadas te sitúan ante las empresas.'),
        ('🎯', 'Perfiles ciegos', 'Solo ves skills, scores y ranking.', 'eye', 'Perfiles ciegos', 'Skills, notas verificadas y condiciones. Sin nombre, foto ni edad.'),
        ('💰', 'Success fee', 'Solo pagas cuando contratas.', 'wallet', 'Pago por resultado', '49 € por contacto desbloqueado. Sin licencia ni permanencia.'),
        ('🔒', 'Kill Switch', 'Al contratar, el perfil desaparece del pool.', 'shield-check', 'Integridad verificada', 'Cada nota lleva un recibo firmado y un informe de integridad.'),
    ]
    for e, h, p, ic, h2, p2 in feats:
        s = rep(s, '<div class="auth-feat-icon">%s</div><div><h4>%s</h4><p>%s</p>' % (e, h, p),
                '<div class="auth-feat-icon">%s</div><div><h4>%s</h4><p>%s</p>' % (svg(ic), h2, p2))
    s = rep(s, '<h3>Match & Kill Switch</h3><p>Al ser contratado, tu perfil desaparece del pool. Talento siempre activo.</p>',
            '<h3>Tú controlas tu visibilidad</h3><p>Ocúltate del pool o retira el permiso de contacto cuando quieras, desde tus ajustes.</p>')
    # Hero y portada: fuera la etiqueta de versión preliminar y el lema en monoespaciada.
    s = re.sub(r'\s*<div class="preview-banner">.*?</div>\s*</div>', '', s, count=1, flags=re.S)
    s = rep(s, '<div class="hero-badge"><div class="hero-badge-dot"></div><span class="mono" style="font-size:.6875rem;letter-spacing:.04em">PROVE. CONNECT. HIRE.</span></div>',
            '<div class="hero-badge"><div class="hero-badge-dot"></div><span>Selección por competencias · evaluación con IA supervisada</span></div>')
    s = rep(s, '<h1 class="display">Contrata por<br><span class="gradient-text">habilidades reales.</span><br>No por <span style="text-decoration:line-through;color:var(--slate-400)">currículum.</span></h1>',
            '<h1 class="display">Contrata por habilidades<br><span class="gradient-text">demostradas</span>, no por currículum.</h1>')
    # Iconos sueltos con significado.
    pares = {
        '<span class="search-icon">🔍</span>': '<span class="search-icon">' + svg("search") + '</span>',
        '<h3>🏆 Leaderboard Global</h3>': '<h3>' + svg("trophy") + ' Ranking</h3>',
        '<span>❓</span><h4>': '<span>' + svg("help") + '</span><h4>',
        '<span>🐛</span><h4>': '<span>' + svg("bug") + '</span><h4>',
        '<span>📧</span><h4>': '<span>' + svg("mail") + '</span><h4>',
        '>📧 hello@talentpact.io</a>': '>' + svg("mail") + ' hello@talentpact.io</a>',
        '>💬 Chat en vivo</button>': '>' + svg("message") + ' Chat de soporte</button>',
        '>🟢 Básico <span': '><span class="lvl-dot lvl-basico"></span>Básico <span',
        '>🟡 Intermedio <span': '><span class="lvl-dot lvl-intermedio"></span>Intermedio <span',
        '>🔴 Avanzado <span': '><span class="lvl-dot lvl-avanzado"></span>Avanzado <span',
        '<h5>📋 Retos comunes': '<h5>Retos comunes',
        '<h5>🏢 Solo retos': '<h5>Solo retos',
        '<h5>🎯 Ejercicios diseñados': '<h5>Ejercicios diseñados',
        'display:flex;gap:8px">🔒 <span>': 'display:flex;gap:8px">' + svg("lock") + ' <span>',
        '<div class="st-danger-title">⚠️ Zona de peligro</div>': '<div class="st-danger-title">' + svg("alert") + ' Zona de peligro</div>',
        '<div class="rpl-preview-empty"><span>👈</span>': '<div class="rpl-preview-empty"><span>' + svg("list") + '</span>',
        'aria-label="Abrir chat de soporte">💬</button>': 'aria-label="Abrir chat de soporte">' + svg("message") + '</button>',
        '<div class="ai-chat-avatar">🤖</div>': '<div class="ai-chat-avatar">' + svg("sparkles") + '</div>',
        '<span style="font-size:1.2rem">🤖</span>': '<span style="font-size:1.2rem">' + svg("sparkles") + '</span>',
        '0px 12px;font-size:.72rem;color:var(--emerald-600);margin-bottom:4px">🔒 Tus datos': '0px 12px;font-size:.72rem;color:var(--emerald-600);margin-bottom:4px">' + svg("lock") + ' Tus datos',
    }
    for a, b in pares.items():
        s = rep(s, a, b)
    # Art. 50 AI Act: el chat se presenta como asistente con IA.
    s = rep(s, '<div class="ai-chat-status">Disponible 24/7</div>',
            '<div class="ai-chat-status">Asistente con IA · puede equivocarse. Para casos concretos: hello@talentpact.io</div>')
    s = rep(s, '¡Hola! Soy el asistente de TalentPact. Puedo ayudarte',
            'Hola, soy el asistente de TalentPact, un sistema de inteligencia artificial. Puedo ayudarte')
    return s

rw("index.html", html)

def js08(s):
    s = rep(s, '<div class="apply-summary-icon">🎉</div>', '<div class="apply-summary-icon">${tpIcon(\'check-circle\')}</div>')
    s = rep(s, '<div class="apply-summary-icon">⚡</div>', '<div class="apply-summary-icon">${tpIcon(\'zap\')}</div>')
    s = rep(s, '<div class="apply-section-title">📋 Skills requeridos', '<div class="apply-section-title">Skills requeridos')
    s = rep(s, '<div class="apply-section-title">🏢 Retos adicionales', '<div class="apply-section-title">Retos adicionales')
    s = rep(s, '<strong>📞 Ejercicios a medida</strong>', '<strong>Ejercicios a medida</strong>')
    s = rep(s, 'font-size:1.5rem;margin-bottom:14px">✅</div>', 'font-size:1.5rem;margin-bottom:14px">${tpIcon(\'check-circle\')}</div>')
    s = rep(s, 'font-size:1.5rem;margin-bottom:14px">🎉</div>', 'font-size:1.5rem;margin-bottom:14px">${tpIcon(\'check-circle\')}</div>')
    s = rep(s, "const typeIcons={analysis:'📊',email:'✍️',decision:'⚡',audio:'🎙️',video:'📹',cognitive:'🧠',image_audit:'🔍'};",
            "const typeIcons={analysis:'chart',email:'pen',decision:'list',audio:'mic',video:'video',cognitive:'bulb',image_audit:'search',upload:'paperclip'};")
    s = rep(s, "${typeIcons[ex.type]||'📋'}", "${tpIcon(typeIcons[ex.type]||'clipboard')}")
    s = rep(s, '<span class="ex-meta-pill time-pill">⏱ ', '<span class="ex-meta-pill time-pill">${tpIcon(\'clock\')} ')
    s = rep(s, '<div class="ex-briefing-warn">⚠️ Cuando pulses', '<div class="ex-briefing-warn">${tpIcon(\'alert\')} Cuando pulses')
    s = rep(s, '<div class="rec-label">🎙️ ', '<div class="rec-label">${tpIcon(\'mic\')} ')
    s = rep(s, '<div class="rec-label">📹 ', '<div class="rec-label">${tpIcon(\'video\')} ', 2)
    s = rep(s, '<div class="audit-badge">⏱ Analiza</div>', '<div class="audit-badge">${tpIcon(\'clock\')} Analiza</div>')
    s = rep(s, '<span class="ex-upload-icon">📎</span>', '<span class="ex-upload-icon">${tpIcon(\'paperclip\')}</span>')
    s = rep(s, '<span class="file-icon">📄</span>', '<span class="file-icon">${tpIcon(\'file\')}</span>')
    s = rep(s, "<span class=\\\\'ex-upload-icon\\\\'>📎</span>", "<span class=\\\\'ex-upload-icon\\\\'>'+tpIcon('paperclip')+'</span>")
    s = rep(s, "const badge=fb.blockedByFilter?'⛔ Bloqueado por el filtro anti-manipulación':isAI?'🤖 Evaluado con IA':'📊 Evaluación automática';",
            "const badge=fb.blockedByFilter?tpIcon('shield')+' Bloqueado por el filtro anti-manipulación':isAI?tpIcon('sparkles')+' Corregido con IA':tpIcon('chart')+' Corrección automática de reserva';")
    return s
rw("assets/js/app/08-ofertas-y-ejercicios.js", js08)

def js10(s):
    s = rep(s, "${allMet?'✅ Cumples requisitos':'⚡ '+hasCount", "${allMet?tpIcon('check')+' Cumples requisitos':''+hasCount")
    s = rep(s, '>🔓 Desbloquear · €49</button>', '>${tpIcon(\'unlock\')} Desbloquear · 49 €</button>')
    s = rep(s, '<p style="font-size:1.5rem;margin-bottom:8px">🔎</p>', '<p style="font-size:1.5rem;margin-bottom:8px">${tpIcon(\'search\')}</p>')
    s = rep(s, '<div class="rpl-preview-empty"><span>🔍</span>', '<div class="rpl-preview-empty"><span>\'+tpIcon(\'search\')+\'</span>')
    s = rep(s, '<div class="rpl-pv-warn"><span>⚠️</span>', '<div class="rpl-pv-warn"><span>${tpIcon(\'alert\')}</span>')
    s = rep(s, '<span class="rpl-pv-timer">⏱ ', '<span class="rpl-pv-timer">${tpIcon(\'clock\')} ', 2)
    s = rep(s, '<div class="rpl-item-icon">${ce.icon}</div>', '<div class="rpl-item-icon">${tpMonograma(ce.title,ce.category)}</div>') if '<div class="rpl-item-icon">${ce.icon}</div>' in s else s
    return s
rw("assets/js/app/10-paneles-y-pagos.js", js10)

def js12(s):
    s = rep(s, "fab.textContent=isOpen?'💬':'✕';", "fab.innerHTML=isOpen?tpIcon('message'):tpIcon('x');")
    s = rep(s, "${pos<=3?['🥇','🥈','🥉'][pos-1]:pos}", "${pos}")
    s = rep(s, "'<strong>⭐ Tú</strong>'", "'<strong>Tú</strong>'")
    return s
rw("assets/js/app/12-soporte-y-ranking.js", js12)
