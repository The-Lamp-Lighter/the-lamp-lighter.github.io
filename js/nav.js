/* ============================================================
   LUNARIUM'S LAB — nav.js
   Monta o app-shell (sidebar + topbar) em todas as páginas
   internas a partir de <div id="app-nav"> + <body data-page="">.
   ============================================================ */

(function () {
  "use strict";

  var LINKS = [
    { page: "home",  href: "home.html",  icon: "fa-satellite-dish", label: "Painel" },
    { page: "terminal", href: "terminal.html", icon: "fa-terminal", label: "Terminal" },
    { page: "news",  href: "news.html",  icon: "fa-tower-broadcast", label: "Notícias" },
    { page: "repo",  href: "repo.html",  icon: "fa-code-branch", label: "Repositórios" },
    { page: "chat",  href: "chat.html",  icon: "fa-comments", label: "Chat" },
    { page: "cantinho", href: "cantinho.html", icon: "fa-heart", label: "Cantinho" }
  ];

  var TITLES = {
    home: { title: "Painel", eyebrow: "Centro de ações" },
    terminal: { title: "Terminal", eyebrow: "Console do laboratório" },
    news: { title: "Notícias", eyebrow: "Atividade dos repositórios" },
    repo: { title: "Repositórios", eyebrow: "Scripts, apps & versões" },
    chat: { title: "Chat", eyebrow: "Conversas" },
    cantinho: { title: "Cantinho", eyebrow: "Referências & links" }
  };

  function build() {
    var navRoot = document.getElementById("app-nav");
    if (!navRoot) return;

    var page = document.body.dataset.page || "";
    var session = window.LunariumAuth ? window.LunariumAuth.requireSession() : null;

    var linksHtml = LINKS.map(function (l) {
      return (
        '<a class="nav-link' + (l.page === page ? ' active' : '') + '" href="' + l.href + '">' +
          '<i class="fa-solid ' + l.icon + '"></i><span>' + l.label + '</span>' +
        '</a>'
      );
    }).join("");

    navRoot.innerHTML =
      '<div class="sidebar-overlay" id="sidebar-overlay"></div>' +
      '<nav class="sidebar" id="sidebar">' +
        '<a href="home.html" class="brand">' +
          '<svg class="brand-mark" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="17" cy="17" r="15.5" stroke="hsl(var(--accent-h) var(--accent-s) var(--accent-l))" stroke-width="1" opacity=".5"/>' +
            '<circle cx="17" cy="17" r="10" stroke="hsl(var(--accent-h) var(--accent-s) var(--accent-l))" stroke-width="1" opacity=".8"/>' +
            '<circle cx="17" cy="4.5" r="2.2" fill="hsl(var(--accent-h) var(--accent-s) var(--accent-l))"/>' +
          '</svg>' +
          '<span class="brand-name">LUNARIUM\'S LAB<small>centro de ações</small></span>' +
        '</a>' +
        '<div class="nav-links">' + linksHtml + '</div>' +
        '<div class="sidebar-footer">' +
          '<button class="nav-link" type="button" data-theme-toggle style="width:100%;background:none;border:1px solid transparent;font:inherit;cursor:pointer;">' +
            '<i class="fa-solid fa-palette"></i><span>Aparência</span>' +
          '</button>' +
          '<div class="session-chip">' +
            '<span class="session-avatar">' + (session ? session.initials : "??") + '</span>' +
            '<span>' + (session ? session.name : "Visitante") + '<br><small class="dim">' + (session ? session.role : "") + '</small></span>' +
          '</div>' +
          '<button class="btn btn-ghost" id="logout-btn" type="button" style="width:100%;justify-content:center;">' +
            '<i class="fa-solid fa-right-from-bracket"></i> Sair' +
          '</button>' +
        '</div>' +
      '</nav>';

    var topbar = document.getElementById("app-topbar");
    if (topbar) {
      var t = TITLES[page] || { title: document.title, eyebrow: "" };
      topbar.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<button class="menu-toggle" id="menu-toggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>' +
          '<div class="topbar-title"><span class="eyebrow">' + t.eyebrow + '</span><h1>' + t.title + '</h1></div>' +
        '</div>' +
        '<div class="topbar-actions">' +
          '<span class="dim" style="font-family:var(--font-mono);font-size:.78rem;display:flex;align-items:center;gap:6px;"><span class="status-dot"></span>online</span>' +
          '<button class="btn-icon btn-ghost" data-theme-toggle aria-label="Aparência"><i class="fa-solid fa-palette"></i></button>' +
        '</div>';
    }

    document.getElementById("logout-btn").addEventListener("click", function () {
      if (window.LunariumAuth) window.LunariumAuth.logout();
    });

    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebar-overlay");
    var toggle = document.getElementById("menu-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        sidebar.classList.add("open");
        overlay.classList.add("show");
      });
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
