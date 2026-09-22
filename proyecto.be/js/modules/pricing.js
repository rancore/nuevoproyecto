/**
 * MÓDULO DE PRECIOS Y COTIZACIÓN MULTIMONEDA
 * Synapse Digital - Currency Engine & WhatsApp Converter
 * Norma de referencia: @02-web-native-architecture.md, @05-observability-resilience.md
 */

const Pricing = {
  /**
   * Formatea un valor numérico base en USD según la divisa regional y reglas de redondeo.
   */
  formatAmount(baseUSD, regionKey, appState) {
    if (regionKey === "US" || regionKey === "LATAM") {
      return `$${baseUSD} USD`;
    }

    if (regionKey === "AR") {
      const rate = (appState && appState.rates && appState.rates.ARS) || 1540.0;
      const total = baseUSD * rate;
      const rounded = Math.round(total / 1000) * 1000;
      return `$${new Intl.NumberFormat('es-AR').format(rounded)} ARS`;
    }

    if (regionKey === "MX") {
      const rate = (appState && appState.rates && appState.rates.MXN) || 18.50;
      const total = baseUSD * rate;
      const rounded = Math.round(total / 10) * 10;
      return `$${new Intl.NumberFormat('es-MX').format(rounded)} MXN`;
    }

    if (regionKey === "BR") {
      const rate = (appState && appState.rates && appState.rates.BRL) || 5.40;
      const total = baseUSD * rate;
      const rounded = Math.round(total);
      return `R$ ${new Intl.NumberFormat('pt-BR').format(rounded)} BRL`;
    }

    return `$${baseUSD} USD`;
  },

  /**
   * Formatea el precio de un plan según la región, tipo de cambio y si aplica descuento de auditor.
   */
  formatPrice(planId, regionKey, regionConfig, appState, isDiscounted = true) {
    const reg = regionConfig[regionKey];
    if (!reg) {
      return "$0 USD";
    }

    let baseUSD;
    if (isDiscounted) {
      baseUSD = (reg.subsidizedRates && reg.subsidizedRates[planId]) || (reg.baseRates && reg.baseRates[planId]);
    } else {
      baseUSD = (reg.standardRates && reg.standardRates[planId]) || (reg.baseRates && reg.baseRates[planId]);
    }

    if (typeof baseUSD !== 'number') {
      return "$0 USD";
    }

    return this.formatAmount(baseUSD, regionKey, appState);
  },

  /**
   * Formatea el precio oficial de lista para mostrar tachado cuando hay cupo de auditor activo.
   */
  formatCrossedPrice(planId, regionKey, regionConfig, appState, lang = 'es') {
    const reg = regionConfig[regionKey];
    if (!reg) return "";

    const standardUSD = (reg.standardRates && reg.standardRates[planId]) || (reg.baseRates && reg.baseRates[planId]);
    if (typeof standardUSD !== 'number') return "";

    if (regionKey === "US") {
      return `$${standardUSD} USD`;
    }

    const formattedLocal = this.formatAmount(standardUSD, regionKey, appState);
    const label = lang === "en" ? "Official list" : (lang === "pt" ? "Tabela oficial" : "Precio oficial");
    return `${label}: ${formattedLocal}`;
  },

  /**
   * Genera enlace de WhatsApp para cotización de un plan específico con trazabilidad de auditoría.
   */
  getPlanWhatsAppUrl(planName, formattedPrice, regionKey, lang, translationsObj, regionConfig, whatsappNumber, refData = null) {
    const reg = regionConfig[regionKey] || regionConfig.AR;
    const t = (translationsObj && (translationsObj[lang] || translationsObj.es)) || {};
    const rawTemplate = (t.whatsapp && t.whatsapp.plan_message) 
      || "¡Hola be.digital! Quiero consultar la disponibilidad del cupo para el plan {PLAN} ({PRICE} en {CURRENCY}).";
    
    let msg = rawTemplate
      .replace("{PLAN}", planName)
      .replace("{CURRENCY}", `${reg.flag} ${reg.code}`)
      .replace("{PRICE}", formattedPrice);

    if (refData && refData.token) {
      msg += ` (Cupo Auditor: ${refData.token})`;
    }

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  },

  /**
   * Genera enlace de WhatsApp para auditoría general técnica.
   */
  getGeneralWhatsAppUrl(regionKey, lang, translationsObj, regionConfig, whatsappNumber) {
    const reg = regionConfig[regionKey] || regionConfig.AR;
    const t = (translationsObj && (translationsObj[lang] || translationsObj.es)) || {};
    const rawTemplate = (t.whatsapp && t.whatsapp.general_message)
      || "¡Hola be.digital! Me gustaría solicitar un diagnóstico técnico sin cargo de visibilidad local y WhatsApp para mi negocio ({REGION}).";
    
    const msg = rawTemplate.replace("{REGION}", `${reg.flag} ${reg.name}`);
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  },

  /**
   * Petición HTTP con AbortController y timeout forzado (Resiliencia).
   */
  fetchWithTimeout(url, timeoutMs) {
    if (typeof fetch === 'undefined') return Promise.reject(new Error("fetch no disponible"));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        throw err;
      });
  },

  /**
   * Actualiza las tasas de mercado en segundo plano de forma tolerante a fallos.
   */
  async updateMarketRates(appState, onUpdated) {
    if (typeof fetch === 'undefined') return;
    const timeout = (appState && appState.apiTimeoutMs) || 3500;

    const fetchBlue = this.fetchWithTimeout("https://dolarapi.com/v1/dolares/blue", timeout);
    const fetchRates = this.fetchWithTimeout("https://open.er-api.com/v6/latest/USD", timeout);

    try {
      const results = await Promise.allSettled([fetchBlue, fetchRates]);
      let updated = false;

      // Dólar Blue (Argentina)
      if (results[0].status === "fulfilled" && results[0].value) {
        const data = results[0].value;
        if (typeof data.venta === "number" && data.venta > 0) {
          appState.rates.ARS = data.venta;
          updated = true;
        }
      }

      // Open ER API (México y Brasil)
      if (results[1].status === "fulfilled" && results[1].value && results[1].value.rates) {
        const rates = results[1].value.rates;
        if (typeof rates.MXN === "number" && rates.MXN > 0) {
          appState.rates.MXN = rates.MXN;
          updated = true;
        }
        if (typeof rates.BRL === "number" && rates.BRL > 0) {
          appState.rates.BRL = rates.BRL;
          updated = true;
        }
      }

      if (updated && typeof onUpdated === 'function') {
        onUpdated();
      }
    } catch {
      // Degrada silenciosamente conservando las tasas de respaldo por defecto
    }
  }
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Pricing };
} else {
  window.Pricing = Pricing;
}
