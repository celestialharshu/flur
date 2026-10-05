// Pitch shifter that keeps tempo: a delay line with two read heads that sweep
// at a different speed than the write head (changing pitch), cross-faded with
// a sin^2 window so the jumps between grains are inaudible.
// Kept as a string so it can be loaded via a Blob URL (no bundler config needed).

export const PITCH_WORKLET_NAME = 'flur-pitch-shifter';

export const PITCH_WORKLET_SOURCE = `
class FlurPitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'ratio', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' }];
  }

  constructor() {
    super();
    this.W = 2048;       // grain length in samples
    this.size = 8192;    // circular buffer (power of two)
    this.mask = this.size - 1;
    this.bufs = [new Float32Array(this.size), new Float32Array(this.size)];
    this.write = 0;
    this.phase = 0;
  }

  static tap(buf, pos, mask) {
    const i = Math.floor(pos);
    const f = pos - i;
    const a = buf[i & mask];
    const b = buf[(i + 1) & mask];
    return a + (b - a) * f;
  }

  static win(p) {
    const s = Math.sin(Math.PI * p);
    return s * s;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    if (!input || input.length === 0) {
      for (const ch of output) ch.fill(0);
      return true;
    }

    const ratio = parameters.ratio[0];
    const W = this.W;
    const mask = this.mask;
    const n = output[0].length;
    const step = (1 - ratio) / W;

    const startWrite = this.write;
    const startPhase = this.phase;
    let endWrite = startWrite;
    let endPhase = startPhase;

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch] || input[0];
      const out = output[ch];
      const buf = this.bufs[ch] || this.bufs[0];
      let write = startWrite;
      let phase = startPhase;

      for (let i = 0; i < n; i++) {
        buf[write & mask] = inp[i];
        const p1 = phase;
        let p2 = phase + 0.5;
        if (p2 >= 1) p2 -= 1;
        out[i] =
          FlurPitchShifter.tap(buf, write - (p1 * W + 1), mask) * FlurPitchShifter.win(p1) +
          FlurPitchShifter.tap(buf, write - (p2 * W + 1), mask) * FlurPitchShifter.win(p2);
        write++;
        phase += step;
        if (phase >= 1) phase -= 1;
        else if (phase < 0) phase += 1;
      }
      endWrite = write;
      endPhase = phase;
    }

    this.write = endWrite;
    this.phase = endPhase;
    return true;
  }
}

registerProcessor('${PITCH_WORKLET_NAME}', FlurPitchShifter);
`;
