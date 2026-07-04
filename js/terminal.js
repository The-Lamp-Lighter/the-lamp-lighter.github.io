/* ============================================================
   LUNARIUM'S LAB — terminal.js
   Motor de comandos do terminal. Pra adicionar um comando novo,
   basta registrar em COMMANDS: { run(args, ctx) -> string|HTMLElement }.
   ============================================================ */

(function () {
  "use strict";

  var history = [];
  var historyPos = 0;
  var outputEl, inputEl;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function line(text, cls) {
    var div = document.createElement("div");
    div.className = "term-line" + (cls ? " " + cls : "");
    div.innerHTML = text;
    outputEl.appendChild(div);
  }

  function printRaw(node) {
    outputEl.appendChild(node);
  }

  var COMMANDS = {
    help: {
      desc: "lista os comandos disponíveis",
      run: function () {
        var rows = Object.keys(COMMANDS).sort().map(function (k) {
          return '<div class="term-help-row"><span class="accent">' + k + '</span><span class="dim">' + COMMANDS[k].desc + '</span></div>';
        }).join("");
        line('<div class="term-help">' + rows + '</div>');
      }
    },
    clear: {
      desc: "limpa a tela",
      run: function () { outputEl.innerHTML = ""; }
    },
    whoami: {
      desc: "mostra a sessão atual",
      run: function () {
        var s = window.LunariumAuth.get();
        line(s ? s.name + ' <span class="dim">(' + s.role + ')</span>' : "visitante");
      }
    },
    date: {
      desc: "mostra data e hora atuais",
      run: function () { line(new Date().toLocaleString("pt-BR")); }
    },
    echo: {
      desc: "echo [texto]",
      run: function (args) { line(escapeHtml(args.join(" "))); }
    },
    banner: {
      desc: "reimprime o banner de entrada",
      run: function () { printBanner(); }
    },
    theme: {
      desc: "theme list | theme set <estilo>",
      run: function (args) {
        if (args[0] === "set" && args[1]) {
          var ok = window.LunariumTheme.STYLES.some(function (s) { return s.id === args[1]; });
          if (!ok) { line("estilo desconhecido. use: theme list", "term-err"); return; }
          window.LunariumTheme.setStyle(args[1]);
          line("estilo aplicado: " + args[1]);
          return;
        }
        var rows = window.LunariumTheme.STYLES.map(function (s) {
          return '<div class="term-help-row"><span class="accent">' + s.id + '</span><span class="dim">' + s.label + " — " + s.desc + '</span></div>';
        }).join("");
        line('<div class="term-help">' + rows + '</div>');
      }
    },
    color: {
      desc: "color <0-360> — muda o matiz de destaque",
      run: function (args) {
        var hue = parseInt(args[0], 10);
        if (isNaN(hue)) { line("uso: color <0-360>", "term-err"); return; }
        window.LunariumTheme.setHue(hue);
        line("matiz definido para " + ((hue % 360 + 360) % 360) + "°");
      }
    },
    repo: {
      desc: "repo list | repo info <id>",
      run: function (args) {
        var projects = window.LUNARIUM_PROJECTS || [];
        if (args[0] === "info" && args[1]) {
          var p = projects.find(function (x) { return x.id === args[1]; });
          if (!p) { line("projeto não encontrado.", "term-err"); return; }
          var v = p.versions[0];
          line('<strong>' + p.name + '</strong> <span class="dim">(' + p.category + ')</span>');
          line(escapeHtml(p.description), "dim");
          line("versão atual: " + v.version + " — " + v.date, "dim");
          return;
        }
        var rows = projects.map(function (p) {
          return '<div class="term-help-row"><span class="accent">' + p.id + '</span><span class="dim">' + p.name + " · " + p.versions[0].version + '</span></div>';
        }).join("");
        line('<div class="term-help">' + (rows || '<span class="dim">nenhum projeto catalogado.</span>') + '</div>');
      }
    },
    news: {
      desc: "mostra os 5 commits mais recentes",
      run: function () {
        line("buscando…", "dim");
        window.LunariumNews.fetchRecent(5).then(function (items) {
          if (!items.length) { line("nenhuma atividade encontrada (confira data/projects.js).", "dim"); return; }
          items.forEach(function (it) {
            line('<span class="accent">' + it.repo + '</span> ' + escapeHtml(it.message) + ' <span class="dim">(' + window.LunariumNews.timeAgo(it.date) + ')</span>');
          });
        });
      }
    },
    open: {
      desc: "open <home|terminal|news|repo|chat>",
      run: function (args) {
        var map = { home: "home.html", terminal: "terminal.html", news: "news.html", repo: "repo.html", chat: "chat.html" };
        var target = map[args[0]];
        if (!target) { line("destinos: home, terminal, news, repo, chat", "term-err"); return; }
        line("abrindo " + args[0] + "…");
        setTimeout(function () { window.location.href = target; }, 300);
      }
    },
    sysinfo: {
      desc: "informações do laboratório (estilo neofetch)",
      run: function () {
        var s = window.LunariumAuth.get();
        var t = window.LunariumTheme.get();
        var rows = [
          ["usuário", s ? s.name : "—"],
          ["estilo", t.style],
          ["matiz", t.hue + "°"],
          ["projetos", (window.LUNARIUM_PROJECTS || []).length],
          ["motor", "Lunarium's Lab v1.0"]
        ];
        var html = rows.map(function (r) { return '<div class="term-help-row"><span class="accent">' + r[0] + '</span><span class="dim">' + r[1] + '</span></div>'; }).join("");
        line('<div class="term-help">' + html + '</div>');
      }
    },
    download_dv: {
      desc: "baixa o instalador do Diversion (Windows)",
      run: function () {
        line("iniciando download do Diversion (Windows x86_64)…");
        var a = document.createElement("a");
        a.href = "https://dv-binaries.s3.us-east-2.amazonaws.com/windows_x86_64/diversion_windows_x86_64.exe";
        a.download = "diversion_windows_x86_64.exe";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        line('se o navegador não iniciar sozinho, <a class="accent" href="https://dv-binaries.s3.us-east-2.amazonaws.com/windows_x86_64/diversion_windows_x86_64.exe" target="_blank" rel="noopener">clique aqui</a>.', "dim");
      }
    },
    sudo: {
      desc: "???",
      run: function () { line("permissão negada: você já é o admin deste laboratório.", "term-err"); }
    },
    logout: {
      desc: "encerra a sessão",
      run: function () {
        line("encerrando sessão…");
        setTimeout(function () { window.LunariumAuth.logout(); }, 300);
      }
    }
  };

  function printBanner() {
    line(
      '<pre class="term-banner">' +
      "LUNARIUM'S LAB — terminal v1.0\n" +
      "digite 'help' para ver os comandos.</pre>"
    );
  }

  function run(raw) {
    var trimmed = raw.trim();
    line('<span class="term-prompt">visitante@lunarium</span><span class="dim">:~$</span> ' + escapeHtml(trimmed), "term-echo");
    if (!trimmed) return;
    history.push(trimmed);
    historyPos = history.length;
    var parts = trimmed.split(/\s+/);
    var cmd = parts.shift().toLowerCase();
    if (COMMANDS[cmd]) {
      COMMANDS[cmd].run(parts);
    } else {
      line("comando não encontrado: " + escapeHtml(cmd) + ' <span class="dim">(digite "help")</span>', "term-err");
    }
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function init(outId, inId) {
    outputEl = document.getElementById(outId);
    inputEl = document.getElementById(inId);
    printBanner();
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        run(inputEl.value);
        inputEl.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyPos > 0) { historyPos--; inputEl.value = history[historyPos] || ""; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyPos < history.length) { historyPos++; inputEl.value = history[historyPos] || ""; }
      }
    });
    document.addEventListener("click", function () { inputEl.focus(); });
    inputEl.focus();
  }

  window.LunariumTerminal = { init: init, COMMANDS: COMMANDS };
})();
