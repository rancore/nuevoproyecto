/**
 * CONFIGURACIÓN REGIONAL Y MOTOR DE PRECIOS
 * be.digital - Regional Matrix & App State
 * Norma de referencia: @02-web-native-architecture.md, @04-backend-security.md
 */

const RegionConfig = {
  US: { 
    lang: "en", 
    flag: "🇺🇸", 
    currency: "USD", 
    code: "USD", 
    name: "USA / Global", 
    countryNames: { es: "Estados Unidos", en: "United States", pt: "Estados Unidos" },
    discount: "40%",
    geoRegion: "US-FL",
    geoPlacename: "Miami, Florida",
    geoPosition: "25.7617;-80.1918",
    icbm: "25.7617, -80.1918",
    ogLocale: "en_US",
    dcCoverage: "United States, Global",
    metaTitle: "be.digital | Enterprise Infrastructure & B2B Acquisition (USA & Global)",
    standardRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    subsidizedRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    baseRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 } 
  },
  LATAM: { 
    lang: "es", 
    flag: "🌎", 
    currency: "USD", 
    code: "USD", 
    name: "Latam General", 
    countryNames: { es: "Latinoamérica", en: "Latin America", pt: "América Latina" },
    discount: "50%",
    geoRegion: "US-FL",
    geoPlacename: "Miami HQ - Red Regional Latinoamérica",
    geoPosition: "25.7617;-80.1918",
    icbm: "25.7617, -80.1918",
    ogLocale: "es_419",
    dcCoverage: "América Latina, Cono Sur, Centroamérica",
    metaTitle: "be.digital | Infraestructura Digital & Captación B2B Latinoamérica",
    standardRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    subsidizedRates: { "plan-1": 119, "plan-2": 239, "plan-3": 419 },
    baseRates: { "plan-1": 119, "plan-2": 239, "plan-3": 419 } 
  },
  MX: { 
    lang: "es", 
    flag: "🇲🇽", 
    currency: "MXN", 
    code: "MXN", 
    name: "México", 
    countryNames: { es: "México", en: "Mexico", pt: "México" },
    discount: "50%",
    geoRegion: "MX-CMX",
    geoPlacename: "Ciudad de México, México",
    geoPosition: "19.4326;-99.1332",
    icbm: "19.4326, -99.1332",
    ogLocale: "es_MX",
    dcCoverage: "México, CDMX, Monterrey, Guadalajara",
    metaTitle: "be.digital México | Infraestructura Digital & Dominancia Google Maps",
    standardRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    subsidizedRates: { "plan-1": 109, "plan-2": 219, "plan-3": 385 },
    baseRates: { "plan-1": 109, "plan-2": 219, "plan-3": 385 } 
  },
  AR: { 
    lang: "es", 
    flag: "🇦🇷", 
    currency: "ARS", 
    code: "ARS", 
    name: "Argentina", 
    countryNames: { es: "Argentina", en: "Argentina", pt: "Argentina" },
    discount: "60%",
    geoRegion: "AR-C",
    geoPlacename: "Buenos Aires & Rosario, Argentina",
    geoPosition: "-34.6037;-58.3816",
    icbm: "-34.6037, -58.3816",
    ogLocale: "es_AR",
    dcCoverage: "Argentina, Buenos Aires, Rosario, Córdoba, Mendoza",
    metaTitle: "be.digital Argentina | Infraestructura Digital & Adquisición B2B",
    standardRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    subsidizedRates: { "plan-1": 99, "plan-2": 199, "plan-3": 349 },
    baseRates: { "plan-1": 99, "plan-2": 199, "plan-3": 349 } 
  },
  BR: { 
    lang: "pt", 
    flag: "🇧🇷", 
    currency: "BRL", 
    code: "BRL", 
    name: "Brasil", 
    countryNames: { es: "Brasil", en: "Brazil", pt: "Brasil" },
    discount: "50%",
    geoRegion: "BR-SP",
    geoPlacename: "São Paulo, Brasil",
    geoPosition: "-23.5505;-46.6333",
    icbm: "-23.5505, -46.6333",
    ogLocale: "pt_BR",
    dcCoverage: "Brasil, São Paulo, Rio de Janeiro, Curitiba, Belo Horizonte",
    metaTitle: "be.digital Brasil | Infraestrutura Digital & Automação Comercial",
    standardRates: { "plan-1": 149, "plan-2": 299, "plan-3": 519 },
    subsidizedRates: { "plan-1": 99, "plan-2": 199, "plan-3": 349 },
    baseRates: { "plan-1": 99, "plan-2": 199, "plan-3": 349 } 
  }
};

const AppState = {
  selectedRegion: "AR",
  currentLang: "es",
  rates: {
    ARS: 1540.0,
    MXN: 18.50,
    BRL: 5.40
  },
  whatsappNumber: "5493412345678",
  telemetryWebhookUrl: "/api/track-visit",
  apiTimeoutMs: 3500
};

// Exportación universal (Navegador & Node.js para testing)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { RegionConfig, AppState };
} else {
  window.RegionConfig = RegionConfig;
  window.AppState = AppState;
}
