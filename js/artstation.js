/* ============================================================
   LUNARIUM'S LAB — artstation.js
   Sincroniza "Meus Trabalhos" com os posts públicos do ArtStation.

   IMPORTANTE: isso usa endpoints NÃO-OFICIAIS do ArtStation
   (o mesmo JSON que a própria página usa por baixo dos panos).
   Não existe garantia de que vão continuar assim para sempre —
   se um dia pararem de funcionar, é bem provável que tenham
   mudado algo do lado deles, não é um bug do site.

   Também não há garantia de que o navegador consiga chamar esses
   endpoints direto (CORS). Por isso: tenta direto primeiro e,
   se falhar, tenta de novo através de um proxy público. Isso é
   uma dependência de terceiro fora do nosso controle.
   ============================================================ */

(function () {
  "use strict";

  var CACHE_KEY = "lunarium.artstation.cache";
  var CACHE_MS = 60 * 60 * 1000; // 1 hora
  var PROXY = "https://api.allorigins.win/raw?url=";
  var DETAIL_LIMIT = 6; // busca descrição/ferramentas só dos N mais recentes

  function timeAgo(ms) {
    var diff = (Date.now() - ms) / 1000;
    if (diff < 60) return "agora há pouco";
    if (diff < 3600) return "há " + Math.floor(diff / 60) + " min";
    if (diff < 86400) return "há " + Math.floor(diff / 3600) + "h";
    return "há " + Math.floor(diff / 86400) + "d";
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    });
  }

  function fetchJsonWithFallback(url) {
    return fetchJson(url).catch(function () {
      return fetchJson(PROXY + encodeURIComponent(url));
    });
  }

  function stripHtml(html) {
    var div = document.createElement("div");
    div.innerHTML = html || "";
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  }

  function loadCache(username) {
    try {
      var raw = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (raw && raw.username === username) return raw;
    } catch (e) {}
    return null;
  }

  function saveCache(username, projects) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ username: username, projects: projects, fetchedAt: Date.now() }));
    } catch (e) {}
  }

  function fetchProjects(username, forceRefresh) {
    var cached = loadCache(username);
    if (cached && !forceRefresh && (Date.now() - cached.fetchedAt) < CACHE_MS) {
      return Promise.resolve({ projects: cached.projects, fromCache: true, fetchedAt: cached.fetchedAt });
    }

    var listUrl = "https://www.artstation.com/users/" + encodeURIComponent(username) + "/projects.json?page=1";

    return fetchJsonWithFallback(listUrl).then(function (list) {
      var items = (list && list.data) || [];
      var toDetail = items.slice(0, DETAIL_LIMIT);
      var rest = items.slice(DETAIL_LIMIT);

      return Promise.all(toDetail.map(function (p) {
        var detailUrl = "https://www.artstation.com/projects/" + p.hash_id + ".json";
        return fetchJsonWithFallback(detailUrl).then(function (full) {
          return mapProject(p, full);
        }).catch(function () {
          return mapProject(p, null);
        });
      })).then(function (detailed) {
        var summarized = rest.map(function (p) { return mapProject(p, null); });
        var all = detailed.concat(summarized);
        saveCache(username, all);
        return { projects: all, fromCache: false, fetchedAt: Date.now() };
      });
    });
  }

  function mapProject(summary, full) {
    var cover = summary.cover || {};
    var tools = [];
    if (full && Array.isArray(full.software_items)) {
      tools = full.software_items.map(function (s) { return s.name; }).filter(Boolean);
    }
    return {
      id: summary.hash_id,
      title: summary.title || "(sem título)",
      url: "https://www.artstation.com/artwork/" + summary.hash_id,
      cover: cover.medium_image_url || cover.image_url || (summary.smaller_square_cover_url) || "",
      date: summary.published_at || summary.created_at || null,
      likes: summary.likes_count || 0,
      description: full ? stripHtml(full.description) : "",
      tools: tools
    };
  }

  function renderCard(p) {
    var dateStr = p.date ? new Date(p.date).toLocaleDateString("pt-BR") : "";
    var toolsHtml = p.tools.length
      ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">' +
          p.tools.map(function (t) { return '<span class="tag" style="margin-right:0;">' + escapeHtml(t) + '</span>'; }).join("") +
        '</div>'
      : "";
    var descHtml = p.description
      ? '<p class="dim" style="font-size:.78rem;margin:8px 0 0 0;">' + escapeHtml(truncate(p.description, 140)) + '</p>'
      : "";
    return (
      '<a class="art-card" href="' + p.url + '" target="_blank" rel="noopener">' +
        (p.cover ? '<div class="art-cover" style="background-image:url(\'' + p.cover + '\')"></div>' : '<div class="art-cover art-cover-empty"><i class="fa-solid fa-image"></i></div>') +
        '<div class="art-body">' +
          '<strong>' + escapeHtml(p.title) + '</strong>' +
          '<span class="dim" style="font-size:.72rem;">' + dateStr + (p.likes ? ' · ' + p.likes + ' likes' : '') + '</span>' +
          descHtml + toolsHtml +
        '</div>' +
      '</a>'
    );
  }

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n).trim() + "…" : str;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  window.LunariumArtstation = { fetchProjects: fetchProjects, renderCard: renderCard, timeAgo: timeAgo };
})();
