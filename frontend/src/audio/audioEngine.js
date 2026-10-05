import { PITCH_WORKLET_NAME, PITCH_WORKLET_SOURCE } from './pitchWorklet';

// ---------------------------------------------------------------------------
// Flur audio engine
//
//   <audio> -> input -> preamp -> 10-band EQ -> bass -> treble
//           -> pitch shifter (bypassed when not needed)
//           -> spatial (stereo / wide / immersive)
//           -> reverb (dry/wet)  -> limiter -> speakers
//
// Playback speed and "varispeed" pitch use the <audio> element's own
// playbackRate/preservesPitch, so they work even when Web Audio can't.
// Everything else needs Web Audio, which only works if the audio server sends
// CORS headers — we probe for that before touching the element.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'flur_audio_fx';

export const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const EQ_LABELS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

export const EQ_PRESETS = {
  Flat:          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost':  [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Bass Reducer':[-6, -5, -4, -2, 0, 0, 0, 0, 0, 0],
  'Treble Boost':[0, 0, 0, 0, 0, 1, 2, 4, 5, 6],
  Rock:          [5, 4, 3, 1, -1, -1, 1, 3, 4, 5],
  Pop:           [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2],
  Vocal:         [-3, -3, -2, 1, 4, 4, 3, 1, 0, -1],
  Jazz:          [3, 2, 1, 2, -2, -2, 0, 1, 2, 3],
  Classical:     [4, 3, 2, 2, -1, -1, 0, 2, 3, 4],
  Electronic:    [5, 4, 1, 0, -2, 2, 1, 1, 4, 5],
  'Hip-Hop':     [5, 4, 2, 3, -1, -1, 2, 0, 2, 3],
  Acoustic:      [4, 3, 2, 1, 2, 2, 3, 3, 3, 2],
};

export const DEFAULT_STATE = {
  eq: { enabled: true, preset: 'Flat', gains: [...EQ_PRESETS.Flat] },
  tone: { bass: 0, treble: 0 },
  pitch: { semitones: 0, preserveTempo: true },
  reverb: { enabled: false, type: 'room', wet: 0.25, intensity: 0.5 },
  spatial: { mode: 'stereo', intensity: 0.5 },
  speed: { rate: 1, preservePitch: true },
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dbToGain = (db) => Math.pow(10, db / 20);

function loadState() {
  const state = clone(DEFAULT_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(state)) {
        if (saved[key] && typeof saved[key] === 'object') Object.assign(state[key], saved[key]);
      }
      if (!Array.isArray(state.eq.gains) || state.eq.gains.length !== 10) state.eq.gains = [...EQ_PRESETS.Flat];
    }
  } catch { /* storage blocked or corrupt: use defaults */ }
  return state;
}

// ---- pure helper: how should the <audio> element + pitch shifter be driven? ----
// speed S (+ preserve pitch P), pitch f = 2^(semitones/12) (+ preserve tempo T).
// canShift = a real pitch shifter is available.
export function computePlayback(state, canShift) {
  const S = state.speed.rate;
  const P = state.speed.preservePitch;
  const st = state.pitch.semitones;
  const f = Math.pow(2, st / 12);

  if (!canShift) {
    // No shifter: pitch can only change together with speed (varispeed).
    if (Math.abs(st) < 1e-6) return { rate: S, preservesPitch: P, shift: 1 };
    return { rate: S * f, preservesPitch: false, shift: 1 };
  }

  const T = state.pitch.preserveTempo;
  const rate = S * (T ? 1 : f);
  const nativePitch = P ? 1 : rate;     // what the element does by itself
  const targetPitch = f * (P ? 1 : S);  // what we want to hear
  return { rate, preservesPitch: P, shift: targetPitch / nativePitch };
}

// ---- reverb impulse responses ----
const REVERB_TYPES = {
  room:   { seconds: 0.7, decay: 3.0, damping: 0.55, preDelay: 0.004, early: [0.011, 0.017, 0.023, 0.031] },
  hall:   { seconds: 2.8, decay: 2.2, damping: 0.35, preDelay: 0.022, early: [0.03, 0.045, 0.061] },
  studio: { seconds: 1.1, decay: 3.6, damping: 0.15, preDelay: 0.008, early: [0.007, 0.013, 0.019, 0.027, 0.036] },
};

