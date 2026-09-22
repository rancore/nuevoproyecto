/**
 * ORQUESTADOR PRINCIPAL DEL FRONTEND
 * Synapse Digital - Main Application Lifecycle
 * Norma de referencia: @02-web-native-architecture.md, @05-observability-resilience.md
 */

(function () {
  'use strict';

  // Referencias a las dependencias inyectadas globalmente
  const config = window.RegionConfig;
  const state = window.AppState;
  const trans = window.translations;
  const i18n = window.I18n;
  const pricing = window.Pricing;
  const tracking = window.Tracking;
  const legal = window.Legal;

  if (!config || !state || !trans || !i18n || !pricing || !tracking) {
    return;
  }

  // Detección inicial de región desde parámetros de URL (?region=MX)
  const initialParams = new URLSearchParams(window.location.search);
  const requestedRegion = initialParams.get("region");
  if (requestedRegion && config[requestedRegion.toUpperCase()]) {
    state.selectedRegion = requestedRegion.toUpperCase();
  }

  /**
   * Renderizado completo de la interfaz según el estado activo.
   */
  function renderApp() {
    const regKey = state.selectedRegion;
    const reg = config[regKey];
    if (!reg) return;

    const lang = reg.lang || "es";
    state.currentLang = lang;

    // 0. Sincronizar Geo-SEO dinámico en Document Head
    if (reg.metaTitle) document.title = reg.metaTitle;
    const metaGeoReg = document.getElementById("meta-geo-region");
    if (metaGeoReg && reg.geoRegion) metaGeoReg.setAttribute("content", reg.geoRegion);
    const metaGeoPlace = document.getElementById("meta-geo-placename");
    if (metaGeoPlace && reg.geoPlacename) metaGeoPlace.setAttribute("content", reg.geoPlacename);
    const metaGeoPos = document.getElementById("meta-geo-position");
    if (metaGeoPos && reg.geoPosition) metaGeoPos.setAttribute("content", reg.geoPosition);
    const metaIcbm = document.getElementById("meta-icbm");
    if (metaIcbm && reg.icbm) metaIcbm.setAttribute("content", reg.icbm);
    const ogLoc = document.getElementById("og-locale");
    if (ogLoc && reg.ogLocale) ogLoc.setAttribute("content", reg.ogLocale);
    const dcCov = document.getElementById("dc-coverage");
    if (dcCov && reg.dcCoverage) dcCov.setAttribute("content", reg.dcCoverage);
    const dcLang = document.getElementById("dc-lang");
    if (dcLang) dcLang.setAttribute("content", lang);

    // 1. Sincronizar Banner de Bienvenida y Referido (Permanente, nunca se oculta)
    const banner = document.getElementById("dynamic-banner");
    const message = document.getElementById("banner-message");
    const subtext = document.getElementById("banner-subtext");
    tracking.syncBanner(banner, message, regKey, subtext);

    // 2. Aplicar traducciones a elementos con [data-i18n]
    i18n.applyToDOM(trans, lang);

    // 3. Actualizar Selector del Navbar
    const navCurrentFlag = document.getElementById("nav-current-flag");
    const navCurrentCode = document.getElementById("nav-current-code");
    if (navCurrentFlag) navCurrentFlag.textContent = reg.flag;
    if (navCurrentCode) navCurrentCode.textContent = reg.code;

    // Dropdown active styling
    const navOptions = document.querySelectorAll(".nav-region-opt");
    navOptions.forEach((opt) => {
      const optRegion = opt.getAttribute("data-change-region");
      if (optRegion === regKey) {
        opt.classList.add("is-active");
      } else {
        opt.classList.remove("is-active");
      }
    });

    // 4. Actualizar Selector de Banderas en la Sección de Tarifas
    const pricingButtons = document.querySelectorAll(".region-btn");
    pricingButtons.forEach((btn) => {
      const btnRegion = btn.getAttribute("data-change-region");
      if (btnRegion === regKey) {
        btn.className = "region-btn is-active px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all duration-200 flex items-center gap-2 border text-white";
      } else {
        btn.className = "region-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all duration-200 flex items-center gap-2 border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60";
      }
    });

    // 5. Actualizar Precios y Enlaces de los 3 Planes (Condicional a Link de Auditor)
    const isAuditorActive = tracking.hasAuditorDiscount() && regKey !== "US";
    const refData = tracking.getReferralInfo();

    const planNames = {
      "plan-1": i18n.getText(trans, lang, "plan1.name"),
      "plan-2": i18n.getText(trans, lang, "plan2.name"),
      "plan-3": i18n.getText(trans, lang, "plan3.name")
    };

    ["plan-1", "plan-2", "plan-3"].forEach((planId) => {
      // Precio formateado: bonificado si ingresa con link de auditor, precio normal de lista en caso contrario
      const formatted = pricing.formatPrice(planId, regKey, config, state, isAuditorActive);

      // Precio visible
      const elPrice = document.querySelector(`.${planId}-price`);
      if (elPrice) elPrice.textContent = formatted;

      // Anclaje / Precio tachado: SÓLO visible si ingresa desde el link provisto por el auditor
      const elAnchor = document.querySelector(`.${planId}-anchor`);
      if (elAnchor) {
        if (isAuditorActive) {
          elAnchor.classList.remove("hidden");
          elAnchor.textContent = pricing.formatCrossedPrice(planId, regKey, config, state, lang);
        } else {
          elAnchor.classList.add("hidden");
        }
      }

      // Badge de subsidio / ahorro: SÓLO visible si ingresa desde el link provisto por el auditor
      const elBadgeContainer = document.querySelector(`.${planId}-badge-container`);
      if (elBadgeContainer) {
        if (isAuditorActive) {
          elBadgeContainer.classList.remove("hidden");
          elBadgeContainer.classList.add("flex");
        } else {
          elBadgeContainer.classList.add("hidden");
          elBadgeContainer.classList.remove("flex");
        }
      }

      // Botón de activación del plan
      const btnPlan = document.getElementById(`btn-${planId}`);
      if (btnPlan) {
        if (regKey === "US") {
          const subject = encodeURIComponent(`Inquiry for ${planNames[planId]} - US Global HQ`);
          const body = `Hello be.digital,%0D%0A%0D%0AI would like to activate / inquire about ${planNames[planId]} (${formatted}).%0D%0A%0D%0ABusiness Name:%20%0D%0ALocation:%20%0D%0APhone:%20`;
          btnPlan.href = `mailto:inbound@be.digital?subject=${subject}&body=${body}`;
        } else {
          btnPlan.href = pricing.getPlanWhatsAppUrl(planNames[planId], formatted, regKey, lang, trans, config, state.whatsappNumber, isAuditorActive ? refData : null);
        }
      }
    });

    // 6. Actualizar CTAs Generales (Nav & Hero)
    const heroCta = document.getElementById("hero-cta-whatsapp");
    if (heroCta) {
      if (regKey === "US") {
        heroCta.classList.add("hidden");
      } else {
        heroCta.classList.remove("hidden");
        heroCta.href = pricing.getGeneralWhatsAppUrl(regKey, lang, trans, config, state.whatsappNumber);
      }
    }

    const navCta = document.getElementById("nav-cta-whatsapp");
    if (navCta) {
      if (regKey === "US") {
        navCta.href = "mailto:inbound@be.digital?subject=Direct%20Inquiry%20from%20Miami%20HQ%20Portal&body=Hello%20be.digital,%0D%0A%0D%0AI%20would%20like%20to%20request%20information%20for%20my%20company.%0D%0A%0D%0ACompany%20Name:%20";
        const navCtaSpan = navCta.querySelector("[data-i18n='nav.cta']");
        if (navCtaSpan) navCtaSpan.textContent = "Contact Desk";
      } else {
        navCta.href = pricing.getGeneralWhatsAppUrl(regKey, lang, trans, config, state.whatsappNumber);
        const navCtaSpan = navCta.querySelector("[data-i18n='nav.cta']");
        if (navCtaSpan) navCtaSpan.textContent = i18n.getText(trans, lang, "nav.cta");
      }
    }

    // 7. Actualizar Tarjeta de Fomento Institucional
    const fomentoCardEl = document.getElementById("fomento-program-card");
    if (fomentoCardEl) {
      fomentoCardEl.classList.remove("hidden");

      const badgeTagEl = document.getElementById("fomento-badge-tag");
      const badgeEditionEl = document.getElementById("fomento-badge-edition");
      const titleEl = document.getElementById("fomento-title");
      const subtitleEl = document.getElementById("fomento-subtitle");
      const bodyEl = document.getElementById("fomento-body");
      const btnVerifyEl = document.getElementById("btn-verify-qualification");
      const btnTextEl = document.getElementById("btn-verify-text");
      const btnIconEl = document.getElementById("btn-verify-icon");

      if (regKey === "US") {
        if (badgeTagEl) badgeTagEl.textContent = "Miami Global HQ";
        if (badgeEditionEl) badgeEditionEl.textContent = "Operational Standards";
        if (titleEl) titleEl.textContent = "Global Standards, Regional Focus";
        if (subtitleEl) subtitleEl.textContent = "Enterprise-grade infrastructure tailored for the Latin American market.";
        if (bodyEl) {
          bodyEl.innerHTML = `be.digital operates with top-tier technological standards from our Miami HQ, specifically designed to elevate local businesses in Latin America. We bridge the gap between enterprise-level digital architecture and regional accessibility, ensuring your business competes with global players while operating at local market rates.<br><br><strong>No bureaucratic delays. No hidden fees. Just high-speed, conversion-focused digital infrastructure.</strong>`;
        }
        if (btnTextEl) btnTextEl.textContent = "Contact Representative";
        if (btnIconEl) {
          btnIconEl.innerHTML = `<svg class="w-4 h-4 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
        }
        if (btnVerifyEl) {
          btnVerifyEl.href = `mailto:inbound@be.digital?subject=Inquiry%20from%20Global%20HQ%20Desk&body=Hello%20be.digital,%0D%0A%0D%0AI%20would%20like%20to%20connect%20with%20a%20representative%20regarding%20enterprise%20infrastructure.%0D%0A%0D%0ABusiness%20Name:%20%0D%0ALocation:%20%0D%0AContact%20Phone:%20`;
        }
      } else {
        const t = trans[lang] || trans.es;
        const f = t.fomento || trans.es.fomento;
        const countryLabel = reg.countryNames ? (reg.countryNames[lang] || reg.countryNames.es) : reg.name;
        const discountVal = reg.discount || "50%";

        if (badgeTagEl) badgeTagEl.textContent = f.tag;
        if (badgeEditionEl) badgeEditionEl.textContent = isAuditorActive ? "Cupo Auditor Activo" : f.edition;
        if (titleEl) titleEl.textContent = f.title;
        if (subtitleEl) {
          subtitleEl.textContent = isAuditorActive && refData
            ? `Cupo bonificado activo y validado a través de ${refData.representante}.`
            : f.subtitle;
        }
        if (bodyEl) {
          bodyEl.innerHTML = `<span>${f.body_p1}</span> <strong id="fomento-country" class="text-white bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400/30">${countryLabel}</strong>. <span>${f.body_p2}</span> <strong id="fomento-discount" class="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">${discountVal}</strong> <span>${f.body_p3}</span>`;
        }
        if (btnTextEl) btnTextEl.textContent = isAuditorActive ? "Confirmar Asignación de Cupo" : f.cta;
        if (btnIconEl) {
          btnIconEl.innerHTML = `<svg class="w-4 h-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        }
        if (btnVerifyEl) {
          const rawMsg = (f && f.wa_message) ? f.wa_message : "Hola be.digital, quiero verificar si mi negocio califica para el cupo subsidiado del Programa de Democratización Digital 2026 en {REGION}.";
          let finalMsg = rawMsg.replace("{REGION}", `${reg.flag} ${countryLabel}`);
          if (isAuditorActive && refData && refData.token) {
            finalMsg += ` (Ref Auditor: ${refData.token})`;
          }
          btnVerifyEl.href = `https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(finalMsg)}`;
        }
      }
    }
  }

  /**
   * Cambia la región activa y redibuja la aplicación.
   */
  function selectRegion(newRegion) {
    if (!config[newRegion] || state.selectedRegion === newRegion) return;
    state.selectedRegion = newRegion;
    renderApp();
  }

  // Inicialización cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Año en pie de página
    const elYear = document.getElementById("current-year");
    if (elYear) elYear.textContent = new Date().getFullYear();

    // 2. Control del dropdown de región en Navbar
    const navBtn = document.getElementById("nav-region-current-btn");
    const navMenu = document.getElementById("nav-dropdown-menu");
    const navWrapper = document.getElementById("nav-dropdown-wrapper");

    if (navBtn && navMenu) {
      navBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navMenu.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (navWrapper && !navWrapper.contains(e.target)) {
          navMenu.classList.add("hidden");
        }
      });
    }

    // 3. Listener delegado para cualquier botón con [data-change-region]
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-change-region]");
      if (btn) {
        const targetRegion = btn.getAttribute("data-change-region");
        if (targetRegion) {
          selectRegion(targetRegion);
          if (navMenu) navMenu.classList.add("hidden");
        }
      }
    });

    // 4. Render inicial inmediato
    renderApp();

    // 5. Inicializar controlador de modales legales y cumplimiento
    if (legal && typeof legal.init === "function") {
      legal.init();
    }

    // 6. Telemetría segura en segundo plano si hay referido (Notificación al Asesor / Lead)
    const refData = tracking.getReferralInfo();
    const endpoint = (state && state.telemetryWebhookUrl) || window.__telemetryEndpoint || "/api/track-visit";
    if (refData && endpoint) {
      tracking.sendTelemetry(refData, endpoint, state.selectedRegion, 3000);
    }

    // 7. Actualización no bloqueante de cotizaciones cambiarias en background
    setTimeout(() => {
      pricing.updateMarketRates(state, renderApp);
    }, 250);
  });
})();
