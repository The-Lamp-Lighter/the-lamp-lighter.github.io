/* ============================================================
   LUNARIUM'S LAB — news.js
   Busca os commits mais recentes dos repositórios listados em
   window.LUNARIUM_GITHUB_REPOS (data/projects.js) via API pública
   do GitHub — sem chave, sem backend. Repos inexistentes/privados
   são simplesmente ignorados (não quebram a página).
   ============================================================ */

(function () {
  "use strict";

  function timeAgo(dateStr) {
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    var units = [
      ["ano", 31536000], ["mês", 2592000], ["semana", 604800],
      ["dia", 86400], ["hora", 3600], ["minuto", 60]
    ];
    for (var i = 0; i < units.length; i++) {
      var val = Math.floor(diff / units[i][1]);
      if (val >= 1) return "há " + val + " " + units[i][0] + (val > 1 ? (units[i][0] === "mês" ? "es" : "s") : "");
    }
    return "agora há pouco";
  }

  function fetchRepo(owner, repo) {
    var url = "https://api.github.com/repos/" + owner + "/" + repo + "/commits?per_page=30";
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (commits) {
        if (!Array.isArray(commits)) return [];
        return commits.map(function (c) {
          return {
            repo: repo,
            owner: owner,
            message: (c.commit && c.commit.message ? c.commit.message.split("\n")[0] : "(sem mensagem)"),
            author: (c.commit && c.commit.author ? c.commit.author.name : "desconhecido"),
            date: c.commit && c.commit.author ? c.commit.author.date : null,
            url: c.html_url,
            sha: c.sha ? c.sha.slice(0, 7) : ""
          };
        });
      })
      .catch(function () { return []; });
  }

  function fetchRecent(limit) {
    var repos = window.LUNARIUM_GITHUB_REPOS || [];
    return Promise.all(repos.map(function (r) { return fetchRepo(r.owner, r.repo); }))
      .then(function (lists) {
        var all = [].concat.apply([], lists).filter(function (i) { return i.date; });
        all.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
        return limit ? all.slice(0, limit) : all;
      });
  }

  function renderCard(item, compact) {
    return (
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
          '<div>' +
            '<span class="tag">' + item.repo + '</span>' +
            '<strong style="font-size:.9rem;">' + escapeHtml(item.message) + '</strong>' +
          '</div>' +
          '<span class="dim" style="font-family:var(--font-mono);font-size:.72rem;white-space:nowrap;">' + timeAgo(item.date) + '</span>' +
        '</div>' +
        (compact ? "" : '<p class="dim" style="margin-top:8px;font-size:.78rem;">por ' + escapeHtml(item.author) + ' · <a class="accent" href="' + item.url + '" target="_blank" rel="noopener">' + item.sha + '</a></p>')
      + '</div>'
    );
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  window.LunariumNews = { fetchRecent: fetchRecent, renderCard: renderCard, timeAgo: timeAgo };
})();