function makeImpulse(ctx, type, intensity) {
  const cfg = REVERB_TYPES[type] || REVERB_TYPES.room;
  const seconds = cfg.seconds * (0.5 + intensity); // intensity: 0.5x .. 1.5x decay length
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const pre = Math.floor(rate * cfg.preDelay);
  const buffer = ctx.createBuffer(2, length, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < length; i++) {
      const t = (i - pre) / (length - pre);
      const noise = Math.random() * 2 - 1;
      // later reflections get darker (one-pole low-pass that closes over time)
      const coef = clamp(1 - cfg.damping * (0.2 + 0.8 * t), 0.05, 1);
      lp += (noise - lp) * coef;
      data[i] = lp * Math.pow(1 - t, cfg.decay);
    }
    // a few distinct early reflections (different per ear)
    cfg.early.forEach((time, k) => {
      const idx = Math.floor(rate * (time + (ch ? 0.0013 : 0))) ;
      if (idx < length) data[idx] += (ch ? -1 : 1) * 0.6 / (k + 1);
    });
  }
  return buffer;
}

class AudioEngine {
  constructor() {
    this.state = loadState();
    this.audio = null;
    this.ctx = null;
    this.nodes = null;
    this.corsOk = null; // null = unknown yet, true / false after probing a stream
    this.corsCache = new Map();
    this.workletReady = false;
    this.graphActive = false;
    this.building = false;
    this.irKey = '';
    this.irTimer = null;
    this.listeners = new Set();
    this.snapshot = this._makeSnapshot();
  }

  // ---------- store API (used by the React hook) ----------
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  _makeSnapshot() {
    return {
      state: this.state,
      corsOk: this.corsOk,
      graphActive: this.graphActive,
      canShift: this._canShiftPotential(),
      active: this._needsGraph(),
    };
  }

  _emit() {
    this.snapshot = this._makeSnapshot();
    this.listeners.forEach((l) => l());
  }

  update(section, patch) {
    this.state = { ...this.state, [section]: { ...this.state[section], ...patch } };
    this._save();
    this._apply();
    this._emit();
  }

  setEqBand(index, gain) {
    const gains = [...this.state.eq.gains];
    gains[index] = clamp(gain, -12, 12);
    this.update('eq', { gains, preset: 'Custom' });
  }

  setEqPreset(name) {
    if (!EQ_PRESETS[name]) return;
    this.update('eq', { gains: [...EQ_PRESETS[name]], preset: name });
  }

  reset(section) {
    if (section) this.update(section, clone(DEFAULT_STATE[section]));
    else {
      this.state = clone(DEFAULT_STATE);
      this._save();
      this._apply();
      this._emit();
    }
  }

