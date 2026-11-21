import { apply, type GameState, newGame, nextBotAction, RuleError, type Seat, viewFor } from "@hearts/engine";
import { createMemo, createSignal, onCleanup } from "solid-js";
import type { GameController } from "./controller";

const KEY = "hearts:solo";
const BOT_NAMES = ["Ace", "Mint", "Tan"];
const DELAY = { pass: 450, play: 650, afterTrick: 1300 };

export function hasSoloGame(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as GameState | null;
    return !!s && s.phase !== "gameOver";
  } catch {
    return false;
  }
}

export function discardSolo() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Offline game against three bots, entirely in the browser. Saved after every move so it survives a reload. */
export function createSoloGame(opts: { name: () => string; target?: 50 | 100; resume?: boolean }): GameController {
  let initial: GameState | null = null;
  if (opts.resume) {
    try {
      initial = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {}
  }
  const [state, setState] = createSignal<GameState>(initial && initial.phase !== "gameOver" ? initial : newGame({ target: opts.target ?? 100 }));
  const [error, setError] = createSignal<string | null>(null);
  const you: Seat = 0;
  const isBot = (s: Seat) => s !== you;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTricks = state().tricksPlayed;

  const commit = (s: GameState) => {
    setState(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
    schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    const s = state();
    const next = nextBotAction(s, isBot);
    if (!next) return;
    const trickJustEnded = s.tricksPlayed !== lastTricks && s.trick.length === 0;
    lastTricks = s.tricksPlayed;
    const wait = next.action.type === "pass" ? DELAY.pass : trickJustEnded ? DELAY.afterTrick : DELAY.play;
    timer = setTimeout(() => commit(apply(state(), next.seat, next.action)), wait);
  };

  const act = (fn: (s: GameState) => GameState) => {
    try {
      setError(null);
      const before = state();
      const after = fn(before);
      lastTricks = before.tricksPlayed;
      commit(after);
    } catch (e) {
      if (e instanceof RuleError) setError(e.message);
      else throw e;
    }
  };

  schedule();
  onCleanup(() => clearTimeout(timer));

  const view = createMemo(() => viewFor(state(), you));
  return {
    kind: "solo",
    view,
    names: () => [opts.name() || "You", ...BOT_NAMES],
    bots: () => [false, true, true, true],
    offline: () => [false, false, false, false],
    error,
    clearError: () => setError(null),
    pass: (cards) => act((s) => apply(s, you, { type: "pass", cards })),
    play: (card) => act((s) => apply(s, you, { type: "play", card })),
    nextRound: () => act((s) => (s.phase === "roundOver" ? apply(s, you, { type: "nextRound" }) : s)),
    newGame: () => {
      lastTricks = 0;
      commit(newGame({ target: state().target as 50 | 100 }));
    },
    leave: () => clearTimeout(timer),
  };
}
