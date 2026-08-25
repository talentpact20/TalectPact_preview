#!/usr/bin/env python3
"""
Generador de PDF para el Guion de Presentación de TalentPact (5 min).
"""

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Guion_Presentacion_5min.pdf")
FONTS_DIR = '/System/Library/Fonts/Supplemental'

# Colores
EMERALD = (5, 150, 105)
EMERALD_LIGHT = (209, 250, 229)
SLATE_900 = (15, 23, 42)
SLATE_700 = (51, 65, 85)
SLATE_500 = (100, 116, 139)
SLATE_400 = (148, 163, 184)
SLATE_200 = (226, 232, 240)
SLATE_100 = (241, 245, 249)
SLATE_50 = (248, 250, 252)
WHITE = (255, 255, 255)
RED = (239, 68, 68)
RED_LIGHT = (254, 226, 226)
AMBER = (245, 158, 11)
AMBER_LIGHT = (254, 243, 199)
BLUE = (59, 130, 246)
BLUE_LIGHT = (219, 234, 254)
VIOLET = (139, 92, 246)


class GuionPDF(FPDF):
    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.set_auto_page_break(auto=True, margin=22)
        self._in_cover = False
        self.add_font('Sans', '', os.path.join(FONTS_DIR, 'Arial.ttf'))
        self.add_font('Sans', 'B', os.path.join(FONTS_DIR, 'Arial Bold.ttf'))
        self.add_font('Sans', 'I', os.path.join(FONTS_DIR, 'Arial Italic.ttf'))
        self.add_font('Sans', 'BI', os.path.join(FONTS_DIR, 'Arial Bold Italic.ttf'))
        self.add_font('Mono', '', os.path.join(FONTS_DIR, 'Courier New.ttf'))
        self.add_font('Mono', 'B', os.path.join(FONTS_DIR, 'Courier New Bold.ttf'))

    def header(self):
        if self._in_cover or self.page_no() <= 1:
            return
        self.set_font("Sans", "B", 7)
        self.set_text_color(*SLATE_400)
        self.cell(0, 6, "TalentPact - Guion de Presentacion (5 min)", align="L")
        self.set_x(-30)
        self.cell(30, 6, f"Pag. {self.page_no()}", align="R")
        self.ln(3)
        self.set_draw_color(*SLATE_200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        if self._in_cover:
            return
        self.set_y(-12)
        self.set_font("Sans", "I", 6)
        self.set_text_color(*SLATE_400)
        self.cell(0, 5, "Xavier Grino & Ivan Sanchez  |  Master Fintech 2025-26", align="C")

    # ── Helpers ──

    def section(self, title):
        self.ln(3)
        self.set_font("Sans", "B", 15)
        self.set_text_color(*SLATE_900)
        self.cell(0, 9, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*EMERALD)
        self.set_line_width(0.7)
        self.line(10, self.get_y(), 75, self.get_y())
        self.set_line_width(0.2)
        self.ln(5)

    def subsection(self, title):
        self.ln(2)
        self.set_font("Sans", "B", 11)
        self.set_text_color(*SLATE_700)
        self.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text):
        self.set_font("Sans", "", 9)
        self.set_text_color(*SLATE_700)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def bullet(self, text, indent=12):
        self.set_font("Sans", "", 8.5)
        self.set_text_color(*SLATE_700)
        x = self.get_x()
        self.set_x(x + indent)
        self.cell(4, 4.5, chr(8226))
        self.multi_cell(0, 4.5, f"  {text}")
        self.ln(1)

    def checkbox(self, text, indent=12):
        self.set_font("Sans", "", 8.5)
        self.set_text_color(*SLATE_700)
        x = self.get_x()
        self.set_x(x + indent)
        # Draw checkbox
        y = self.get_y()
        self.set_draw_color(*SLATE_400)
        self.rect(x + indent, y + 0.5, 3.5, 3.5)
        self.set_x(x + indent + 6)
        self.multi_cell(0, 4.5, text)
        self.ln(1)

    def table(self, headers, rows, col_widths=None):
        w_total = self.w - self.l_margin - self.r_margin
        if col_widths is None:
            col_widths = [w_total / len(headers)] * len(headers)
        else:
            total = sum(col_widths)
            col_widths = [w * w_total / total for w in col_widths]

        est_h = (len(rows) + 1) * 7
        if self.get_y() + est_h > self.h - 25:
            self.add_page()

        self.set_fill_color(*SLATE_900)
        self.set_text_color(*WHITE)
        self.set_font("Sans", "B", 7)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, f" {h}", border=1, fill=True)
        self.ln()

        self.set_font("Sans", "", 7)
        for ri, row in enumerate(rows):
            bg = SLATE_50 if ri % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*SLATE_700)
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 6.5, f" {cell}", border=1, fill=True)
            self.ln()
        self.ln(3)

    def speaker_block(self, speaker, color, text):
        """Bloque de diálogo de un speaker."""
        w = self.w - self.l_margin - self.r_margin

        lines = text.strip().split('\n')
        line_h = 4.5
        text_h = len(lines) * line_h + 10
        if self.get_y() + text_h > self.h - 25:
            self.add_page()

        y = self.get_y()
        # Acento lateral
        self.set_fill_color(*color)
        self.rect(self.l_margin, y, 3, text_h, style='F')
        # Fondo
        bg = EMERALD_LIGHT if color == EMERALD else BLUE_LIGHT if color == BLUE else SLATE_50
        self.set_fill_color(*bg)
        self.rect(self.l_margin + 3, y, w - 3, text_h, style='F')

        # Speaker name
        self.set_xy(self.l_margin + 7, y + 3)
        self.set_font("Sans", "B", 8)
        self.set_text_color(*color)
        self.cell(0, 4.5, speaker)
        self.ln(5)

        # Text
        self.set_x(self.l_margin + 7)
        self.set_font("Sans", "", 8)
        self.set_text_color(*SLATE_700)
        for line in lines:
            self.set_x(self.l_margin + 7)
            self.multi_cell(w - 14, line_h, line)

        self.set_y(y + text_h + 3)

    def stage_direction(self, text):
        """Acotación escénica (lo que se hace en pantalla)."""
        self.set_font("Sans", "I", 7.5)
        self.set_text_color(*SLATE_500)
        self.set_x(self.l_margin + 7)
        self.multi_cell(0, 4, f"[{text}]")
        self.ln(2)

    def time_marker(self, time_str):
        """Marcador de tiempo."""
        w = self.w - self.l_margin - self.r_margin
        self.set_draw_color(*EMERALD)
        y = self.get_y()
        self.line(self.l_margin, y, self.l_margin + w, y)
        self.ln(2)
        self.set_font("Mono", "B", 8)
        self.set_text_color(*EMERALD)
        self.cell(0, 5, time_str, align="R")
        self.ln(5)

    def alert_box(self, text, color=AMBER):
        """Caja de alerta/nota."""
        w = self.w - self.l_margin - self.r_margin
        bg = AMBER_LIGHT if color == AMBER else RED_LIGHT if color == RED else EMERALD_LIGHT
        y = self.get_y()
        h = 12
        self.set_fill_color(*bg)
        self.rect(self.l_margin, y, w, h, style='F')
        self.set_fill_color(*color)
        self.rect(self.l_margin, y, 3, h, style='F')
        self.set_xy(self.l_margin + 6, y + 3)
        self.set_font("Sans", "B", 7.5)
        self.set_text_color(*color)
        self.multi_cell(w - 10, 4, text)
        self.set_y(y + h + 3)


