/**
 * shared/sound.js — CalmScroll Web Audio Sound Engine
 *
 * Provides pure client-side procedural sound generation:
 * - Soothing Tibetan Singing Bowl / Mindfulness Chime (bell harmonics)
 * - Procedural Brown Noise / Rain generator for deep focus (ADHD/distraction dampening)
 * - White Noise  — crisp, even masking hiss
 * - Rain on Window — Poisson-burst rain drops with low-rumble thunder undertone
 * - Ocean Waves  — slow LFO-modulated band-passed surf wash
 * - Forest Night — cricket pulse choir with subtle breeze
 * - Cafe Murmur  — stochastic voice-like brown noise with clinking accents
 * - Breathing pace tones for the 2-minute reset
 *
 * Zero external audio files, zero network bandwidth, 100% offline & private.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalmSound = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var audioCtx = null;

  // Each ambient track keeps its own node references & state
  var tracks = {};
  // Currently active track id (only one plays at a time)
  var activeTrackId = null;

  function getAudioContext() {
    if (!audioCtx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  /* ═══════════════════════════════════════════════
     CHIME & BREATH (unchanged public helpers)
  ═══════════════════════════════════════════════ */

  /**
   * Plays a resonant singing bowl / mindfulness chime.
   * Uses fundamental tone + soft harmonic overtones with exponential decay.
   */
  function playChime(freq) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;

      var baseFreq = freq || 528; // 528Hz Solfeggio "transformation / clarity" tone
      var now = ctx.currentTime;

      // Master chime gain
      var masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.3, now + 0.04);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      masterGain.connect(ctx.destination);

      // Fundamental oscillator (warm sine)
      var osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.connect(masterGain);

      // Overtone 1 (higher harmonic shimmer)
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.76, now);
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Overtone 2 (warm sub-octave foundation)
      var osc3 = ctx.createOscillator();
      var gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 0.5, now);
      gain3.gain.setValueAtTime(0.12, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 2.9);
      osc2.stop(now + 2.9);
      osc3.stop(now + 2.9);
    } catch (err) {
      console.warn('[CalmScroll Sound] Error playing chime:', err);
    }
  }

  /**
   * Plays a soft breath cue tone (gentle pitch rise for inhale, gentle fall for exhale)
   */
  function playBreathCue(phase) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      var startFreq = phase === 'inhale' ? 220 : 330;
      var endFreq = phase === 'inhale' ? 330 : 220;
      if (phase === 'hold') {
        startFreq = 277;
        endFreq = 277;
      }

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.8);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════
     NOISE BUFFER HELPERS
  ═══════════════════════════════════════════════ */

  /** Returns a loopable AudioBuffer of Brownian (1/f²) noise. */
  function makeBrownBuffer(ctx) {
    var bufferSize = ctx.sampleRate * 3;
    var buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var lastOut = 0.0;
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buf;
  }

  /** Returns a loopable AudioBuffer of White noise. */
  function makeWhiteBuffer(ctx) {
    var bufferSize = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /** Returns a loopable AudioBuffer of Pink (1/f) noise. */
  function makePinkBuffer(ctx) {
    var bufferSize = ctx.sampleRate * 3;
    var buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + white*0.0555179;
      b1 = 0.99332*b1 + white*0.0750759;
      b2 = 0.96900*b2 + white*0.1538520;
      b3 = 0.86650*b3 + white*0.3104856;
      b4 = 0.55000*b4 + white*0.5329522;
      b5 = -0.7616*b5 - white*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buf;
  }

  /* ═══════════════════════════════════════════════
     GENERIC TRACK MANAGEMENT
  ═══════════════════════════════════════════════ */

  function stopTrack(id, cb) {
    var t = tracks[id];
    if (!t || !t.playing) { if (cb) cb(); return; }
    try {
      var masterGain = t.masterGain;
      var ctx = audioCtx;
      if (masterGain && ctx) {
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      }
      setTimeout(function () {
        if (t.nodes) {
          t.nodes.forEach(function (n) {
            try { n.stop(); } catch(e) {}
            try { n.disconnect(); } catch(e) {}
          });
        }
        if (masterGain) { try { masterGain.disconnect(); } catch(e) {} }
        // stop any scheduled timers for this track
        if (t.timers) { t.timers.forEach(function(id){ clearTimeout(id); }); }
        t.playing = false;
        t.nodes   = [];
        t.timers  = [];
        if (cb) cb();
      }, 500);
    } catch (e) {
      t.playing = false;
      if (cb) cb();
    }
  }

  function fadeInMaster(masterGain, ctx, targetVol) {
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.6);
  }

  /* ═══════════════════════════════════════════════
     1. BROWN NOISE  (existing, refactored)
  ═══════════════════════════════════════════════ */

  function startBrownNoise(volume) {
    _startAmbient('brown', volume, function(ctx, masterGain, vol) {
      var src = ctx.createBufferSource();
      src.buffer = makeBrownBuffer(ctx);
      src.loop = true;

      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(420, ctx.currentTime);

      src.connect(lpf);
      lpf.connect(masterGain);
      src.start(0);
      return { nodes: [src], masterGain: masterGain };
    });
  }

  function stopBrownNoise() { _stopAmbient('brown'); }

  /* ═══════════════════════════════════════════════
     2. WHITE NOISE
  ═══════════════════════════════════════════════ */

  function startWhiteNoise(volume) {
    _startAmbient('white', volume, function(ctx, masterGain) {
      var src = ctx.createBufferSource();
      src.buffer = makeWhiteBuffer(ctx);
      src.loop = true;

      // Gentle HPF to remove low rumble, LPF to soften high end
      var hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(300, ctx.currentTime);

      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(6000, ctx.currentTime);

      src.connect(hpf);
      hpf.connect(lpf);
      lpf.connect(masterGain);
      src.start(0);
      return { nodes: [src], masterGain: masterGain };
    });
  }

  function stopWhiteNoise() { _stopAmbient('white'); }

  /* ═══════════════════════════════════════════════
     3. RAIN ON WINDOW
     Poisson-burst drops on a pink-noise undertone.
  ═══════════════════════════════════════════════ */

  function startRain(volume) {
    _startAmbient('rain', volume, function(ctx, masterGain) {
      // Continuous pink undertone (gentle shower ambience)
      var pinkSrc = ctx.createBufferSource();
      pinkSrc.buffer = makePinkBuffer(ctx);
      pinkSrc.loop = true;

      var undertoneGain = ctx.createGain();
      undertoneGain.gain.setValueAtTime(0.55, ctx.currentTime);

      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(1800, ctx.currentTime);

      pinkSrc.connect(lpf);
      lpf.connect(undertoneGain);
      undertoneGain.connect(masterGain);
      pinkSrc.start(0);

      // Stochastic drip bursts — schedule ahead then recurse
      var timers = [];
      function scheduleDrop() {
        var t = tracks['rain'];
        if (!t || !t.playing) return;
        var delay = 40 + Math.random() * 180; // ms between drops
        var tid = setTimeout(function () {
          if (!tracks['rain'] || !tracks['rain'].playing) return;
          try {
            var dropSrc = ctx.createBufferSource();
            var dropBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
            var dd = dropBuf.getChannelData(0);
            for (var i = 0; i < dd.length; i++) { dd[i] = (Math.random()*2-1) * Math.exp(-i/(dd.length*0.25)); }
            dropSrc.buffer = dropBuf;

            var dropGain = ctx.createGain();
            var dropVol = 0.05 + Math.random() * 0.12;
            dropGain.gain.setValueAtTime(dropVol, ctx.currentTime);

            var dropFilter = ctx.createBiquadFilter();
            dropFilter.type = 'bandpass';
            dropFilter.frequency.setValueAtTime(2000 + Math.random() * 4000, ctx.currentTime);
            dropFilter.Q.setValueAtTime(2, ctx.currentTime);

            dropSrc.connect(dropFilter);
            dropFilter.connect(dropGain);
            dropGain.connect(masterGain);
            dropSrc.start(ctx.currentTime);
            dropSrc.stop(ctx.currentTime + 0.06);
          } catch(e) {}
          scheduleDrop();
        }, delay);
        timers.push(tid);
        tracks['rain'].timers = timers;
      }
      scheduleDrop();

      return { nodes: [pinkSrc], masterGain: masterGain, timers: timers };
    });
  }

  function stopRain() { _stopAmbient('rain'); }

  /* ═══════════════════════════════════════════════
     4. OCEAN WAVES
     Slow LFO amplitude-modulated band-passed brown noise.
  ═══════════════════════════════════════════════ */

  function startOcean(volume) {
    _startAmbient('ocean', volume, function(ctx, masterGain) {
      var src = ctx.createBufferSource();
      src.buffer = makeBrownBuffer(ctx);
      src.loop = true;

      // Band-pass around 300–800 Hz for that surf "swoosh"
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(500, ctx.currentTime);
      bpf.Q.setValueAtTime(0.5, ctx.currentTime);

      // LFO for wave rhythm (~0.12 Hz = ~8 second wave period)
      var lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(1.0, ctx.currentTime);

      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.11, ctx.currentTime); // one wave every ~9 s

      // LFO modulates lfoGain's gain — range 0.15 → 1.0
      var lfoDepth = ctx.createGain();
      lfoDepth.gain.setValueAtTime(0.42, ctx.currentTime); // depth

      var lfoOffset = ctx.createGain();
      lfoOffset.gain.setValueAtTime(0.58, ctx.currentTime); // centre

      lfo.connect(lfoDepth);
      lfoDepth.connect(lfoGain.gain);
      lfo.connect(lfoOffset);
      // We'd need a ConstantSourceNode for offset but that's ES6 — use a DC osc trick
      var dcOsc = ctx.createOscillator();
      dcOsc.type = 'sine';
      dcOsc.frequency.setValueAtTime(0, ctx.currentTime);
      var dcGain = ctx.createGain();
      dcGain.gain.setValueAtTime(0.55, ctx.currentTime);
      dcOsc.connect(dcGain);
      dcGain.connect(lfoGain.gain);

      src.connect(bpf);
      bpf.connect(lfoGain);
      lfoGain.connect(masterGain);

      src.start(0);
      lfo.start(0);
      dcOsc.start(0);

      return { nodes: [src, lfo, dcOsc], masterGain: masterGain };
    });
  }

  function stopOcean() { _stopAmbient('ocean'); }

  /* ═══════════════════════════════════════════════
     5. FOREST NIGHT  (crickets + gentle breeze)
     Sine-pulse choir at cricket frequencies + pink breeze.
  ═══════════════════════════════════════════════ */

  function startForest(volume) {
    _startAmbient('forest', volume, function(ctx, masterGain) {
      var nodes = [];

      // Breeze layer — low-passed pink noise
      var breezeSrc = ctx.createBufferSource();
      breezeSrc.buffer = makePinkBuffer(ctx);
      breezeSrc.loop = true;
      var breezeGain = ctx.createGain();
      breezeGain.gain.setValueAtTime(0.18, ctx.currentTime);
      var breezeLpf = ctx.createBiquadFilter();
      breezeLpf.type = 'lowpass';
      breezeLpf.frequency.setValueAtTime(600, ctx.currentTime);
      breezeSrc.connect(breezeLpf);
      breezeLpf.connect(breezeGain);
      breezeGain.connect(masterGain);
      breezeSrc.start(0);
      nodes.push(breezeSrc);

      // Cricket oscillator layer — multiple detuned sine waves pulsed by an LFO
      // Common cricket chirp: ~4–5 kHz (treble), pulse rate ~4 Hz
      var cricketFreqs = [4200, 4350, 4500, 4650, 4800];
      cricketFreqs.forEach(function(freq, idx) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random()-0.5)*80, ctx.currentTime);

        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, ctx.currentTime);

        // Pulse LFO per cricket (stagger phase)
        var lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(3.8 + idx * 0.07, ctx.currentTime); // ~4 Hz chirp rate
        var lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.022, ctx.currentTime); // very quiet individual cricket
        var lfoDC = ctx.createGain();
        lfoDC.gain.setValueAtTime(0.022, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        lfo.connect(lfoDC);
        lfoDC.connect(oscGain.gain);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        // Stagger start times for naturalness
        var startDelay = idx * 0.13;
        osc.start(ctx.currentTime + startDelay);
        lfo.start(ctx.currentTime + startDelay);
        nodes.push(osc, lfo);
      });

      return { nodes: nodes, masterGain: masterGain };
    });
  }

  function stopForest() { _stopAmbient('forest'); }

  /* ═══════════════════════════════════════════════
     6. CAFE MURMUR
     Stochastic voice-formant brown noise + distant clinking.
  ═══════════════════════════════════════════════ */

  function startCafe(volume) {
    _startAmbient('cafe', volume, function(ctx, masterGain) {
      var nodes = [];
      var timers = [];

      // Room tone — band-passed brown noise (speech frequency range)
      var roomSrc = ctx.createBufferSource();
      roomSrc.buffer = makeBrownBuffer(ctx);
      roomSrc.loop = true;
      var roomGain = ctx.createGain();
      roomGain.gain.setValueAtTime(0.45, ctx.currentTime);
      var roomBpf = ctx.createBiquadFilter();
      roomBpf.type = 'bandpass';
      roomBpf.frequency.setValueAtTime(800, ctx.currentTime);
      roomBpf.Q.setValueAtTime(0.6, ctx.currentTime);
      roomSrc.connect(roomBpf);
      roomBpf.connect(roomGain);
      roomGain.connect(masterGain);
      roomSrc.start(0);
      nodes.push(roomSrc);

      // Second formant layer for "voice-like" texture
      var formantSrc = ctx.createBufferSource();
      formantSrc.buffer = makePinkBuffer(ctx);
      formantSrc.loop = true;
      var formantGain = ctx.createGain();
      formantGain.gain.setValueAtTime(0.25, ctx.currentTime);
      var formantBpf = ctx.createBiquadFilter();
      formantBpf.type = 'bandpass';
      formantBpf.frequency.setValueAtTime(2200, ctx.currentTime);
      formantBpf.Q.setValueAtTime(1.2, ctx.currentTime);
      formantSrc.connect(formantBpf);
      formantBpf.connect(formantGain);
      formantGain.connect(masterGain);
      formantSrc.start(0);
      nodes.push(formantSrc);

      // Occasional clink (cup on saucer) — short, bright transient
      function scheduleClink() {
        var t = tracks['cafe'];
        if (!t || !t.playing) return;
        var delay = 3000 + Math.random() * 9000; // every 3–12 s
        var tid = setTimeout(function () {
          if (!tracks['cafe'] || !tracks['cafe'].playing) return;
          try {
            var dur = 0.04;
            var clinkBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
            var cd = clinkBuf.getChannelData(0);
            for (var i = 0; i < cd.length; i++) {
              cd[i] = (Math.random()*2-1) * Math.exp(-i/(cd.length*0.15));
            }
            var clinkSrc2 = ctx.createBufferSource();
            clinkSrc2.buffer = clinkBuf;
            var clinkBpf = ctx.createBiquadFilter();
            clinkBpf.type = 'bandpass';
            clinkBpf.frequency.setValueAtTime(4500 + Math.random()*1500, ctx.currentTime);
            clinkBpf.Q.setValueAtTime(8, ctx.currentTime);
            var clinkGainNode = ctx.createGain();
            clinkGainNode.gain.setValueAtTime(0.06 + Math.random()*0.08, ctx.currentTime);
            clinkSrc2.connect(clinkBpf);
            clinkBpf.connect(clinkGainNode);
            clinkGainNode.connect(masterGain);
            clinkSrc2.start(ctx.currentTime);
            clinkSrc2.stop(ctx.currentTime + dur + 0.02);
          } catch(e) {}
          scheduleClink();
        }, delay);
        timers.push(tid);
        tracks['cafe'].timers = timers;
      }
      scheduleClink();

      return { nodes: nodes, masterGain: masterGain, timers: timers };
    });
  }

  function stopCafe() { _stopAmbient('cafe'); }

  /* ═══════════════════════════════════════════════
     GENERIC START / STOP HELPERS
  ═══════════════════════════════════════════════ */

  /**
   * id      — unique track key
   * volume  — 0..1 target volume
   * builder — function(ctx, masterGain, volume) → { nodes, masterGain, timers? }
   */
  function _startAmbient(id, volume, builder) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;

      var vol = (volume !== undefined) ? volume : 0.25;

      // Stop any currently playing track first
      if (activeTrackId && activeTrackId !== id) {
        var prevId = activeTrackId;
        stopTrack(prevId, function() {});
      }

      // If this track is already playing, just update volume
      if (tracks[id] && tracks[id].playing) {
        setAmbientVolume(vol);
        return;
      }

      // Set up track record before builder runs (so recursion-based tracks can check it)
      tracks[id] = { playing: true, masterGain: null, nodes: [], timers: [], volume: vol };
      activeTrackId = id;

      var masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      fadeInMaster(masterGain, ctx, vol);
      tracks[id].masterGain = masterGain;

      var result = builder(ctx, masterGain, vol);
      if (result) {
        if (result.nodes)  tracks[id].nodes  = result.nodes;
        if (result.timers) tracks[id].timers = result.timers;
      }
    } catch (err) {
      console.warn('[CalmScroll Sound] Error starting', id, ':', err);
    }
  }

  function _stopAmbient(id) {
    if (activeTrackId === id) activeTrackId = null;
    stopTrack(id, function(){});
  }

  function setAmbientVolume(vol) {
    if (!activeTrackId) return;
    var t = tracks[activeTrackId];
    if (t && t.masterGain && audioCtx) {
      var safe = Math.max(0, Math.min(1, vol));
      t.masterGain.gain.linearRampToValueAtTime(safe, audioCtx.currentTime + 0.1);
    }
  }

  function isNoisePlaying() {
    return activeTrackId !== null && tracks[activeTrackId] && tracks[activeTrackId].playing;
  }

  function getActiveTrack() {
    return activeTrackId;
  }

  /* ── Legacy shim (popup.js called startBrownNoise / stopBrownNoise directly) ── */
  function stopAllAmbient() {
    if (activeTrackId) _stopAmbient(activeTrackId);
  }

  return {
    /* Chime & breath */
    playChime:       playChime,
    playBreathCue:   playBreathCue,
    /* Ambient tracks */
    startBrownNoise: startBrownNoise,
    stopBrownNoise:  stopBrownNoise,
    startWhiteNoise: startWhiteNoise,
    stopWhiteNoise:  stopWhiteNoise,
    startRain:       startRain,
    stopRain:        stopRain,
    startOcean:      startOcean,
    stopOcean:       stopOcean,
    startForest:     startForest,
    stopForest:      stopForest,
    startCafe:       startCafe,
    stopCafe:        stopCafe,
    /* Shared controls */
    setNoiseVolume:  setAmbientVolume,
    setAmbientVolume: setAmbientVolume,
    stopAllAmbient:  stopAllAmbient,
    isNoisePlaying:  isNoisePlaying,
    getActiveTrack:  getActiveTrack
  };
});
