/* ============================================================
   LUNARIUM'S LAB — vorrhn-engine.js
   Motor do jogo de cartas. Tabuleiro 7x7, arrastar da mão,
   resolução de efeitos por tipo, arte procedural em ruído.
   ============================================================ */

(function () {
  "use strict";

  var SIZE = 7;
  var HAND_SIZE = 5;
  var GAME_ID = "vorrhn";

  var deck = [];
  var hand = [];
  var board = new Array(SIZE * SIZE).fill(null);
  var profile = null;
  var running = false;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function hashSeed(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h;
  }

  function cardArtSVG(name, tint) {
    var h = hashSeed(name);
    var freq = (0.03 + (h % 12) / 260).toFixed(3);
    var seedNum = h % 100;
    var fid = "n" + h;
    return (
      '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
        '<defs>' +
        '<filter id="' + fid + '" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="' + freq + ' ' + freq + '" numOctaves="3" seed="' + seedNum + '" result="n"/>' +
          '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0 0.06  0 0 0 0.95 0"/>' +
        '</filter>' +
        '<radialGradient id="vig' + fid + '"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.9"/></radialGradient>' +
        '</defs>' +
        '<rect width="100" height="60" fill="#050506"/>' +
        '<rect width="100" height="60" filter="url(#' + fid + ')"/>' +
        '<rect width="100" height="60" fill="' + tint + '" opacity="0.16"/>' +
        '<rect width="100" height="60" fill="url(#vig' + fid + ')" opacity="0.6"/>' +
      '</svg>'
    );
  }

  function makeCardEl(card, draggable) {
    var info = window.VORRHN_TYPE_INFO[card.type];
    var el = document.createElement("div");
    el.className = "vorrhn-card" + (card.fused ? " fused" : "");
    el.dataset.instanceId = card.instanceId;
    el.title = card.desc || "";
    el.innerHTML =
      '<div class="art">' + cardArtSVG(card.name, info.tint) + '</div>' +
      '<div class="info">' +
        '<div class="name">' + card.name + '</div>' +
        '<div class="powerrow">' +
          '<span class="typetag" style="background:' + info.tint + ';">' + info.label.slice(0, 4) + '</span>' +
          '<span class="power">' + card.power + '</span>' +
        '</div>' +
      '</div>';
    if (draggable) {
      el.addEventListener("pointerdown", function (e) { startDrag(e, card, el); });
    }
    return el;
  }

  function buildDeck() {
    deck = shuffle(window.VORRHN_CARDS).map(function (c, i) {
      return Object.assign({}, c, { instanceId: "inst" + i + "_" + Math.random().toString(36).slice(2, 7), power: c.power });
    });
  }

  function drawCards(n) {
    for (var i = 0; i < n && deck.length; i++) hand.push(deck.shift());
  }

  function refillHand() {
    var need = HAND_SIZE - hand.length;
    if (need > 0) drawCards(need);
  }

  function renderHand() {
    var wrap = document.getElementById("hand");
    wrap.innerHTML = "";
    hand.forEach(function (card) { wrap.appendChild(makeCardEl(card, true)); });
  }

  function renderBoard() {
    var boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    for (var i = 0; i < SIZE * SIZE; i++) {
      var cell = document.createElement("div");
      cell.className = "vorrhn-cell";
      cell.dataset.idx = i;
      if (board[i]) cell.appendChild(makeCardEl(board[i], false));
      boardEl.appendChild(cell);
    }
    updateHud();
  }

  function updateHud() {
    var total = board.reduce(function (sum, c) { return sum + (c ? c.power : 0); }, 0);
    document.getElementById("hud-score").textContent = total;
    document.getElementById("hud-deck").textContent = deck.length;
    return total;
  }

  function log(msg) { document.getElementById("effect-log").textContent = msg; }

  var dragState = null;

  function startDrag(e, card, sourceEl) {
    if (!running) return;
    e.preventDefault();
    var ghost = sourceEl.cloneNode(true);
    ghost.className = "vorrhn-card ghost-card";
    document.body.appendChild(ghost);
    sourceEl.classList.add("dragging");
    dragState = { card: card, sourceEl: sourceEl, ghost: ghost };
    moveGhost(e.clientX, e.clientY);

    function onMove(ev) {
      moveGhost(ev.clientX, ev.clientY);
      highlightCellUnder(ev.clientX, ev.clientY, card);
    }
    function onUp(ev) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      finishDrag(ev.clientX, ev.clientY, card, sourceEl, ghost);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function moveGhost(x, y) {
    if (!dragState) return;
    var w = dragState.ghost.offsetWidth || 60;
    var h = dragState.ghost.offsetHeight || 80;
    dragState.ghost.style.transform = "translate(" + (x - w / 2) + "px," + (y - h / 2) + "px)";
  }

  function cellUnderPoint(x, y) {
    var els = document.elementsFromPoint(x, y);
    for (var i = 0; i < els.length; i++) {
      if (els[i].classList && els[i].classList.contains("vorrhn-cell")) return els[i];
    }
    return null;
  }

  function highlightCellUnder(x, y, card) {
    document.querySelectorAll(".vorrhn-cell").forEach(function (c) { c.classList.remove("drag-over", "drag-invalid"); });
    var cell = cellUnderPoint(x, y);
    if (!cell) return;
    var idx = parseInt(cell.dataset.idx, 10);
    var occupied = !!board[idx];
    var valid = card.type === "parasita" ? occupied : !occupied;
    cell.classList.add(valid ? "drag-over" : "drag-invalid");
  }

  function finishDrag(x, y, card, sourceEl, ghost) {
    document.querySelectorAll(".vorrhn-cell").forEach(function (c) { c.classList.remove("drag-over", "drag-invalid"); });
    ghost.remove();
    sourceEl.classList.remove("dragging");
    dragState = null;

    var cell = cellUnderPoint(x, y);
    if (!cell) return;
    var idx = parseInt(cell.dataset.idx, 10);
    var occupied = !!board[idx];

    if (card.type === "parasita") {
      if (!occupied) { log("Parasitas só se fundem a uma carta já colocada."); return; }
      playParasite(card, idx);
    } else {
      if (occupied) { log("Essa célula já está ocupada."); return; }
      playCard(card, idx);
    }
  }

  function neighbors4(idx) {
    var row = Math.floor(idx / SIZE), col = idx % SIZE, out = [];
    if (row > 0) out.push(idx - SIZE);
    if (row < SIZE - 1) out.push(idx + SIZE);
    if (col > 0) out.push(idx - 1);
    if (col < SIZE - 1) out.push(idx + 1);
    return out;
  }
  function neighbors8(idx) {
    var row = Math.floor(idx / SIZE), col = idx % SIZE, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var r = row + dr, c = col + dc;
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) out.push(r * SIZE + c);
      }
    }
    return out;
  }
  function rowColOf(idx) {
    var row = Math.floor(idx / SIZE), col = idx % SIZE, out = [];
    for (var i = 0; i < SIZE; i++) { out.push(row * SIZE + i); out.push(i * SIZE + col); }
    return out.filter(function (i) { return i !== idx; });
  }

  function playCard(card, idx) {
    board[idx] = card;
    removeFromHand(card);

    if (card.effect === "bless") {
      var blessed = 0;
      neighbors4(idx).forEach(function (n) { if (board[n]) { board[n].power += 2; blessed++; } });
      log(blessed ? card.name + " abençoou " + blessed + " vizinho(s): +2 poder cada." : card.name + " entrou sem vizinhos pra abençoar.");
    } else if (card.effect === "curse") {
      var cursed = 0;
      neighbors4(idx).forEach(function (n) { if (board[n]) { board[n].power = Math.max(0, board[n].power - 1); cursed++; } });
      log(cursed ? card.name + " amaldiçoou " + cursed + " vizinho(s): -1 poder cada." : card.name + " entrou sem vizinhos pra amaldiçoar.");
    } else if (card.effect === "devour") {
      var gained = 0, eaten = 0;
      neighbors8(idx).forEach(function (n) {
        if (board[n]) { gained += board[n].power; eaten++; board[n] = null; }
      });
      card.power += gained;
      log(eaten ? card.name + " devorou " + eaten + " carta(s) e absorveu +" + gained + " poder!" : card.name + " não tinha vizinhos pra devorar.");
    } else if (card.effect === "echo") {
      var doubled = 0;
      rowColOf(idx).forEach(function (n) { if (board[n]) { board[n].power *= 2; doubled++; } });
      log(doubled ? card.name + " dobrou o poder de " + doubled + " carta(s) na linha/coluna." : card.name + " ecoou no vazio.");
    } else if (card.effect === "reveal") {
      drawCards(3);
      log(card.name + " revelou 3 cartas extras.");
    } else {
      log(card.name + " entrou no tabuleiro.");
    }

    afterPlay();
  }

  function playParasite(card, idx) {
    var host = board[idx];
    host.power += 3;
    host.fused = true;
    host.name = host.name + " (fundido)";
    removeFromHand(card);
    log(card.name + " se fundiu a " + host.name + ": +3 poder.");
    afterPlay();
  }

  function removeFromHand(card) {
    hand = hand.filter(function (c) { return c.instanceId !== card.instanceId; });
  }

  function afterPlay() {
    if (deck.length) drawCards(1);
    renderBoard();
    renderHand();
    checkGameOver();
  }

  function checkGameOver() {
    if (deck.length === 0 && hand.length === 0) endGame();
  }

  function endGame() {
    running = false;
    var total = updateHud();
    document.getElementById("final-score").textContent = total;
    document.getElementById("end-overlay").classList.remove("hidden");
    submitScore(total);
  }

  function submitScore(total) {
    var msgEl = document.getElementById("stardust-msg");
    if (total <= 0) { msgEl.textContent = "sem poder no tabuleiro dessa vez."; return; }
    window.sb.rpc("submit_game_score", { p_game_id: GAME_ID, p_score: total, p_stardust: total }).then(function (res) {
      if (res.error) { msgEl.textContent = "não deu pra salvar: " + res.error.message; return; }
      msgEl.textContent = "+" + total + " estelar creditado! (total: " + res.data + ")";
      document.getElementById("hud-stardust").textContent = res.data;
    });
  }

  function startGame() {
    buildDeck();
    hand = [];
    board = new Array(SIZE * SIZE).fill(null);
    drawCards(HAND_SIZE);
    running = true;
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("end-overlay").classList.add("hidden");
    log("");
    renderBoard();
    renderHand();
  }

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-restart").addEventListener("click", startGame);

  window.LunariumAuth.getProfile().then(function (p) {
    profile = p;
    if (profile) document.getElementById("hud-stardust").textContent = profile.stardust || 0;
    renderBoard();
  });
})();
