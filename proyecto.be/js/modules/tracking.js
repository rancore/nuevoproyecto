/**
 * MÓDULO DE TRACKING Y ATRIBUCIÓN COMERCIAL RESILIENTE
 * Synapse Digital - Lead Attribution & Privacy-Preserving Telemetry
 * Norma de referencia: @04-backend-security.md, @05-observability-resilience.md, @08-compliance-legal-security.md
 */

const Tracking = {
  /**
   * Obtiene y sanitiza de forma segura los parámetros de referido de la URL actual o sesión.
   */
  getReferralInfo() {
    if (typeof window === 'undefined') return null;

    let rawRef = null;

    if (window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      rawRef = params.get('ref');
    }

    // Persistencia resiliente en sessionStorage (con fallback si está deshabilitado por el navegador)
    if (rawRef) {
      try {
        if (window.sessionStorage) {
          window.sessionStorage.setItem('synapse_lead_ref', rawRef);
        }
      } catch {
        // Fallback silencioso en entornos restringidos de almacenamiento
      }
    } else {
      try {
        if (window.sessionStorage) {
          rawRef = window.sessionStorage.getItem('synapse_lead_ref');
        }
      } catch {
        rawRef = null;
      }
    }

    if (!rawRef && typeof window.__leadRef === 'string') {
      rawRef = window.__leadRef;
    }

    if (!rawRef) return null;

    const securityModule = (typeof Security !== 'undefined') ? Security : (typeof require !== 'undefined' ? require('./security').Security : null);
    if (!securityModule) return null;

    return securityModule.sanitizeRef(rawRef);
  },

  /**
   * Determina si el usuario actual cuenta con un cupo bonificado por link de auditor.
   */
  hasAuditorDiscount() {
    return this.getReferralInfo() !== null;
  },

  /**
   * Actualiza el banner superior en el DOM.
   * El banner NUNCA desaparece: muestra estado personalizado si hay asesor, o institucional si es tráfico directo.
   */
  syncBanner(bannerEl, messageEl, regKey, subtextEl = null) {
    if (!bannerEl) return;
    const refData = this.getReferralInfo();
    const securityModule = (typeof Security !== 'undefined') ? Security : (typeof require !== 'undefined' ? require('./security').Security : null);

    if (refData && regKey !== 'US') {
      bannerEl.classList.remove('hidden');
      bannerEl.className = "relative z-50 bg-emerald-950/95 border-b border-emerald-500/30 px-4 py-2.5 text-center backdrop-blur-md shadow-lg shadow-emerald-950/50";
      if (messageEl && securityModule) {
        securityModule.renderSafeBannerMessage(messageEl, refData.representante);
      }
      if (subtextEl) {
        subtextEl.textContent = "Tu cupo subsidiado del Programa de Democratización Digital 2026 está activo.";
        subtextEl.className = "font-bold text-emerald-100 ml-1";
      }
    } else {
      bannerEl.classList.add('hidden');
    }
  },

  /**
   * Registra asíncronamente la visita hacia el backend de telemetría de forma tolerante a fallos.
   * Notifica al microservicio CRM para identificar al lead por su código y disparar el mensaje de seguimiento.
   */
  async sendTelemetry(refData, endpointUrl, region = 'AR', timeoutMs = 3000) {
    if (!refData || !endpointUrl || typeof fetch === 'undefined') return;

    // Prohibir envío a endpoints HTTP inseguros en producción o localhost por accidente
    if (!endpointUrl.startsWith('https://') && !endpointUrl.startsWith('/')) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref_completo: refData.token,
          representante: refData.representante,
          codigo_prospecto: refData.codigoProspecto,
          region: region,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });
    } catch {
      // Degrada silenciosamente sin interrumpir al usuario ni ensuciar la consola
    } finally {
      clearTimeout(timer);
    }
  }
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Tracking };
} else {
  window.Tracking = Tracking;
}
