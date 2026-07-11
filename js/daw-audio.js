/* ============================================================
   LUNARIUM'S LAB — daw-audio.js
   Presets de instrumento + renderização offline pra WAV.
   Compartilhado entre daw.html (edição) e profile.html (baixar
   direto do card, sem abrir a DAW).
   ============================================================ */

(function () {
  "use strict";

  function buildPitchRange(startOct, endOct) {
    var names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var out = [];
    for (var oct = endOct; oct >= startOct; oct--) {
      for (var i = names.length - 1; i >= 0; i--) out.push(names[i] + oct);
    }
    return out;
  }
  var MELODIC_PITCHES = buildPitchRange(3, 4);

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
    piano_real: { label: "Piano de Cauda", type: "melodic", make: function () {
      // amostras reais de piano, hospedadas pelo próprio time do Tone.js
      return new Tone.Sampler({
        urls: {
          A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", A1: "A1.mp3",
          C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", A2: "A2.mp3",
          C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", A3: "A3.mp3",
          C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3",
          C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", A5: "A5.mp3",
          C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", A6: "A6.mp3",
          C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", A7: "A7.mp3", C8: "C8.mp3"
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).toDestination();
    } },
    lead: { label: "Synth Lead", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.3 } }).toDestination();
    } },
    bass: { label: "Baixo Grave", type: "melodic", make: function () {
      return new Tone.MonoSynth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 200, octaves: 2 } }).toDestination();
    } },
    bass_elec: { label: "Baixo Elétrico", type: "melodic", make: function () {
      return new Tone.MonoSynth({ oscillator: { type: "fmsquare", modulationType: "sawtooth", modulationIndex: 2 }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.3 }, filterEnvelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.3, baseFrequency: 250, octaves: 2.5 } }).toDestination();
    } },
    pad: { label: "Pad Etéreo", type: "melodic", make: function () {
      var verb = new Tone.Reverb({ decay: 6, wet: 0.45 }).toDestination();
      return new Tone.PolySynth(Tone.AMSynth, { envelope: { attack: 0.6, decay: 0.3, sustain: 0.8, release: 2.5 } }).connect(verb);
    } },
    strings: { label: "Cordas", type: "melodic", make: function () {
      var chorus = new Tone.Chorus(4, 2.5, 0.4).start().toDestination();
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", count: 3, spread: 25 },
        envelope: { attack: 0.35, decay: 0.2, sustain: 0.85, release: 1.2 }
      }).connect(chorus);
    } },
    choir: { label: "Coro", type: "melodic", make: function () {
      var verb = new Tone.Reverb({ decay: 4, wet: 0.35 }).toDestination();
      return new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.5, oscillator: { type: "sine" }, modulation: { type: "sine" },
        envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 }
      }).connect(verb);
    } },
    organ: { label: "Órgão", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsquare", count: 3, spread: 10 },
        envelope: { attack: 0.02, decay: 0.05, sustain: 1, release: 0.15 }
      }).toDestination();
    } },
    guitar_dist: { label: "Guitarra Elétrica", type: "melodic", make: function () {
      var dist = new Tone.Distortion(0.35).toDestination();
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.15, release: 0.3 }
      }).connect(dist);
    } },
    guitar_ac: { label: "Violão", type: "melodic", make: function () {
      return new Tone.PluckSynth({ attackNoise: 1, dampening: 4000, resonance: 0.94 }).toDestination();
    } },
    pluck: { label: "Pluck Cristalino", type: "melodic", make: function () {
      return new Tone.PluckSynth({ attackNoise: 0.5, dampening: 3000, resonance: 0.9 }).toDestination();
    } },
    bells: { label: "Sino", type: "melodic", make: function () {
      var verb = new Tone.Reverb({ decay: 3, wet: 0.3 }).toDestination();
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.01, modulationIndex: 14, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 2, sustain: 0, release: 2 },
        modulation: { type: "square" }, modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 }
      }).connect(verb);
    } },
    marimba: { label: "Marimba", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 2, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.3 }
      }).toDestination();
    } },
    brass: { label: "Metais", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: "fatsawtooth", count: 2, spread: 20 },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.4 },
        filterEnvelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.4, baseFrequency: 300, octaves: 3 }
      }).toDestination();
    } },
    flute: { label: "Flauta", type: "melodic", make: function () {
      var vibrato = new Tone.Vibrato(5, 0.15).toDestination();
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.15, decay: 0.1, sustain: 0.8, release: 0.4 }
      }).connect(vibrato);
    } },
    weird: { label: "FM Estranho", type: "melodic", make: function () {
      return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.2, modulationIndex: 12, envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1 } }).toDestination();
    } },
    drums: { label: "Bateria", type: "drums", make: buildDrumKit }
  };

  function audioBufferToWav(buffer) {
    var numChannels = buffer.numberOfChannels;
    var sampleRate = buffer.sampleRate;
    var bitDepth = 16;
    var samples = buffer.length;
    var blockAlign = numChannels * bitDepth / 8;
    var byteRate = sampleRate * blockAlign;
    var dataSize = samples * blockAlign;
    var arrBuf = new ArrayBuffer(44 + dataSize);
    var view = new DataView(arrBuf);
    function writeStr(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    var channels = [];
    for (var c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
    var offset = 44;
    for (var i = 0; i < samples; i++) {
      for (var c2 = 0; c2 < numChannels; c2++) {
        var s = Math.max(-1, Math.min(1, channels[c2][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([view], { type: "audio/wav" });
  }

  /* Converte os blocos (clips) de uma faixa numa lista plana de notas em
     posição absoluta — repete o padrão de cada bloco conforme repeatCount.
     Também aceita o formato antigo (track.notes direto), pra projetos
     salvos antes dos blocos existirem continuarem funcionando. */
  function resolveTrackNotes(track) {
    if (Array.isArray(track.clips)) {
      var out = [];
      track.clips.forEach(function (clip) {
        for (var r = 0; r < clip.repeatCount; r++) {
          var baseStep = (clip.startBar + r * clip.patternBars) * 16;
          (clip.notes || []).forEach(function (n) {
            out.push({ pitch: n.pitch, step: baseStep + n.step, length: n.length, velocity: n.velocity });
          });
        }
      });
      return out;
    }
    return (track.notes || []).slice();
  }

  function renderProjectToWav(data) {
    var stepSeconds = Tone.Time("16n").toSeconds();
    var tracks = data.tracks || [];
    var resolved = tracks.map(function (t) { return { meta: t, notes: resolveTrackNotes(t) }; });
    var maxStep = 16;
    resolved.forEach(function (r) { r.notes.forEach(function (n) { maxStep = Math.max(maxStep, n.step + n.length); }); });
    var totalSeconds = stepSeconds * maxStep + 1.5;
    var anySolo = tracks.some(function (t) { return t.solo; });

    return Tone.Offline(function () {
      resolved.forEach(function (r) {
        var t = r.meta;
        if (t.muted) return;
        if (anySolo && !t.solo) return;
        var presetKey = PRESETS[t.preset] ? t.preset : "piano";
        var preset = PRESETS[presetKey];
        var inst = preset.make();
        inst.volume.value = t.volumeDb || 0;
        r.notes.forEach(function (n) {
          var time = n.step * stepSeconds;
          if (preset.type === "drums") {
            inst.trigger(n.pitch, time, n.velocity);
          } else {
            var dur = stepSeconds * n.length;
            inst.triggerAttackRelease(MELODIC_PITCHES[n.pitch], dur, time, n.velocity);
          }
        });
      });
    }, totalSeconds).then(function (rendered) {
      return audioBufferToWav(rendered.get());
    });
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.LunariumDawAudio = {
    PRESETS: PRESETS,
    MELODIC_PITCHES: MELODIC_PITCHES,
    buildDrumKit: buildDrumKit,
    audioBufferToWav: audioBufferToWav,
    resolveTrackNotes: resolveTrackNotes,
    renderProjectToWav: renderProjectToWav,
    triggerDownload: triggerDownload
  };
})();
