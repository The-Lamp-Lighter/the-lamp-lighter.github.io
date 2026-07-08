/* ============================================================
   LUNARIUM'S LAB — daw-engine.js
   DAW própria: presets via Tone.js, piano roll "desenhável"
   (clica e arrasta pra definir o tamanho da nota, como no
   FL Studio), múltiplas faixas, salvamento no Supabase.
   ============================================================ */

(function () {
  "use strict";

  var BARS = 4, STEPS_PER_BAR = 16, TOTAL_STEPS = BARS * STEPS_PER_BAR;
  var STEP_W = 26, ROW_H = 20;

  function buildPitchRange(startOct, endOct) {
    var names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var out = [];
    for (var oct = endOct; oct >= startOct; oct--) {
      for (var i = names.length - 1; i >= 0; i--) out.push(names[i] + oct);
    }
    return out;
  }
  var MELODIC_PITCHES = buildPitchRange(3, 4); // 24 notas, B4 (topo) até C3 (base)
  var DRUM_NAMES = ["Kick", "Snare", "Clap", "Chimbal fechado", "Chimbal aberto", "Tom"];

  function uid() { return "id" + Math.random().toString(36).slice(2, 10); }

  function buildDrumKit() {
    var vol = new Tone.Volume(0).toDestination();
    var kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(vol);
    var snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.15, sustain: 0 } }).connect(vol);
    var clap = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }).connect(vol);
    var hhC = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(vol);
    var hhO = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.3, release: 0.1 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(vol);
    var tom = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0 } }).connect(vol);
    return {
      volume: vol,
      trigger: function (row, time, v) {
        v = v || 0.85;
        if (row === 0) kick.triggerAttackRelease("C1", "8n", time, v);
        else if (row === 1) snare.triggerAttackRelease("8n", time, v);
        else if (row === 2) clap.triggerAttackRelease("16n", time, v);
        else if (row === 3) hhC.triggerAttackRelease("C6", "32n", time, v);
        else if (row === 4) hhO.triggerAttackRelease("C6", "8n", time, v);
        else if (row === 5) tom.triggerAttackRelease("G2", "8n", time, v);
      },
      dispose: function () { [kick, snare, clap, hhC, hhO, tom, vol].forEach(function (n) { n.dispose(); }); }
    };
  }

  var PRESETS = {
    piano: { label: "Piano Suave", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.9 } }).toDestination();
    } },
    lead: { label: "Synth Lead", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.3 } }).toDestination();
    } },
    bass: { label: "Baixo Grave", type: "melodic", make: function () {
      return new Tone.MonoSynth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 200, octaves: 2 } }).toDestination();
    } },
    pad: { label: "Pad Etéreo", type: "melodic", make: function () {
      var verb = new Tone.Reverb({ decay: 6, wet: 0.45 }).toDestination();
      return new Tone.PolySynth(Tone.AMSynth, { envelope: { attack: 0.6, decay: 0.3, sustain: 0.8, release: 2.5 } }).connect(verb);
    } },
    pluck: { label: "Pluck Cristalino", type: "melodic", make: function () {
      return new Tone.PluckSynth({ attackNoise: 0.5, dampening: 3000, resonance: 0.9 }).toDestination();
    } },
    weird: { label: "FM Estranho", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.2, modulationIndex: 12, envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1 } }).toDestination();
    } },
    drums: { label: "Bateria", type: "drums", make: buildDrumKit }
  };

  var state = { id: null, name: "Sem título", bpm: 100, tracks: [] };
  var selectedTrackId = null;
  var sequence = null;
  var playing = false;

  function getTrack(id) { return state.tracks.filter(function (t) { return t.id === id; })[0]; }
  function selectedTrack() { return getTrack(selectedTrackId); }

  function setTrackPreset(track, key) {
    if (track.instrument) {
      try { track.instrument.dispose(); } catch (e) {}
    }
    track.preset = key;
    track.presetType = PRESETS[key].type;
    track.instrument = PRESETS[key].make();
    track.instrument.volume.value = track.volumeDb != null ? track.volumeDb : 0;
  }

  function addTrack(presetKey) {
    var track = { id: uid(), name: PRESETS[presetKey].label, notes: [], volumeDb: 0, muted: false, solo: false };
    setTrackPreset(track, presetKey);
    state.tracks.push(track);
    selectedTrackId = track.id;
    renderTracks();
    renderRoll();
  }

  function removeTrack(id) {
    var t = getTrack(id);
    if (!t) return;
    if (t.instrument) { try { t.instrument.dispose(); } catch (e) {} }
    state.tracks = state.tracks.filter(function (x) { return x.id !== id; });
    if (selectedTrackId === id) selectedTrackId = state.tracks.length ? state.tracks[0].id : null;
    renderTracks();
    renderRoll();
  }

  function renderTracks() {
    var presetOptions = Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + PRESETS[k].label + '</option>'; }).join("");
    document.getElementById("new-track-preset").innerHTML = presetOptions;

    var list = document.getElementById("track-list");
    if (!state.tracks.length) {
      list.innerHTML = '<p class="dim" style="padding:16px;font-size:.78rem;">Nenhuma faixa ainda.</p>';
      return;
    }
    list.innerHTML = state.tracks.map(function (t) {
      var presetOpts = Object.keys(PRESETS).map(function (k) {
        return '<option value="' + k + '"' + (t.preset === k ? " selected" : "") + '>' + PRESETS[k].label + '</option>';
      }).join("");
      return (
        '<div class="track-row' + (t.id === selectedTrackId ? " active" : "") + '" data-track="' + t.id + '">' +
          '<div class="track-row-top">' +
            '<input type="text" value="' + t.name.replace(/"/g, "&quot;") + '" data-rename="' + t.id + '">' +
            '<div class="track-row-controls">' +
              '<button class="track-mini-btn' + (t.muted ? " on-mute" : "") + '" data-mute="' + t.id + '" title="Mudo">M</button>' +
              '<button class="track-mini-btn' + (t.solo ? " on-solo" : "") + '" data-solo="' + t.id + '" title="Solo">S</button>' +
              '<button class="track-mini-btn" data-remove="' + t.id + '" title="Excluir"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
          '</div>' +
          '<select data-preset="' + t.id + '">' + presetOpts + '</select>' +
          '<input type="range" min="-30" max="6" value="' + t.volumeDb + '" data-volume="' + t.id + '">' +
        '</div>'
      );
    }).join("");

    list.querySelectorAll("[data-track]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest("input, select, button")) return;
        selectedTrackId = row.dataset.track;
        renderTracks();
        renderRoll();
      });
    });
    list.querySelectorAll("[data-rename]").forEach(function (el) {
      el.addEventListener("change", function () { getTrack(el.dataset.rename).name = el.value; });
    });
    list.querySelectorAll("[data-mute]").forEach(function (el) {
      el.addEventListener("click", function () { var t = getTrack(el.dataset.mute); t.muted = !t.muted; renderTracks(); });
    });
    list.querySelectorAll("[data-solo]").forEach(function (el) {
      el.addEventListener("click", function () { var t = getTrack(el.dataset.solo); t.solo = !t.solo; renderTracks(); });
    });
    list.querySelectorAll("[data-remove]").forEach(function (el) {
      el.addEventListener("click", function () { if (confirm("Excluir esta faixa?")) removeTrack(el.dataset.remove); });
    });
    list.querySelectorAll("[data-preset]").forEach(function (el) {
      el.addEventListener("change", function () {
        var t = getTrack(el.dataset.preset);
        setTrackPreset(t, el.value);
        t.name = PRESETS[el.value].label;
        renderTracks();
        renderRoll();
      });
    });
    list.querySelectorAll("[data-volume]").forEach(function (el) {
      el.addEventListener("input", function () {
        var t = getTrack(el.dataset.volume);
        t.volumeDb = parseFloat(el.value);
        t.instrument.volume.value = t.volumeDb;
      });
    });
  }

  function renderRoll() {
    var track = selectedTrack();
    var gridEl = document.getElementById("roll-grid");
    var emptyEl = document.getElementById("roll-empty");
    if (!track) { gridEl.classList.add("hidden"); emptyEl.classList.remove("hidden"); return; }
    emptyEl.classList.add("hidden");
    gridEl.classList.remove("hidden");

    var isDrum = track.presetType === "drums";
    var rows = isDrum ? DRUM_NAMES : MELODIC_PITCHES;
    var totalW = TOTAL_STEPS * STEP_W;

    var html = '<div style="position:relative;width:' + (totalW + 64) + 'px;">';
    rows.forEach(function (label, rowIdx) {
      var isBlack = !isDrum && label.indexOf("#") > -1;
      html +=
        '<div style="display:flex;height:' + ROW_H + 'px;">' +
          '<div class="roll-row-label' + (isBlack ? " black" : "") + '" style="height:' + ROW_H + 'px;">' + label + '</div>' +
          '<div class="roll-cellrow" data-row="' + rowIdx + '" style="width:' + totalW + 'px;height:' + ROW_H + 'px;' +
            'background-image:' + rollBackground(isBlack) + ';background-size:' + (STEP_W * 4) + 'px 100%;"></div>' +
        '</div>';
    });
    html += '<div class="playhead" id="playhead" style="left:64px;height:' + (rows.length * ROW_H) + 'px;"></div>';
    html += '</div>';
    gridEl.innerHTML = html;

    paintNotes(track);
    bindRollInteractions(track);
  }

  function rollBackground(isBlack) {
    var base = isBlack ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.045)";
    return "repeating-linear-gradient(90deg, " + base + " 0, " + base + " 1px, transparent 1px, transparent " + STEP_W + "px)," +
      "linear-gradient(90deg, var(--border) 0, var(--border) 1px, transparent 1px)";
  }

  function paintNotes(track) {
    track.notes.forEach(function (n) {
      var rowEl = document.querySelector('.roll-cellrow[data-row="' + n.pitch + '"]');
      if (!rowEl) return;
      var el = document.createElement("div");
      el.className = "note-block";
      el.style.left = (n.step * STEP_W) + "px";
      el.style.width = (n.length * STEP_W - 2) + "px";
      el.dataset.noteId = n.id;
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        track.notes = track.notes.filter(function (x) { return x.id !== n.id; });
        renderRoll();
      });
      rowEl.appendChild(el);
    });
  }

  function bindRollInteractions(track) {
    var drawing = null;
    document.querySelectorAll(".roll-cellrow").forEach(function (rowEl) {
      var row = parseInt(rowEl.dataset.row, 10);

      rowEl.addEventListener("pointerdown", function (e) {
        if (e.target.classList.contains("note-block")) return;
        var rect = rowEl.getBoundingClientRect();
        var step = Math.floor((e.clientX - rect.left) / STEP_W);
        step = Math.max(0, Math.min(TOTAL_STEPS - 1, step));
        drawing = { row: row, start: step, end: step };
        rowEl.setPointerCapture(e.pointerId);
      });
      rowEl.addEventListener("pointermove", function (e) {
        if (!drawing || drawing.row !== row) return;
        var rect = rowEl.getBoundingClientRect();
        var step = Math.floor((e.clientX - rect.left) / STEP_W);
        step = Math.max(0, Math.min(TOTAL_STEPS - 1, step));
        drawing.end = step;
      });
      rowEl.addEventListener("pointerup", function () {
        if (!drawing || drawing.row !== row) return;
        var start = Math.min(drawing.start, drawing.end);
        var len = Math.abs(drawing.end - drawing.start) + 1;
        track.notes = track.notes.filter(function (n) {
          return !(n.pitch === row && n.step < start + len && n.step + n.length > start);
        });
        track.notes.push({ id: uid(), pitch: row, step: start, length: len, velocity: 0.85 });
        drawing = null;
        renderRoll();
        previewNote(track, row, len);
      });
    });
  }

  function previewNote(track, row, len) {
    if (!track.instrument) return;
    try {
      if (track.presetType === "drums") {
        track.instrument.trigger(row, Tone.now());
      } else {
        var dur = Tone.Time("16n").toSeconds() * len;
        track.instrument.triggerAttackRelease(MELODIC_PITCHES[row], dur);
      }
    } catch (e) {}
  }

  function buildSequence() {
    if (sequence) { sequence.dispose(); sequence = null; }
    var steps = [];
    for (var i = 0; i < TOTAL_STEPS; i++) steps.push(i);
    sequence = new Tone.Sequence(function (time, step) {
      var anySolo = state.tracks.some(function (t) { return t.solo; });
      state.tracks.forEach(function (track) {
        if (track.muted) return;
        if (anySolo && !track.solo) return;
        track.notes.forEach(function (n) {
          if (n.step !== step) return;
          if (track.presetType === "drums") {
            track.instrument.trigger(n.pitch, time, n.velocity);
          } else {
            var dur = Tone.Time("16n").toSeconds() * n.length;
            track.instrument.triggerAttackRelease(MELODIC_PITCHES[n.pitch], dur, time, n.velocity);
          }
        });
      });
      Tone.Draw.schedule(function () { movePlayhead(step); }, time);
    }, steps, "16n").start(0);
  }

  function movePlayhead(step) {
    var ph = document.getElementById("playhead");
    if (ph) ph.style.left = (64 + step * STEP_W) + "px";
  }

  function togglePlay() {
    if (playing) {
      Tone.Transport.stop();
      playing = false;
    } else {
      Tone.start().then(function () {
        buildSequence();
        Tone.Transport.loop = document.getElementById("loop-toggle").checked;
        Tone.Transport.loopStart = 0;
        Tone.Transport.loopEnd = BARS + "m";
        Tone.Transport.start();
      });
      playing = true;
    }
    document.getElementById("play-icon").className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
  }

  function stopPlay() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    playing = false;
    document.getElementById("play-icon").className = "fa-solid fa-play";
    movePlayhead(0);
  }

  function serialize() {
    return {
      bpm: state.bpm,
      tracks: state.tracks.map(function (t) {
        return { id: t.id, name: t.name, preset: t.preset, volumeDb: t.volumeDb, muted: t.muted, solo: t.solo, notes: t.notes };
      })
    };
  }

  function loadFromData(data) {
    state.tracks.forEach(function (t) { if (t.instrument) { try { t.instrument.dispose(); } catch (e) {} } });
    state.bpm = data.bpm || 100;
    state.tracks = (data.tracks || []).map(function (td) {
      var track = { id: td.id || uid(), name: td.name, notes: td.notes || [], volumeDb: td.volumeDb || 0, muted: !!td.muted, solo: !!td.solo };
      setTrackPreset(track, PRESETS[td.preset] ? td.preset : "piano");
      return track;
    });
    selectedTrackId = state.tracks.length ? state.tracks[0].id : null;
    document.getElementById("bpm-input").value = state.bpm;
    Tone.Transport.bpm.value = state.bpm;
    renderTracks();
    renderRoll();
  }

  function newProject() {
    if (!confirm("Começar um projeto novo? O que não foi salvo se perde.")) return;
    state.tracks.forEach(function (t) { if (t.instrument) { try { t.instrument.dispose(); } catch (e) {} } });
    state = { id: null, name: "Sem título", bpm: 100, tracks: [] };
    selectedTrackId = null;
    document.getElementById("project-name").value = state.name;
    document.getElementById("bpm-input").value = state.bpm;
    Tone.Transport.bpm.value = state.bpm;
    addTrack("piano");
  }

  function saveProject() {
    state.name = document.getElementById("project-name").value.trim() || "Sem título";
    window.LunariumAuth.getSession().then(function (session) {
      if (!session) throw new Error("não autenticado");
      var payload = { owner_id: session.user.id, name: state.name, data: serialize(), updated_at: new Date().toISOString() };
      if (state.id) {
        return window.sb.from("daw_projects").update(payload).eq("id", state.id).select().single();
      }
      return window.sb.from("daw_projects").insert(payload).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      state.id = res.data.id;
      refreshProjectList();
      alert("Projeto salvo!");
    }).catch(function (err) {
      alert("não deu pra salvar: " + (err.message || err));
    });
  }

  function refreshProjectList() {
    window.LunariumAuth.getSession().then(function (session) {
      if (!session) return;
      return window.sb.from("daw_projects").select("id, name").eq("owner_id", session.user.id).order("updated_at", { ascending: false });
    }).then(function (res) {
      if (!res || res.error) return;
      var sel = document.getElementById("load-select");
      sel.innerHTML = '<option value="">Meus projetos…</option>' + res.data.map(function (p) {
        return '<option value="' + p.id + '">' + p.name + '</option>';
      }).join("");
    });
  }

  function loadProject(id) {
    window.sb.from("daw_projects").select("*").eq("id", id).single().then(function (res) {
      if (res.error) { alert(res.error.message); return; }
      state.id = res.data.id;
      state.name = res.data.name;
      document.getElementById("project-name").value = state.name;
      loadFromData(res.data.data);
    });
  }

  document.getElementById("btn-play").addEventListener("click", togglePlay);
  document.getElementById("btn-stop").addEventListener("click", stopPlay);
  document.getElementById("bpm-input").addEventListener("change", function (e) {
    state.bpm = parseInt(e.target.value, 10) || 100;
    Tone.Transport.bpm.value = state.bpm;
  });
  document.getElementById("loop-toggle").addEventListener("change", function (e) {
    Tone.Transport.loop = e.target.checked;
  });
  document.getElementById("btn-add-track").addEventListener("click", function () {
    addTrack(document.getElementById("new-track-preset").value || "piano");
  });
  document.getElementById("btn-new").addEventListener("click", newProject);
  document.getElementById("btn-save").addEventListener("click", saveProject);
  document.getElementById("load-select").addEventListener("change", function (e) {
    if (e.target.value) loadProject(e.target.value);
  });
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !/input|textarea|select/i.test(e.target.tagName)) {
      e.preventDefault();
      togglePlay();
    }
  });

  window.LunariumAuth.getProfile().then(function () {
    renderTracks();
    addTrack("piano");
    refreshProjectList();
  });
})();
