/* ============================================================
   LUNARIUM'S LAB — auth.js
   Login de verdade via Supabase Auth. Como o Supabase trabalha
   com e-mail por baixo dos panos, cada "usuário" vira um e-mail
   fictício (usuario@lunariumslab.internal) só internamente —
   na tela você só vê usuário e senha.
   ============================================================ */

(function () {
  "use strict";
  var DOMAIN = "@lunariumslab.internal";
  var _profileCache = null;

  function toEmail(username) {
    return (username || "").trim().toLowerCase().replace(/\s+/g, "") + DOMAIN;
  }

  function signUp(username, password) {
    return window.sb.auth.signUp({ email: toEmail(username), password: password }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  function login(username, password) {
    return window.sb.auth.signInWithPassword({ email: toEmail(username), password: password }).then(function (res) {
      if (res.error) throw res.error;
      _profileCache = null;
      return res.data;
    });
  }

  function logout() {
    return window.sb.auth.signOut().then(function () {
      _profileCache = null;
      window.location.href = "index.html";
    });
  }

  function getSession() {
    return window.sb.auth.getSession().then(function (res) { return res.data.session; });
  }

  function getProfile(forceRefresh) {
    if (_profileCache && !forceRefresh) return Promise.resolve(_profileCache);
    return getSession().then(function (session) {
      if (!session) return null;
      return window.sb.from("profiles").select("*").eq("id", session.user.id).single().then(function (res) {
        if (res.error) throw res.error;
        _profileCache = res.data;
        return res.data;
      });
    });
  }

  function requireSession() {
    return getSession().then(function (session) {
      if (!session) {
        window.location.href = "index.html";
        return null;
      }
      return session;
    });
  }

  function updateProfile(fields) {
    return getSession().then(function (session) {
      if (!session) throw new Error("não autenticado");
      return window.sb.from("profiles").update(fields).eq("id", session.user.id).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      _profileCache = res.data;
      return res.data;
    });
  }

  window.LunariumAuth = {
    signUp: signUp,
    login: login,
    logout: logout,
    getSession: getSession,
    getProfile: getProfile,
    requireSession: requireSession,
    updateProfile: updateProfile,
    clearProfileCache: function () { _profileCache = null; }
  };
})();
