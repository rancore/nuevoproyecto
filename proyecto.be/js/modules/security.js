/**
 * MÓDULO DE SEGURIDAD Y SANITIZACIÓN DOM
 * Synapse Digital - Input Sanitization & XSS Mitigation
 * Norma de referencia: @04-backend-security.md, @08-compliance-legal-security.md
 */

const Security = {
  /**
   * Valida y sanitiza una cadena alfanumérica de referencia (?ref=).
   * Formato esperado: "NombreRepresentante-CodigoProspecto" (ej: "MauroV-8492")
   */
  sanitizeRef(rawRef) {
    if (!rawRef || typeof rawRef !== 'string') return null;
    
    // Truncar longitud excesiva para mitigar DoS en expresiones regulares
    const trimmed = rawRef.trim().slice(0, 60);
    
    // Permitir exclusivamente caracteres alfanuméricos, guiones y guiones bajos
    const cleanToken = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanToken) return null;

    const parts = cleanToken.split('-');
    const repRaw = parts[0] || 'Representante Autorizado';
    const code = parts[1] || cleanToken;

    // Formatear espaciado CamelCase (ej: "JuanP" -> "Juan P")
    const representante = repRaw.replace(/([A-Z])/g, ' $1').trim();

    return {
      token: cleanToken,
      representante: representante,
      codigoProspecto: code
    };
  },

  /**
   * Sanitiza texto simple contra caracteres peligrosos HTML.
   */
  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Construye de forma 100% segura el contenido del banner dinámico sin usar innerHTML.
   * Elimina de raíz la vulnerabilidad de inyección de script por DOM XSS.
   */
  renderSafeBannerMessage(containerElement, representante) {
    if (!containerElement) return;

    // Limpiar contenido previo de forma segura
    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }

    const textBefore = document.createTextNode("Bienvenido. Llegaste a través de ");
    const strongElement = document.createElement("strong");
    strongElement.textContent = representante || "Nuestro Equipo";
    const textAfter = document.createTextNode(", representante autorizado para tu zona.");

    containerElement.appendChild(textBefore);
    containerElement.appendChild(strongElement);
    containerElement.appendChild(textAfter);
  },

  /**
   * Construye el contenido del banner institucional general de forma 100% segura contra XSS.
   */
  renderSafeInstitutionalMessage(containerElement) {
    if (!containerElement) return;

    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }

    const strongElement = document.createElement("strong");
    strongElement.textContent = "Programa de Democratización Digital 2026: ";
    const textAfter = document.createTextNode("Iniciativa de modernización digital para PyMEs. Tarifas oficiales y soporte regional activo.");

    containerElement.appendChild(strongElement);
    containerElement.appendChild(textAfter);
  }
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Security };
} else {
  window.Security = Security;
}
