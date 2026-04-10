// ════════════════════════════════════════════════════════════════
//  TALENTPACT — Google Analytics 4 · Eventos Personalizados
//  Measurement ID: G-JN1K33D5YZ
//  Versión: 1.0
// ════════════════════════════════════════════════════════════════
//
//  CÓMO USAR:
//  Añade esta línea al final de tu HTML, justo antes de </body>:
//  <script src="analytics-talentpact.js"></script>
//
// ════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // Helper — solo envía si gtag está disponible
  function track(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }


  // ── 1. SCROLL DEPTH ──────────────────────────────────────────
  // Mide hasta dónde leen la landing. Crítico para saber si el
  // pitch llega a leerse o se van antes.
  var _scrollFired = {};
  window.addEventListener('scroll', function() {
    var pct = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    [25, 50, 75, 90].forEach(function(depth) {
      if (pct >= depth && !_scrollFired[depth]) {
        _scrollFired[depth] = true;
        track('scroll_depth', {
          event_category: 'engagement',
          depth_percent: depth
        });
      }
    });
  }, { passive: true });


  // ── 2. CTAs DEL HERO ─────────────────────────────────────────
  // "Empieza gratis" y "Ver demo" — los 2 botones más importantes
  // de toda la landing. Su ratio te dice si el mensaje engancha.
  document.addEventListener('DOMContentLoaded', function() {

    // Hero CTA principal: "Empieza gratis →"
    var heroCtaPrimary = document.querySelector('.hero-cta .btn-primary');
    if (heroCtaPrimary) {
      heroCtaPrimary.addEventListener('click', function() {
        track('cta_click', {
          event_category: 'conversion',
          cta_location: 'hero',
          cta_label: heroCtaPrimary.textContent.trim(),
          cta_type: 'candidate_signup'
        });
      });
    }

    // Hero CTA secundario: "Ver demo"
    var heroCtaSecondary = document.querySelector('.hero-cta .btn-outline, .hero-cta .btn-ghost');
    if (heroCtaSecondary) {
      heroCtaSecondary.addEventListener('click', function() {
        track('cta_click', {
          event_category: 'engagement',
          cta_location: 'hero',
          cta_label: heroCtaSecondary.textContent.trim(),
          cta_type: 'demo_view'
        });
      });
    }


    // ── 3. MENÚ DE ACCESO (nav dropdown) ─────────────────────
    // El dropdown tiene "Soy candidato" y "Soy empresa".
    // Este evento te dice qué perfil atrae más.
    var accessOptions = document.querySelectorAll('.access-option');
    accessOptions.forEach(function(opt) {
      opt.addEventListener('click', function() {
        var label = opt.querySelector('h4');
        track('access_menu_click', {
          event_category: 'navigation',
          user_type: label ? label.textContent.trim() : 'unknown'
        });
      });
    });


    // ── 4. APERTURA DE DASHBOARDS ────────────────────────────
    // Saber cuántos abren el panel de candidato vs empresa
    // revela qué segmento está más interesado.
    var _origOpenDashCand = window.openDashCandidate;
    if (typeof window.openDashCandidate === 'function') {
      window.openDashCandidate = function() {
        track('dashboard_open', {
          event_category: 'demo_engagement',
          dashboard_type: 'candidate'
        });
        _origOpenDashCand.apply(this, arguments);
      };
    }

    var _origOpenDashEmp = window.openDashEmp;
    if (typeof window.openDashEmp === 'function') {
      window.openDashEmp = function() {
        track('dashboard_open', {
          event_category: 'demo_engagement',
          dashboard_type: 'empresa'
        });
        _origOpenDashEmp.apply(this, arguments);
      };
    }


    // ── 5. RETOS: inicio y finalización ──────────────────────
    // El evento más importante del producto: ¿la gente realmente
    // hace retos? ¿cuál es el más popular? ¿cuántos lo terminan?

    // Apertura de un reto (modal de job)
    var _origOpenJobModal = window.openJobModal;
    if (typeof window.openJobModal === 'function') {
      window.openJobModal = function(jobId) {
        track('reto_open', {
          event_category: 'product_engagement',
          reto_id: jobId || 'unknown'
        });
        _origOpenJobModal.apply(this, arguments);
      };
    }

    // Click en "Empezar reto" (btn-launch)
    document.addEventListener('click', function(e) {
      var launch = e.target.closest('.btn-launch');
      if (launch) {
        var modal = launch.closest('[id]');
        track('reto_start', {
          event_category: 'product_engagement',
          reto_context: modal ? modal.id : 'unknown'
        });
      }
    });

    // Envío de respuesta (submitAnswer)
    var _origSubmitAnswer = window.submitAnswer;
    if (typeof window.submitAnswer === 'function') {
      window.submitAnswer = function() {
        track('reto_submit', {
          event_category: 'product_engagement',
          action: 'answer_submitted'
        });
        _origSubmitAnswer.apply(this, arguments);
      };
    }


    // ── 6. SCORE RECIBIDO ────────────────────────────────────
    // Captura el score que la IA devuelve. Permite saber la
    // distribución de scores y detectar si son demasiado bajos
    // (lo que desmotivaría a candidatos).
    var _origShowResult = window.showExResult;
    if (typeof window.showExResult === 'function') {
      window.showExResult = function(score) {
        var bucket = score >= 75 ? 'alto' : score >= 50 ? 'medio' : 'bajo';
        track('reto_score_received', {
          event_category: 'product_outcome',
          score_value: score,
          score_bucket: bucket
        });
        _origShowResult.apply(this, arguments);
      };
    }


    // ── 7. FILTROS DE BÚSQUEDA DE OFERTAS ────────────────────
    // ¿Qué sectores buscan más los candidatos?
    // Revela qué categorías tienen más demanda en tu plataforma.
    var filterBtns = document.querySelectorAll('.filters-row .filter-btn');
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        track('job_filter_click', {
          event_category: 'search_behavior',
          filter_sector: btn.textContent.trim()
        });
      });
    });

    // Búsqueda en el buscador de ofertas
    var searchBar = document.getElementById('jobSearch');
    var _searchTimer;
    if (searchBar) {
      searchBar.addEventListener('input', function() {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function() {
          if (searchBar.value.trim().length > 2) {
            track('job_search', {
              event_category: 'search_behavior',
              search_term: searchBar.value.trim().toLowerCase()
            });
          }
        }, 800);
      });
    }


    // ── 8. APERTURA DE OFERTA (job card) ────────────────────
    // ¿Qué ofertas generan más curiosidad?
    document.addEventListener('click', function(e) {
      var card = e.target.closest('.job-card');
      if (card) {
        var badge = card.querySelector('.job-badge');
        var title = card.querySelector('h3, .job-title');
        track('job_card_click', {
          event_category: 'job_engagement',
          job_sector: badge ? badge.textContent.trim() : 'unknown',
          job_title: title ? title.textContent.trim() : 'unknown'
        });
      }
    });


    // ── 9. FORMULARIO DE CONTACTO ────────────────────────────
    // Apertura del modal de contacto
    var _origOpenContact = window.openContact;
    if (typeof window.openContact === 'function') {
      window.openContact = function() {
        track('contact_modal_open', {
          event_category: 'lead_generation'
        });
        _origOpenContact.apply(this, arguments);
      };
    }

    // Envío exitoso del formulario de contacto
    // (se parchea submitContact para detectar el fetch exitoso)
    var _origSubmitContact = window.submitContact;
    if (typeof window.submitContact === 'function') {
      window.submitContact = function() {
        // Observamos si aparece el mensaje de éxito
        var observer = new MutationObserver(function(muts) {
          muts.forEach(function(m) {
            m.addedNodes.forEach(function(node) {
              if (node.id === 'csucc' || (node.style && node.style.display === 'block')) {
                track('contact_form_submit', {
                  event_category: 'lead_generation',
                  form_name: 'contact_modal'
                });
                observer.disconnect();
              }
            });
          });
        });
        var csucc = document.getElementById('csucc');
        if (csucc) observer.observe(csucc.parentNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
        _origSubmitContact.apply(this, arguments);
      };
    }


    // ── 10. FAQ: preguntas más vistas ────────────────────────
    // ¿Qué dudas tienen más? Te ayuda a mejorar el copy de la
    // landing para responder las preguntas antes de que surjan.
    document.addEventListener('click', function(e) {
      var faqItem = e.target.closest('#faqList > div');
      if (faqItem) {
        var question = faqItem.querySelector('span');
        track('faq_open', {
          event_category: 'content_engagement',
          faq_question: question ? question.textContent.trim() : 'unknown'
        });
      }
    });


    // ── 11. PAGO / DESBLOQUEO DE CANDIDATO ───────────────────
    // El evento de conversión máximo para el lado empresa.
    // Cada apertura del modal de pago es una intención de compra.
    var _origOpenPayModal = window.openPayModal;
    if (typeof window.openPayModal === 'function') {
      window.openPayModal = function(candidateId) {
        track('pay_modal_open', {
          event_category: 'revenue',
          candidate_id: candidateId || 'unknown',
          event_value: 49
        });
        _origOpenPayModal.apply(this, arguments);
      };
    }

    // Confirmación de pago
    var _origConfirmPay = window.confirmPay;
    if (typeof window.confirmPay === 'function') {
      window.confirmPay = function() {
        track('purchase', {
          event_category: 'revenue',
          transaction_type: 'candidate_unlock',
          value: 49,
          currency: 'EUR'
        });
        _origConfirmPay.apply(this, arguments);
      };
    }


    // ── 12. TIEMPO EN PÁGINA ─────────────────────────────────
    // Registra si el usuario lleva más de 60s o 3min en la página.
    // Usuarios que pasan más de 3 min son leads muy cualificados.
    var _timeStart = Date.now();
    [60, 180].forEach(function(seconds) {
      setTimeout(function() {
        track('time_on_page', {
          event_category: 'engagement',
          seconds_on_page: seconds
        });
      }, seconds * 1000);
    });


    // ── 13. ABANDONO (salida sin conversión) ─────────────────
    // Detecta cuando el usuario está a punto de irse (mouse hacia
    // arriba en desktop). Indica que la landing no convenció.
    document.addEventListener('mouseleave', function(e) {
      if (e.clientY < 5) {
        track('exit_intent', {
          event_category: 'engagement',
          scroll_reached: Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          ) + '%'
        });
      }
    });


    // ── 14. SELECTOR DE SECTOR EN DASHBOARD ─────────────────
    // ¿Qué sector elige la gente en la demo? Revela el mercado
    // con más interés para orientar tu go-to-market.
    var sectorTabs = document.querySelectorAll('.sector-tabs .filter-btn, #sectorFilter .filter-btn');
    sectorTabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        track('sector_selected', {
          event_category: 'demo_engagement',
          sector: btn.textContent.trim()
        });
      });
    });

  }); // END DOMContentLoaded

})();
