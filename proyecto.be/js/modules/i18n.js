/**
 * MÓDULO DE INTERNACIONALIZACIÓN (i18n)
 * Synapse Digital - Reactive i18n Engine
 * Norma de referencia: @02-web-native-architecture.md, @07-copywriting-persuasion-cro.md
 */

const I18n = {
  /**
   * Obtiene la cadena de traducción a partir de una ruta con puntos (ej: "nav.subtitle").
   */
  getText(translationsObj, lang, keyPath) {
    if (!translationsObj || !keyPath) return keyPath;
    const parts = keyPath.split(".");
    let current = translationsObj[lang] || translationsObj.es;

    for (let i = 0; i < parts.length; i++) {
      if (!current || current[parts[i]] === undefined) {
        // Fallback garantizado a español
        let fallback = translationsObj.es;
        for (let j = 0; j <= i; j++) {
          if (!fallback) break;
          fallback = fallback[parts[j]];
        }
        return fallback || keyPath;
      }
      current = current[parts[i]];
    }
    return current;
  },

  /**
   * Aplica las traducciones a todos los elementos con [data-i18n] en el documento.
   */
  applyToDOM(translationsObj, lang) {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;

    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = this.getText(translationsObj, lang, key);
      if (translation) {
        if (typeof translation === 'string' && translation.includes("<") && translation.includes(">")) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    });
  }
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { I18n };
} else {
  window.I18n = I18n;
}
