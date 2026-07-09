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

  function renderProjectToWav(data, totalSteps) {
    var stepSeconds = Tone.Time("16n").toSeconds();
    var totalSeconds = stepSeconds * (totalSteps || 64) + 1.5;
    var tracks = data.tracks || [];
    var anySolo = tracks.some(function (t) { return t.solo; });

    return Tone.Offline(function () {
      tracks.forEach(function (t) {
        if (t.muted) return;
        if (anySolo && !t.solo) return;
        var presetKey = PRESETS[t.preset] ? t.preset : "piano";
        var preset = PRESETS[presetKey];
        var inst = preset.make();
        inst.volume.value = t.volumeDb || 0;
        (t.notes || []).forEach(function (n) {
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
    renderProjectToWav: renderProjectToWav,
    triggerDownload: triggerDownload
  };
})();
