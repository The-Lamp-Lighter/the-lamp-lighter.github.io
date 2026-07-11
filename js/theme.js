/* ============================================================
   LUNARIUM'S LAB — theme.js
   Aplica o estilo + matiz salvos ANTES do primeiro paint (evita
   flash), expõe LunariumTheme para trocar estilo/cor em runtime,
   e injeta o painel deslizante com a roda de cor (acessível em
   qualquer página via #theme-toggle).
   ============================================================ */

(function () {
  "use strict";

  var KEY = "lunarium.theme";
  var STYLES = [
    { id: "lunarium",   label: "Lunarium",   hue: 258, icon: "fa-moon",        desc: "Laboratório noturno · assinatura" },
    { id: "retro",      label: "Retrô",      hue: 130, icon: "fa-tv",          desc: "Terminal CRT · fósforo" },
    { id: "futurista",  label: "Futurista",  hue: 195, icon: "fa-satellite",   desc: "HUD holográfico · claro" },
    { id: "cyberpunk",  label: "Cyberpunk",  hue: 320, icon: "fa-bolt",        desc: "Neon duotone · noturno" },
    { id: "fofo",       label: "Fofo",       hue: 330, icon: "fa-heart",       desc: "Pastel arredondado" },
    { id: "vazio",      label: "Vazio",      hue: 250, icon: "fa-circle-dot",  desc: "Minimalismo extremo" },
    { id: "musgo",      label: "Musgo",      hue: 100, icon: "fa-leaf",        desc: "Cottagecore · floresta" },
    { id: "pergaminho", label: "Pergaminho", hue: 25,  icon: "fa-scroll",      desc: "Grimório antigo · sépia" },
    { id: "vaporwave",  label: "Vaporwave",  hue: 320, icon: "fa-compact-disc", desc: "Rosa/roxo saturado · retrô" }
  ];

  var DEFAULT_HUES = {};
  STYLES.forEach(function (s) { DEFAULT_HUES[s.id] = s.hue; });

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (raw && raw.hues) return raw;
    // migra formatos antigos / primeira visita: cada estilo guarda seu próprio matiz
    var hues = Object.assign({}, DEFAULT_HUES);
    if (raw && raw.style && raw.hue) hues[raw.style] = raw.hue;
    return { style: (raw && raw.style) || "lunarium", hues: hues };
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();

  function currentHue() {
    return state.hues[state.style] != null ? state.hues[state.style] : DEFAULT_HUES[state.style];
  }

  function apply() {
    document.documentElement.setAttribute("data-style", state.style);
    document.documentElement.style.setProperty("--accent-h", currentHue());
  }

  // aplica imediatamente (script deve ser carregado no <head>)
  apply();

  function setStyle(styleId) {
    if (!STYLES.some(function (s) { return s.id === styleId; })) return;
    state.style = styleId;
    if (state.hues[styleId] == null) state.hues[styleId] = DEFAULT_HUES[styleId];
    apply();
    save(state);
    document.dispatchEvent(new CustomEvent("lunarium:theme-change", { detail: { style: state.style, hue: currentHue() } }));
  }

  function setHue(hue) {
    var h = Math.round(hue) % 360;
    if (h < 0) h += 360;
    state.hues[state.style] = h;
    apply();
    save(state);
    document.dispatchEvent(new CustomEvent("lunarium:theme-change", { detail: { style: state.style, hue: currentHue() } }));
  }

  function resetHue() {
    setHue(DEFAULT_HUES[state.style]);
  }

  window.LunariumTheme = {
    STYLES: STYLES,
    get: function () { return { style: state.style, hue: currentHue() }; },
    setStyle: setStyle,
    setHue: setHue,
    resetHue: resetHue
  };

  /* ---------------- painel deslizante ---------------- */
  function buildPanel() {
    var root = document.getElementById("theme-panel-root");
    if (!root) return;

    var stylesHtml = STYLES.map(function (s) {
      return (
        '<button class="style-pick" data-style-id="' + s.id + '" type="button">' +
          '<span class="style-pick-swatch" data-swatch="' + s.id + '"><i class="fa-solid ' + s.icon + '"></i></span>' +
          '<span class="style-pick-text"><strong>' + s.label + '</strong><small>' + s.desc + '</small></span>' +
        '</button>'
      );
    }).join("");

    root.innerHTML =
      '<div class="theme-overlay" id="theme-overlay"></div>' +
      '<aside class="theme-panel" id="theme-panel" aria-hidden="true">' +
        '<header class="theme-panel-head">' +
          '<h3><i class="fa-solid fa-palette"></i> Aparência</h3>' +
          '<button class="btn-icon btn-ghost" id="theme-panel-close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>' +
        '</header>' +
        '<div class="theme-panel-body">' +
          '<p class="theme-panel-label">Estilo</p>' +
          '<div class="style-grid">' + stylesHtml + '</div>' +
          '<p class="theme-panel-label">Cor de destaque</p>' +
          '<div class="wheel-wrap">' +
            '<div class="color-wheel" id="color-wheel">' +
              '<div class="wheel-knob" id="wheel-knob"></div>' +
            '</div>' +
            '<div class="wheel-side">' +
              '<div class="wheel-preview" id="wheel-preview"></div>' +
              '<button class="btn btn-ghost" id="wheel-reset" type="button">Padrão do estilo</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</aside>';

    var overlay = document.getElementById("theme-overlay");
    var panel = document.getElementById("theme-panel");
    var wheel = document.getElementById("color-wheel");
    var knob = document.getElementById("wheel-knob");
    var preview = document.getElementById("wheel-preview");

    function openPanel() {
      panel.classList.add("open");
      overlay.classList.add("show");
      panel.setAttribute("aria-hidden", "false");
      syncUI();
    }
    function closePanel() {
      panel.classList.remove("open");
      overlay.classList.remove("show");
      panel.setAttribute("aria-hidden", "true");
    }
    document.getElementById("theme-panel-close").addEventListener("click", closePanel);
    overlay.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    document.querySelectorAll(".style-pick").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setStyle(btn.dataset.styleId);
        syncUI();
      });
    });

    document.getElementById("wheel-reset").addEventListener("click", function () {
      resetHue();
      syncUI();
    });

    function hueFromEvent(e) {
      var rect = wheel.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      var angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
      return (angle + 90 + 360) % 360;
    }

    var dragging = false;
    wheel.addEventListener("pointerdown", function (e) {
      dragging = true;
      wheel.setPointerCapture(e.pointerId);
      setHue(hueFromEvent(e));
      syncKnob();
    });
    wheel.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      setHue(hueFromEvent(e));
      syncKnob();
    });
    wheel.addEventListener("pointerup", function (e) {
      dragging = false;
      try { wheel.releasePointerCapture(e.pointerId); } catch (err) {}
    });

    function syncKnob() {
      var s = window.LunariumTheme.get();
      var rad = (s.hue - 90) * (Math.PI / 180);
      var r = wheel.clientWidth / 2 - 12;
      var cx = wheel.clientWidth / 2 + r * Math.cos(rad);
      var cy = wheel.clientHeight / 2 + r * Math.sin(rad);
      knob.style.left = cx + "px";
      knob.style.top = cy + "px";
      preview.style.background = "hsl(" + s.hue + " 75% 55%)";
    }

    function syncUI() {
      var s = window.LunariumTheme.get();
      document.querySelectorAll(".style-pick").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.styleId === s.style);
      });
      syncKnob();
    }

    window.addEventListener("resize", syncKnob);
    document.addEventListener("lunarium:theme-change", syncUI);

    window.LunariumTheme.open = openPanel;
    window.LunariumTheme.close = closePanel;

    // conecta qualquer botão com [data-theme-toggle] em qualquer página
    document.body.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-theme-toggle]");
      if (trigger) openPanel();
    });

    syncUI();
  }

  // brilho sutil que segue o cursor — só tem efeito visível no tema "Vazio"
  document.addEventListener("pointermove", function (e) {
    document.documentElement.style.setProperty("--cursor-x", e.clientX + "px");
    document.documentElement.style.setProperty("--cursor-y", e.clientY + "px");
  }, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPanel);
  } else {
    buildPanel();
  }
})();