  _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* ignore */ }
  }

  // ---------- <audio> element ----------
  attachElement(audio) {
    if (this.audio === audio) return;
    this.audio = audio;
    // playbackRate is reset by the browser whenever a new source loads
    audio.addEventListener('loadstart', () => this._applyNative());
    this._applyNative();
  }

  // Can this stream be run through Web Audio? (needs CORS headers from the server)
  async supportsCors(url) {
    let origin;
    try { origin = new URL(url).origin; } catch { return false; }

    const cached = this.corsCache.get(origin);
    if (cached && (cached.ok || Date.now() - cached.at < 2 * 60 * 1000)) {
      this.corsOk = cached.ok;
      return cached.ok;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    let ok = false;
    try {
      // 1-byte range request; if headers come back, CORS is allowed
      await fetch(url, { mode: 'cors', headers: { Range: 'bytes=0-0' }, signal: ctrl.signal, cache: 'no-store' });
      ok = true;
    } catch {
      ok = false;
    } finally {
      clearTimeout(timer);
      ctrl.abort();
    }

    this.corsCache.set(origin, { ok, at: Date.now() });
    this.corsOk = ok;
    this._apply();
    this._emit();
    return ok;
  }

  // The element failed to load with crossOrigin on: remember that this origin can't do CORS.
  markCorsFailed(url) {
    try { this.corsCache.set(new URL(url).origin, { ok: false, at: Date.now() }); } catch { /* ignore */ }
    this.corsOk = false;
    this._emit();
  }

  onTrackLoaded() {
    this._apply();
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch { /* needs a user gesture */ }
    }
  }

  // ---------- internals ----------
  _canShiftPotential() {
    return this.corsOk === true && typeof AudioWorkletNode !== 'undefined';
  }

  _canShiftNow() {
    return this.graphActive && this.workletReady;
  }

  _needsGraph() {
    const { eq, tone, reverb, spatial } = this.state;
    const eqActive = eq.enabled && eq.gains.some((g) => Math.abs(g) > 0.01);
    const toneActive = Math.abs(tone.bass) > 0.01 || Math.abs(tone.treble) > 0.01;
    const shiftActive = Math.abs(computePlayback(this.state, this._canShiftPotential()).shift - 1) > 0.001;
    const reverbActive = reverb.enabled && reverb.wet > 0.01;
    const spatialActive = spatial.mode !== 'stereo';
    return eqActive || toneActive || shiftActive || reverbActive || spatialActive;
  }

  _applyNative() {
    const audio = this.audio;
    if (!audio) return;
    const pb = computePlayback(this.state, this._canShiftNow());
    const rate = clamp(pb.rate, 0.0625, 8);
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    audio.preservesPitch = pb.preservesPitch;
    audio.mozPreservesPitch = pb.preservesPitch;
    audio.webkitPreservesPitch = pb.preservesPitch;
  }

  _apply() {
    this._applyNative();
    if (this._needsGraph() && this.corsOk === true && !this.graphActive && !this.building) {
      this._buildGraph();
    }
    if (this.graphActive) this._pushParams();
  }

  async _buildGraph() {
    const audio = this.audio;
    if (!audio || this.building || this.graphActive) return;
    // crossOrigin must have been set BEFORE the source loaded, otherwise the
    // graph would output silence for this element.
    if (audio.crossOrigin !== 'anonymous') return;

    this.building = true;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctor({ latencyHint: 'playback' });

      let workletReady = false;
      if (ctx.audioWorklet) {
        try {
          const url = URL.createObjectURL(new Blob([PITCH_WORKLET_SOURCE], { type: 'application/javascript' }));
          await ctx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);
          workletReady = true;
        } catch (err) {
          console.warn('Pitch shifter unavailable:', err);
        }
      }

      const n = this._createNodes(ctx, workletReady);
      const source = ctx.createMediaElementSource(audio);
      source.connect(n.input);

      this.ctx = ctx;
      this.nodes = n;
      this.workletReady = workletReady;
      this.graphActive = true;
      this.irKey = '';
      await this.resume();
      this._applyNative();
      this._pushParams();
      this._emit();
    } catch (err) {
      console.error('Failed to build audio effects graph:', err);
    } finally {
      this.building = false;
    }
  }

  _createNodes(ctx, withShifter) {
    const stereo = (node) => {
      node.channelCount = 2;
      node.channelCountMode = 'explicit';
      node.channelInterpretation = 'speakers';
      return node;
    };
    const gain = (v = 1) => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };

    const input = stereo(ctx.createGain());
    const pre = gain(1);

    const eq = EQ_FREQS.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = i === 0 ? 'lowshelf' : i === EQ_FREQS.length - 1 ? 'highshelf' : 'peaking';
      b.frequency.value = f;
      if (b.type === 'peaking') b.Q.value = 1.41;
      return b;
    });
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 120;
    const treble = ctx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 6000;

    input.connect(pre);
    let prev = pre;
    [...eq, bass, treble].forEach((node) => { prev.connect(node); prev = node; });
    const toneOut = prev;

    // --- pitch (direct path + shifter path, switched by gains) ---
    const pitchOut = stereo(ctx.createGain());
    const pitchDirect = gain(1);
    const pitchWet = gain(0);
    toneOut.connect(pitchDirect);
    pitchDirect.connect(pitchOut);
    let shifter = null;
    if (withShifter) {
      shifter = new AudioWorkletNode(ctx, PITCH_WORKLET_NAME, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: 'explicit',
      });
      toneOut.connect(shifter);
      shifter.connect(pitchWet);
      pitchWet.connect(pitchOut);
    }

    // --- spatial: plain stereo path or mid/side widener ---
    const spatialOut = gain(1);
    const spDry = gain(1);
    pitchOut.connect(spDry);
    spDry.connect(spatialOut);

    const spWet = gain(0);
    const splitter = ctx.createChannelSplitter(2);
    pitchOut.connect(splitter);
    const mid = gain(1);
    const side = gain(1);
    const midL = gain(0.5), midR = gain(0.5), sideL = gain(0.5), sideR = gain(-0.5);
    splitter.connect(midL, 0); splitter.connect(midR, 1);
    splitter.connect(sideL, 0); splitter.connect(sideR, 1);
    [midL, midR].forEach((g) => g.connect(mid));
    [sideL, sideR].forEach((g) => g.connect(side));
    const sideScale = gain(1);
    const sideInvert = gain(-1);
    side.connect(sideScale);
    sideScale.connect(sideInvert);
    const merger = ctx.createChannelMerger(2);
    mid.connect(merger, 0, 0);
    mid.connect(merger, 0, 1);
    sideScale.connect(merger, 0, 0);
    sideInvert.connect(merger, 0, 1);
    // ambience for "immersive": each ear also gets a delayed copy of the other ear
    const dlyL = ctx.createDelay(0.1); dlyL.delayTime.value = 0.017;
    const dlyR = ctx.createDelay(0.1); dlyR.delayTime.value = 0.012;
    const ambGainL = gain(0), ambGainR = gain(0);
    splitter.connect(dlyL, 0);      // left channel  -> delayed -> right ear
    splitter.connect(dlyR, 1);      // right channel -> delayed -> left ear
    dlyL.connect(ambGainR);
    dlyR.connect(ambGainL);
    ambGainL.connect(merger, 0, 0);
    ambGainR.connect(merger, 0, 1);
    const msComp = gain(1);
    merger.connect(msComp);
    msComp.connect(spWet);
    spWet.connect(spatialOut);

    // --- reverb ---
    const revOut = gain(1);
    const revDry = gain(1);
    const revWet = gain(0);
    const convolver = ctx.createConvolver();
    spatialOut.connect(revDry);
    revDry.connect(revOut);
    spatialOut.connect(convolver);
    convolver.connect(revWet);
    revWet.connect(revOut);

    // --- safety limiter so boosts don't clip ---
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    revOut.connect(limiter);
    limiter.connect(ctx.destination);

    return {
      input, pre, eq, bass, treble, pitchDirect, pitchWet, shifter,
      spDry, spWet, sideScale, ambGainL, ambGainR, msComp,
      revDry, revWet, convolver,
    };
  }

  _pushParams() {
    const { ctx, nodes: n } = this;
    if (!ctx || !n) return;
    const { eq, tone, reverb, spatial } = this.state;
    const t = ctx.currentTime;
    const tc = 0.03;
    const set = (param, value) => param.setTargetAtTime(value, t, tc);

    // EQ / tone
    eq.gains.forEach((g, i) => set(n.eq[i].gain, eq.enabled ? g : 0));
    set(n.bass.gain, tone.bass);
    set(n.treble.gain, tone.treble);
    const maxBoost = Math.max(0, tone.bass, tone.treble, ...(eq.enabled ? eq.gains : [0]));
    set(n.pre.gain, dbToGain(-maxBoost * 0.5)); // headroom for boosts

    // pitch shifter
    const pb = computePlayback(this.state, this._canShiftNow());
    const shifting = this._canShiftNow() && Math.abs(pb.shift - 1) > 0.001;
    if (n.shifter) {
      const ratioParam = n.shifter.parameters.get('ratio');
      ratioParam.setValueAtTime(clamp(pb.shift, 0.25, 4), t);
    }
    set(n.pitchWet.gain, shifting ? 1 : 0);
    set(n.pitchDirect.gain, shifting ? 0 : 1);

    // spatial
    const I = spatial.intensity;
    let k = 1;
    let amb = 0;
    if (spatial.mode === 'wide') k = 1 + 1.5 * I;
    if (spatial.mode === 'immersive') { k = 1 + 1.0 * I; amb = 0.45 * I; }
    const on = spatial.mode !== 'stereo';
    set(n.spDry.gain, on ? 0 : 1);
    set(n.spWet.gain, on ? 1 : 0);
    set(n.sideScale.gain, k);
    set(n.msComp.gain, Math.sqrt(2 / (1 + k * k)));
    set(n.ambGainL.gain, amb);
    set(n.ambGainR.gain, amb);

    // reverb mix (equal power) + impulse response
    const wet = reverb.enabled ? reverb.wet : 0;
    set(n.revDry.gain, Math.cos(wet * Math.PI / 2));
    set(n.revWet.gain, Math.sin(wet * Math.PI / 2));
    const key = `${reverb.type}|${Math.round(reverb.intensity * 20)}`;
    if (key !== this.irKey && wet > 0) {
      this.irKey = key;
      clearTimeout(this.irTimer);
      this.irTimer = setTimeout(() => {
        try { n.convolver.buffer = makeImpulse(ctx, reverb.type, reverb.intensity); } catch { /* ignore */ }
      }, 120);
    }
  }
}

export const audioEngine = new AudioEngine();