def build_pdf():
    pdf = GuionPDF()

    # ═══════════════════════════════════════════════════════════
    #  PORTADA
    # ═══════════════════════════════════════════════════════════
    pdf._in_cover = True
    pdf.add_page()

    pdf.set_fill_color(*SLATE_900)
    pdf.rect(0, 0, 210, 297, style='F')
    pdf.set_fill_color(*EMERALD)
    pdf.rect(0, 0, 210, 4, style='F')

    pdf.set_y(55)
    pdf.set_font("Sans", "B", 8)
    pdf.set_text_color(*EMERALD)
    pdf.cell(0, 6, "MASTER EN FINTECH  -  BLOQUE DATA SCIENCE & IA  -  2025-26", align="C")
    pdf.ln(22)

    pdf.set_font("Sans", "B", 34)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 14, "TalentPact", align="C")
    pdf.ln(14)

    pdf.set_font("Sans", "", 16)
    pdf.set_text_color(*SLATE_400)
    pdf.cell(0, 8, "Guion de Presentacion y Demo", align="C")
    pdf.ln(8)
    pdf.set_font("Sans", "B", 12)
    pdf.set_text_color(*EMERALD)
    pdf.cell(0, 7, "5 minutos  -  2 presentadores", align="C")
    pdf.ln(14)

    pdf.set_draw_color(*EMERALD)
    pdf.set_line_width(0.8)
    pdf.line(70, pdf.get_y(), 140, pdf.get_y())
    pdf.set_line_width(0.2)
    pdf.ln(18)

    pdf.set_font("Sans", "", 11)
    pdf.set_text_color(*SLATE_400)
    pdf.cell(0, 6, "Xavier Grino  &  Ivan Sanchez", align="C")
    pdf.ln(20)

    # Bloques resumen en portada
    bloque_data = [
        ("0:00 - 0:45", "Intro + Landing", "Xavier"),
        ("0:45 - 2:15", "Demo Candidato + IA", "Ivan"),
        ("2:15 - 3:00", "Demo Empresa", "Xavier"),
        ("3:00 - 3:45", "PoC Terminal", "Ivan"),
        ("3:45 - 5:00", "Compliance + Cierre", "Ambos"),
    ]
    card_w = 34
    gap = 2
    total_w = len(bloque_data) * card_w + (len(bloque_data) - 1) * gap
    start_x = (210 - total_w) / 2
    y = pdf.get_y()

    for i, (time, title, who) in enumerate(bloque_data):
        x = start_x + i * (card_w + gap)
        pdf.set_fill_color(30, 41, 59)
        pdf.rect(x, y, card_w, 32, style='F')
        pdf.set_fill_color(*EMERALD)
        pdf.rect(x, y, card_w, 2.5, style='F')

        pdf.set_xy(x, y + 5)
        pdf.set_font("Mono", "", 6)
        pdf.set_text_color(*EMERALD)
        pdf.cell(card_w, 3.5, time, align="C")

        pdf.set_xy(x, y + 11)
        pdf.set_font("Sans", "B", 7)
        pdf.set_text_color(*WHITE)
        pdf.cell(card_w, 4, title, align="C")

        pdf.set_xy(x, y + 19)
        pdf.set_font("Sans", "", 6.5)
        pdf.set_text_color(*SLATE_400)
        pdf.cell(card_w, 3.5, who, align="C")

    pdf.set_y(y + 42)
    pdf.set_font("Sans", "I", 7)
    pdf.set_text_color(*SLATE_500)
    pdf.cell(0, 5, "Documento de coordinacion interna  -  No entregar al profesor", align="C")

    pdf._in_cover = False

    # ═══════════════════════════════════════════════════════════
    #  PARTE 1: COORDINACION
    # ═══════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section("Parte 1: Coordinacion")

    pdf.subsection("Que vamos a ensenar")
    pdf.table(
        ["#", "Que se muestra", "Quien", "Tiempo"],
        [
            ["1", "Landing page (hero, stats, retos, ofertas)", "Xavier", "~45s"],
            ["2", "Dashboard Candidato + evaluacion IA en vivo", "Ivan", "~90s"],
            ["3", "Dashboard Empresa + pool + desbloqueo", "Xavier", "~45s"],
            ["4", "PoC Agente Evaluador (terminal)", "Ivan", "~45s"],
            ["5", "Chatbot de soporte IA", "En pantalla", "~15s"],
            ["6", "Compliance + cierre", "Ambos", "~45s"],
        ],
        [6, 58, 14, 12]
    )

    pdf.subsection("Reparto de roles")
    pdf.table(
        ["Momento", "Xavier", "Ivan"],
        [
            ["Abre la presentacion", "SI - negocio + landing", ""],
            ["Demo candidato (+ larga)", "", "SI - retos + IA"],
            ["Demo empresa", "SI - pool + desbloqueo", ""],
            ["PoC terminal", "", "SI - script + CoT"],
            ["Compliance y cierre", "AI Act + RGPD", "Proximos pasos"],
            ["Q&A", "Responde lo que sepa", "Responde lo que sepa"],
        ],
        [30, 30, 30]
    )

    pdf.subsection("Preparacion ANTES de la presentacion")
    pdf.alert_box("IMPORTANTE: Hacer todo esto el dia antes de la presentacion. No improvisar.", AMBER)
    pdf.ln(1)
    pdf.checkbox("Abrir talentpact.netlify.app en Chrome (pestana 1)")
    pdf.checkbox("Tener index.html local como backup por si falla internet")
    pdf.checkbox("Abrir terminal con cd poc_entrega2 listo (pestana 2)")
    pdf.checkbox("Verificar API Key: echo $ANTHROPIC_API_KEY")
    pdf.checkbox("Probar que evaluacion IA funciona en el HTML (hacer un reto rapido)")
    pdf.checkbox("Probar que poc_evaluator.py ejecuta sin errores (~1 min)")
    pdf.checkbox("Tener el informe PDF abierto por si preguntan en Q&A")
    pdf.checkbox("Si es por videollamada: pantalla compartida lista")

    pdf.ln(3)
    pdf.subsection("Senales entre vosotros")
    pdf.bullet("\"Gracias, Xavier\" / \"Gracias, Ivan\" = paso el turno")
    pdf.bullet("Tocar la mesa = estamos pasando de tiempo, abrevia")
    pdf.bullet("Si la demo IA tarda >20 seg: \"Mientras carga, os cuento que...\" y seguir hablando")
    pdf.bullet("Si vais rapido: expandir Bloque 2 (mas retos, chatbot)")
    pdf.bullet("Si vais lentos: recortar Bloque 3 (decir \"el dashboard empresa es analogo\")")

    # ═══════════════════════════════════════════════════════════
    #  PARTE 2: GUION DETALLADO
    # ═══════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section("Parte 2: Guion Detallado")

    pdf.set_font("Sans", "I", 8)
    pdf.set_text_color(*SLATE_500)
    pdf.multi_cell(0, 4.5, "Leyenda:  Verde = Xavier habla  |  Azul = Ivan habla  |  Cursiva = acotacion de pantalla  |  Mono = tiempo")
    pdf.ln(4)

    # ── BLOQUE 1 ──
    pdf.subsection("BLOQUE 1: Introduccion + Landing Page (0:00 - 0:45)")

    pdf.stage_direction("PANTALLA: Landing page de TalentPact abierta, hero section visible.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Buenos dias. Somos Xavier Grino e Ivan Sanchez, y os presentamos\n"
        "TalentPact: una plataforma de contratacion por habilidades.\n"
        "\n"
        "El problema que resolvemos es simple: el 76% de los managers de\n"
        "contratacion reconocen que el CV no predice el rendimiento laboral.\n"
        "Los candidatos buenos se quedan fuera por sesgos - nombre, universidad,\n"
        "formato del documento - y las empresas pierden talento.\n"
        "\n"
        "TalentPact elimina el CV. En su lugar, los candidatos completan retos\n"
        "anonimos - tecnicos y cognitivos - evaluados por inteligencia artificial.\n"
        "Las empresas ven solo habilidades demostradas, no credenciales."
    )

    pdf.stage_direction("Xavier hace scroll lento por la landing mientras habla.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Aqui podeis ver la landing. \"Contrata por habilidades reales. No por\n"
        "curriculum.\" Tiene un catalogo de 102 retos con filtros por sector..."
    )

    pdf.stage_direction("Scroll hasta catalogo de retos, clic en uno para abrir panel preview.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "...cada reto tiene 3 niveles - basico, intermedio, avanzado - y skills\n"
        "asociados. Y abajo, las ofertas de empresas con busqueda por sector.\n"
        "\n"
        "El modelo de negocio es pay-per-result: las empresas pagan solo cuando\n"
        "desbloquean el contacto de un candidato, 49 euros por contacto. O un\n"
        "plan Pro a 199 euros/mes o Enterprise a 499 euros/mes."
    )

    pdf.time_marker("0:45")

    # ── BLOQUE 2 ──
    pdf.subsection("BLOQUE 2: Demo Candidato + Evaluacion IA (0:45 - 2:15)")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Ahora Ivan va a ensenar como funciona la experiencia del candidato."
    )

    pdf.stage_direction("Xavier pasa el control a Ivan. Clic en 'Empezar como candidato' > Login > Dashboard.")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Gracias. Cuando un candidato se registra - solo con email y contrasena,\n"
        "sin CV - accede a su panel."
    )

    pdf.stage_direction("Senalar las stats de arriba: retos completados, score medio, ranking, ofertas.")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Arriba tiene las metricas de su perfil: retos completados, score medio,\n"
        "posicion en el ranking y ofertas que encajan. Todo completamente anonimo\n"
        "- la empresa solo ve iniciales, sector y scores."
    )

    pdf.stage_direction("Clic en pestana 'Retos'.")

    pdf.speaker_block(
        "IVAN", BLUE,
        "En la pestana de Retos tiene las 102 categorias organizadas por tipo:\n"
        "soft skills como liderazgo o comunicacion, y retos sectoriales como\n"
        "Python, Excel, marketing digital. Puede filtrar y buscar."
    )

    pdf.stage_direction("Clic en un reto (ej: 'Pensamiento Analitico'). Escribir algo rapido y pulsar Enviar.")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Vamos a abrir un reto. Cada reto tiene 3 ejercicios con dificultad\n"
        "creciente. El candidato escribe su respuesta en texto libre...\n"
        "\n"
        "...y cuando envia, la respuesta va a nuestra Netlify Function en el\n"
        "backend, que la manda a la API de Claude Sonnet 4 de Anthropic con la\n"
        "rubrica inyectada dinamicamente en el system prompt. Esto es lo que\n"
        "llamamos Dynamic Prompting."
    )

    pdf.stage_direction("Esperar a que aparezca la evaluacion. Senalar el resultado.")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Y aqui esta la evaluacion. La IA devuelve: un score de 0 a 100,\n"
        "feedback estructurado por criterios, y recomendaciones de mejora.\n"
        "Todo auditable, todo trazable.\n"
        "\n"
        "Esto funciona con cualquiera de los 102 retos sin cambiar una linea de\n"
        "codigo. La inteligencia evaluadora esta en las rubricas de la base de\n"
        "datos, no en el codigo del agente."
    )

    pdf.time_marker("2:15")

    # ── BLOQUE 3 ──
    pdf.subsection("BLOQUE 3: Demo Empresa + Pool de Talento (2:15 - 3:00)")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Xavier, ensenanos la vista de empresa."
    )

    pdf.stage_direction("Ivan devuelve control. Cerrar sesion candidato > 'Acceso empresa' > Login > Dashboard empresa.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Esta es la vista de empresa. Aqui puede publicar ofertas con sus propios\n"
        "retos personalizados - o usar los comunes de TalentPact - elegir sector,\n"
        "descripcion, salario."
    )

    pdf.stage_direction("Clic rapido en 'Publicar oferta' para mostrar formulario.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Pero lo mas potente es el pool de talento anonimo. Aqui la empresa ve\n"
        "candidatos ordenados por skill score. Solo iniciales, sector y habilidades\n"
        "verificadas. Cero datos personales.\n"
        "\n"
        "Cuando quiere contactar a un candidato, paga 49 euros por desbloquear su\n"
        "contacto. Modelo pay-per-result: solo pagas si el talento te interesa.\n"
        "Y tiene planes: Free, Pro y Enterprise."
    )

    pdf.time_marker("3:00")

    # ── BLOQUE 4 ──
    pdf.subsection("BLOQUE 4: PoC Agente Evaluador en Terminal (3:00 - 3:45)")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Ahora Ivan va a ensenar la PoC tecnica del Agente Evaluador que\n"
        "desarrollamos para validar el motor de IA."
    )

    pdf.stage_direction("Cambiar a terminal. Mostrar salida de poc_evaluator.py (pre-ejecutada).")

    pdf.speaker_block(
        "IVAN", BLUE,
        "Aqui tenemos poc_evaluator.py, escrito en Python, que evalua 4 candidatos\n"
        "contra 2 retos distintos - uno de codigo Python y otro de logica de negocio.\n"
        "\n"
        "Cada evaluacion usa 5 tecnicas de prompting: Role Prompting, Chain of\n"
        "Thought, Dynamic Prompting, Constitutional AI y Self-Consistency con\n"
        "temperature=0.\n"
        "\n"
        "Resultados clave:\n"
        "- Candidato Alpha (solucion excelente Python): 96/100\n"
        "- Candidato Beta (intento prompt injection): 0/100 + alerta seguridad\n"
        "- Candidato Gamma (negocio excelente): 91/100\n"
        "- Candidato Delta (respuestas genericas): 10/100\n"
        "\n"
        "Diferencial de 86 puntos. El modelo discrimina con precision.\n"
        "Coste por evaluacion: solo 0,017 euros, 57% bajo nuestro objetivo."
    )

    pdf.time_marker("3:45")

    # ── BLOQUE 5 ──
    pdf.subsection("BLOQUE 5: Compliance + Cierre (3:45 - 5:00)")

    pdf.stage_direction("PANTALLA: Puede quedarse en terminal o volver a landing. No importa, es hablado.")

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "Un aspecto diferencial de TalentPact es que hemos abordado el compliance\n"
        "desde el dia uno. Como sistema de IA que evalua candidatos, estamos\n"
        "clasificados como sistema de alto riesgo bajo el EU AI Act - Anexo III,\n"
        "punto 4a.\n"
        "\n"
        "Hemos documentado obligaciones en cuatro marcos regulatorios:\n"
        "EU AI Act - trazabilidad con CoT, transparencia, supervision humana;\n"
        "RGPD y LOPDGDD - anonimizacion por diseno;\n"
        "LSSI - aviso legal;\n"
        "PCI DSS - pagos tokenizados via Stripe."
    )

    pdf.speaker_block(
        "IVAN", BLUE,
        "Para cerrar, los proximos pasos son tres fases:\n"
        "Fase 1: beta privada con 50 candidatos y 10 empresas piloto.\n"
        "Fase 2: compliance y produccion - registro ante la AESIA, Stripe.\n"
        "Fase 3: escalado a 200+ retos, colas asincronas, app movil."
    )

    pdf.speaker_block(
        "XAVIER", EMERALD,
        "TalentPact demuestra que es posible construir un sistema de seleccion\n"
        "de talento justo, trazable y escalable usando agentes de IA con Dynamic\n"
        "Prompting y Chain of Thought. Y todo con un coste de menos de 2 centimos\n"
        "por evaluacion.\n"
        "\n"
        "Gracias. Estamos a vuestra disposicion para preguntas."
    )

    pdf.time_marker("5:00  FIN")

    # ═══════════════════════════════════════════════════════════
    #  PARTE 3: Q&A
    # ═══════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section("Parte 3: Preguntas Q&A Preparadas")

    pdf.body("Estas son las 10 preguntas mas probables que os hara el profesor. Preparad las respuestas.")

    qa_items = [
        ("Que pasa si el modelo alucina?", "Ivan",
         "CoT obliga a razonar criterio a criterio. Si razonamiento no coincide con score, se marca para revision humana. LLM-as-a-judge en produccion como segundo verificador."),
        ("Como garantizais la equidad?", "Xavier",
         "Constitutional AI en el system prompt + evaluacion ciega (sin datos demograficos) + disparate impact ratio objetivo >0,80."),
        ("Por que no usais un modelo open-source?", "Ivan",
         "Claude Sonnet 4 es SOTA en razonamiento estructurado. Para produccion evaluaremos Llama/Mistral como fallback, pero la calidad de evaluacion es critica para el producto."),
        ("Como escalais a miles de evaluaciones?", "Ivan",
         "Cola asincrona Redis + workers asyncio. Tier 3 de Anthropic (200K tokens/min). Circuit breaker si error rate >5%."),
        ("El coste de 0,017 euros es realista?", "Xavier",
         "Si, medido en ejecucion real: ~2.000 tokens input x $3/MTok + ~850 tokens output x $15/MTok. A 10.000 eval/mes = ~600 euros/mes en API, absorbible en modelo SaaS B2B."),
        ("Que normativa os aplica?", "Xavier",
         "EU AI Act (alto riesgo, Anexo III 4.a), RGPD/LOPDGDD (datos personales candidatos), LSSI (web comercial), PCI DSS (pagos Stripe)."),
        ("Como evitais el prompt injection?", "Ivan",
         "Triple capa: instruccion en system prompt, separacion estructural (rubrica en system, respuesta en user), campo alerta_seguridad. Probado: CAND_BETA recibio score 0 + alerta."),
        ("Que metricas os faltan?", "Ambos",
         "Kappa Cohen (inter-rater agreement) con evaluadores humanos, accuracy vs. experto, hallucination rate con LLM-juez. Requieren datos reales de candidatos beta."),
        ("Que papel juega el Vibe Coding?", "Xavier",
         "Se ha usado para generar y refinar componentes de UI, prompts del evaluador, flujos de negocio y rubricas. Siempre con supervision y validacion humana."),
        ("Como habeis hecho la landing?", "Xavier",
         "Single-page application con HTML5 + CSS3 + Vanilla JS. Zero dependencies, sin frameworks. 5.000+ lineas. Sistema de diseno propio con 30+ variables CSS."),
    ]

    for i, (pregunta, quien, respuesta) in enumerate(qa_items, 1):
        if pdf.get_y() > 240:
            pdf.add_page()

        # Question
        self = pdf
        y = pdf.get_y()
        pdf.set_font("Sans", "B", 8)
        pdf.set_text_color(*SLATE_900)
        pdf.cell(6, 5, f"{i}.")
        pdf.multi_cell(0, 5, f"\"{pregunta}\"")

        # Who responds
        pdf.set_x(pdf.l_margin + 6)
        pdf.set_font("Sans", "B", 7)
        color = EMERALD if quien == "Xavier" else BLUE if quien == "Ivan" else VIOLET
        pdf.set_text_color(*color)
        pdf.cell(0, 4, f"Responde: {quien}")
        pdf.ln(4)

        # Answer
        pdf.set_x(pdf.l_margin + 6)
        pdf.set_font("Sans", "", 7.5)
        pdf.set_text_color(*SLATE_700)
        pdf.multi_cell(0, 4, respuesta)
        pdf.ln(4)

    # ═══════════════════════════════════════════════════════════
    #  PARTE 4: CHECKLIST DIA D
    # ═══════════════════════════════════════════════════════════
    pdf.add_page()
    pdf.section("Parte 4: Checklist Dia de la Presentacion")

    pdf.subsection("30 minutos antes")
    pdf.checkbox("Abrir Chrome con talentpact.netlify.app (pestana 1)")
    pdf.checkbox("Abrir terminal con cd poc_entrega2 listo (pestana 2)")
    pdf.checkbox("Verificar echo $ANTHROPIC_API_KEY devuelve algo")
    pdf.checkbox("Ejecutar python poc_evaluator.py para tener resultados")
    pdf.checkbox("Tener el PDF del informe abierto (pestana 3)")
    pdf.checkbox("Pantalla compartida lista (si es videollamada)")

    pdf.ln(3)
    pdf.subsection("5 minutos antes")
    pdf.checkbox("Landing page en pestana activa, scroll al top")
    pdf.checkbox("Xavier tiene el micro activo")
    pdf.checkbox("Ivan tiene la terminal lista")
    pdf.checkbox("Ambos con el guion impreso o en segunda pantalla")

    pdf.ln(3)
    pdf.subsection("Resumen de tiempos")

    pdf.table(
        ["Bloque", "Tiempo", "Quien", "Que mostrar"],
        [
            ["1. Intro + Landing", "0:00 - 0:45", "Xavier", "Landing, scroll, catalogo retos"],
            ["2. Demo Candidato", "0:45 - 2:15", "Ivan", "Login, retos, evaluacion IA en vivo"],
            ["3. Demo Empresa", "2:15 - 3:00", "Xavier", "Pool talento, desbloqueo, planes"],
            ["4. PoC Terminal", "3:00 - 3:45", "Ivan", "poc_evaluator.py, 4 candidatos, CoT"],
            ["5. Cierre", "3:45 - 5:00", "Ambos", "Compliance, proximos pasos, gracias"],
        ],
        [25, 18, 14, 53]
    )

    pdf.ln(4)
    pdf.alert_box("Duracion total objetivo: 5:00 min  |  Margen: +/- 30 seg", EMERALD)

    # ═══════════════════════════════════════════════════════════
    #  GUARDAR
    # ═══════════════════════════════════════════════════════════
    pdf.output(OUTPUT_FILE)
    print(f"\n  PDF generado: {OUTPUT_FILE}")
    print(f"   Paginas: {pdf.page_no()}")


if __name__ == "__main__":
    build_pdf()
