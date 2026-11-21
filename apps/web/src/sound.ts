import { settings } from "./settings";

let ctx: AudioContext | null = null;
const TONES = {
  card: [[520, 0.04, "triangle"]],
  trick: [[330, 0.06, "sine"], [440, 0.08, "sine"]],
  ouch: [[300, 0.1, "sawtooth"], [200, 0.14, "sawtooth"]],
  turn: [[660, 0.06, "sine"], [880, 0.08, "sine"]],
  error: [[180, 0.12, "square"]],
} as const;

/** Tiny synthesized sound effects (no audio files to cache). Silent until the first tap, as browsers require. */
export function sfx(kind: keyof typeof TONES) {
  if (!settings().sound) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    let t = ctx.currentTime;
    for (const [f, d, type] of TONES[kind]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + d);
      t += d * 0.9;
    }
  } catch {}
}
