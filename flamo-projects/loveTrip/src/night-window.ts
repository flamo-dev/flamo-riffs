// "Night Window" — six bars at 96 BPM. MIDI pitches and beat offsets make
// the electric piano voicings and the answering melody easy to edit.
export const CLIP_SECONDS = 15;
const BEAT = 60 / 96;
const bars = [
  { bass: 45, keys: [57, 61, 64, 68], melody: [[0.5, 76, 0.7], [1.5, 73, 0.45], [2.25, 71, 0.55], [3, 69, 0.9]] },
  { bass: 42, keys: [57, 61, 64, 68], melody: [[0.5, 68, 0.45], [1.25, 69, 0.8], [2.75, 73, 0.95]] },
  { bass: 38, keys: [57, 61, 64, 66], melody: [[0.25, 74, 0.65], [1.25, 73, 0.45], [2, 69, 0.8], [3.25, 66, 0.6]] },
  { bass: 40, keys: [56, 59, 62, 66], melody: [[0.5, 68, 0.7], [1.5, 71, 0.5], [2.5, 74, 0.6], [3.25, 76, 0.7]] },
  { bass: 38, keys: [57, 61, 64, 66], melody: [[0, 78, 0.9], [1.5, 76, 0.55], [2.25, 73, 0.55], [3, 71, 0.8]] },
  { bass: 45, keys: [57, 61, 64, 68], melody: [[0.25, 73, 0.7], [1.25, 71, 0.55], [2, 69, 1.45]] },
];

export function renderMusic(): Promise<AudioBuffer> {
  const rate = 44100;
  const studio = new OfflineAudioContext(2, rate * CLIP_SECONDS, rate);
  const mix = studio.createGain();
  mix.gain.setValueAtTime(0.92, 0);
  mix.gain.setValueAtTime(0.92, 14.28);
  mix.gain.exponentialRampToValueAtTime(0.0001, CLIP_SECONDS - 0.01);
  mix.connect(studio.destination);

  function instrument(pan: number) {
    const panner = studio.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(mix);
    return panner;
  }
  const keys = instrument(-0.24), bells = instrument(0.22), bass = instrument(0);
  const echo = studio.createDelay(1);
  echo.delayTime.value = BEAT * 0.75;
  const echoLevel = studio.createGain();
  echoLevel.gain.value = 0.2;
  bells.connect(echo).connect(echoLevel).connect(keys);

  function tone(bus: AudioNode, hz: number, start: number, length: number, level: number, type: OscillatorType = 'sine', attack = 0.009) {
    const voice = studio.createOscillator();
    const env = studio.createGain();
    voice.type = type;
    voice.frequency.value = hz;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(level, start + attack);
    env.gain.exponentialRampToValueAtTime(level * 0.25, start + length * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, start + length);
    voice.connect(env).connect(bus);
    voice.start(start);
    voice.stop(start + length);
    return voice;
  }
  const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
  const brush = studio.createBuffer(1, rate / 3, rate);
  const samples = brush.getChannelData(0);
  let seed = 8137;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = seed / 2147483648 - 1;
  }
  function tap(start: number, level: number, cutoff: number, decay: number) {
    const source = studio.createBufferSource();
    const filter = studio.createBiquadFilter(), env = studio.createGain();
    source.buffer = brush;
    filter.type = 'highpass';
    filter.frequency.value = cutoff;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(level, start + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    source.connect(filter).connect(env).connect(mix);
    source.start(start);
    source.stop(start + decay);
  }

  bars.forEach((bar, index) => {
    const at = (beat: number) => (4 * index + beat) * BEAT;
    const closing = index === bars.length - 1;
    for (const beat of closing ? [0] : [0, 2.5]) {
      bar.keys.forEach((note, i) => {
        const start = at(beat) + i * 0.012;
        const duration = closing ? 2.15 : beat === 0 ? 1.02 : 0.64;
        tone(keys, hz(note), start, duration, 0.061, 'sine');
        tone(keys, hz(note) * 2.001, start, duration * 0.55, 0.017, 'triangle');
      });
    }
    for (const [beat, note, length] of bar.melody) {
      tone(bells, hz(note), at(beat), length * BEAT + 0.18, 0.132);
      tone(bells, hz(note) * 2.004, at(beat), 0.18, 0.03);
      tone(bells, hz(note) * 3.01, at(beat), 0.095, 0.012);
    }
    for (const beat of closing ? [0, 2] : [0, 1.75, 3]) {
      tone(bass, hz(bar.bass + (beat === 1.75 ? 7 : 0)), at(beat), beat === 0 ? 0.78 : 0.43, 0.19, 'triangle', 0.018);
    }
    for (const beat of [0, 2]) {
      const start = at(beat);
      const kick = tone(mix, 115, start, 0.24, 0.26, 'sine', 0.004);
      kick.frequency.setValueAtTime(115, start);
      kick.frequency.exponentialRampToValueAtTime(43, start + 0.12);
    }
    for (const beat of closing ? [1] : [1, 3]) {
      tap(at(beat) + 0.013, 0.125, 1250, 0.16);
      tone(mix, 189, at(beat) + 0.012, 0.075, 0.046);
    }
    for (let step = 0; step < (closing ? 5 : 8); step++) {
      tap(at(step / 2) + (step % 2 ? 0.021 : 0), step % 2 ? 0.042 : 0.025, 6700, 0.073);
    }
  });
  return studio.startRendering();
}
