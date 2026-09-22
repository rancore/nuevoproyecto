/**
 * MÓDULO LEGAL Y CONTROL DE MODALES DE CUMPLIMIENTO
 * be.digital - Terms, Privacy, SLA & Compliance Controller
 * Norma de referencia: @08-compliance-legal-security.md, @02-web-native-architecture.md
 */

const Legal = {
  activeTab: 'terms',

  init() {
    if (typeof document === 'undefined') return;

    // Listener delegado para abrir el modal con [data-legal-modal]
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-legal-modal]');
      if (trigger) {
        e.preventDefault();
        const tabKey = trigger.getAttribute('data-legal-modal') || 'terms';
        this.openModal(tabKey);
        return;
      }

      // Listener para cerrar modal con [data-legal-close]
      if (e.target.closest('[data-legal-close]')) {
        e.preventDefault();
        this.closeModal();
      }
    });

    // Cerrar al presionar tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('legal-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.closeModal();
        }
      }
    });

    // Cambio de pestañas dentro del modal con [data-legal-tab]
    const tabButtons = document.querySelectorAll('[data-legal-tab]');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-legal-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Detectar parámetro ?legal= en URL o hash #terminos / #privacidad / #sla / #programa
    this.checkInitialUrl();
  },

  openModal(tabKey = 'terms') {
    const modal = document.getElementById('legal-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (document.body) {
      document.body.style.overflow = 'hidden';
    }

    this.switchTab(tabKey);

    const closeBtn = modal.querySelector('[data-legal-close]');
    if (closeBtn) closeBtn.focus();
  },

  closeModal() {
    const modal = document.getElementById('legal-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (document.body) {
      document.body.style.overflow = '';
    }
  },

  switchTab(tabKey) {
    this.activeTab = tabKey;
    const tabButtons = document.querySelectorAll('[data-legal-tab]');
    const tabContents = document.querySelectorAll('.legal-tab-pane');

    tabButtons.forEach((btn) => {
      const target = btn.getAttribute('data-legal-tab');
      if (target === tabKey) {
        btn.classList.add('is-active', 'bg-blue-600', 'text-white', 'border-blue-400');
        btn.classList.remove('text-slate-400', 'border-transparent', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('is-active', 'bg-blue-600', 'text-white', 'border-blue-400');
        btn.classList.add('text-slate-400', 'border-transparent', 'hover:bg-slate-800');
      }
    });

    tabContents.forEach((pane) => {
      if (pane.id === `legal-pane-${tabKey}`) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    const scrollContainer = document.getElementById('legal-scroll-body');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  },

  checkInitialUrl() {
    if (typeof window === 'undefined' || !window.location) return;

    const params = new URLSearchParams(window.location.search);
    const legalParam = params.get('legal');
    if (legalParam) {
      this.openModal(legalParam);
      return;
    }

    const hash = window.location.hash.toLowerCase();
    if (hash === '#terminos' || hash === '#terms') {
      this.openModal('terms');
    } else if (hash === '#privacidad' || hash === '#privacy') {
      this.openModal('privacy');
    } else if (hash === '#sla') {
      this.openModal('sla');
    } else if (hash === '#programa') {
      this.openModal('program');
    }
  }
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Legal };
} else {
  window.Legal = Legal;
}
