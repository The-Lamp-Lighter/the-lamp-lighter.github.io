/* ============================================================
   LUNARIUM'S LAB — auth.js
   Sessão local simples (sem backend). Guarda quem "entrou" no
   laboratório para personalizar a saudação e proteger páginas.
   ============================================================ */

(function () {
  "use strict";
  var KEY = "lunarium.session";

  function get() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function login(name) {
    var clean = (name || "").trim() || "Operador";
    var session = {
      name: clean,
      initials: clean.slice(0, 2).toUpperCase(),
      role: clean.toLowerCase() === "lunarium" ? "ADMIN" : "OPERADOR",
      since: Date.now()
    };
    localStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }

  function logout() {
    localStorage.removeItem(KEY);
    window.location.href = "index.html";
  }

  function requireSession() {
    var s = get();
    if (!s) {
      window.location.href = "index.html";
    }
    return s;
  }

  window.LunariumAuth = { get: get, login: login, logout: logout, requireSession: requireSession };
})();
