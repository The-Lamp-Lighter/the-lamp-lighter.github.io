/* ============================================================
   LUNARIUM'S LAB — repo.js
   Renderiza window.LUNARIUM_PROJECTS como cartões expansíveis
   com histórico de versões — o "mini Diversion" embutido.
   ============================================================ */

(function () {
  "use strict";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderProject(p) {
    var versionsHtml = p.versions.map(function (v, i) {
      return (
        '<div class="version-row' + (i === 0 ? ' latest' : '') + '">' +
          '<div class="version-dot"></div>' +
          '<div class="version-body">' +
            '<div class="version-head">' +
              '<strong>' + escapeHtml(v.version) + '</strong>' +
              (i === 0 ? '<span class="tag">atual</span>' : '') +
              '<span class="dim" style="font-family:var(--font-mono);font-size:.72rem;">' + v.date + '</span>' +
            '</div>' +
            '<p class="dim" style="font-size:.82rem;margin:4px 0 8px 0;">' + escapeHtml(v.changelog) + '</p>' +
            '<a class="btn btn-ghost" style="font-size:.72rem;padding:.4em .9em;" href="' + v.downloadUrl + '" download>' +
              '<i class="fa-solid fa-download"></i> Baixar ' + escapeHtml(v.version) +
            '</a>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    return (
      '<article class="panel project-card" data-category="' + escapeHtml(p.category) + '">' +
        '<button class="project-head" data-toggle="' + p.id + '">' +
          '<span class="project-icon"><i class="' + p.icon + '"></i></span>' +
          '<span class="project-info">' +
            '<strong>' + escapeHtml(p.name) + '</strong>' +
            '<span class="dim">' + escapeHtml(p.description) + '</span>' +
          '</span>' +
          '<span class="tag">' + escapeHtml(p.category) + '</span>' +
          '<i class="fa-solid fa-chevron-down project-chevron"></i>' +
        '</button>' +
        '<div class="project-versions" id="versions-' + p.id + '">' +
          (p.diversionUrl ? '<a class="btn btn-solid" style="margin-bottom:14px;font-size:.78rem;" href="' + p.diversionUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir no Diversion</a>' : '') +
          versionsHtml +
        '</div>' +
      '</article>'
    );
  }

  function init(containerId, searchId, filterId) {
    var container = document.getElementById(containerId);
    var projects = window.LUNARIUM_PROJECTS || [];
    if (!projects.length) {
      container.innerHTML = '<div class="empty-state"><div class="orbit"></div><h3>Nenhum projeto catalogado</h3><p class="dim">Adicione entradas em <code>data/projects.js</code>.</p></div>';
      return;
    }

    function paint(list) {
      if (!list.length) {
        container.innerHTML = '<div class="empty-state"><div class="orbit"></div><h3>Nada encontrado</h3><p class="dim">Tente outro termo ou categoria.</p></div>';
        return;
      }
      container.innerHTML = list.map(renderProject).join("");
      container.querySelectorAll("[data-toggle]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var body = document.getElementById("versions-" + btn.dataset.toggle);
          body.classList.toggle("open");
          btn.classList.toggle("open");
        });
      });
    }

    paint(projects);

    var searchEl = document.getElementById(searchId);
    var filterEl = document.getElementById(filterId);

    if (filterEl) {
      var categories = projects.map(function (p) { return p.category; });
      var unique = categories.filter(function (v, i) { return categories.indexOf(v) === i; });
      filterEl.innerHTML = '<option value="all">Todas as categorias</option>' +
        unique.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join("");
    }

    function applyFilters() {
      var q = (searchEl && searchEl.value || "").toLowerCase();
      var cat = (filterEl && filterEl.value) || "all";
      var filtered = projects.filter(function (p) {
        var matchesQ = !q || p.name.toLowerCase().indexOf(q) > -1 || p.description.toLowerCase().indexOf(q) > -1;
        var matchesCat = cat === "all" || p.category === cat;
        return matchesQ && matchesCat;
      });
      paint(filtered);
    }

    if (searchEl) searchEl.addEventListener("input", applyFilters);
    if (filterEl) filterEl.addEventListener("change", applyFilters);
  }

  window.LunariumRepo = { init: init };
})();
