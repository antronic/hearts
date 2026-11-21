import { type CardId, fullDeck, isPenalty, points, rankValue, rng, shuffle, sortHand, suitOf, TWO_OF_CLUBS } from "./cards";

/** Absolute seat numbers go clockwise: 0 → 1 → 2 → 3. "Pass left" gives to the next seat clockwise. */
export type Seat = 0 | 1 | 2 | 3;
export const SEATS: Seat[] = [0, 1, 2, 3];
export type PassDirection = "left" | "right" | "across" | "none";
export type Phase = "passing" | "playing" | "roundOver" | "gameOver";

export type TrickCard = { seat: Seat; card: CardId };
export type CompletedTrick = { cards: TrickCard[]; winner: Seat; points: number };

export type GameOptions = {
  /** Game ends after the round in which someone reaches this score. Classic: 100. */
  target?: number;
  seed?: number;
};

export type GameState = {
  seed: number;
  /** Increments every deal so each round shuffles differently but replayably. */
  round: number;
  target: number;
  phase: Phase;
  passDirection: PassDirection;
  hands: CardId[][];
  /** Cards each seat has chosen to pass this round (null = not chosen yet). */
  passes: (CardId[] | null)[];
  /** Cards each seat received in the pass (shown briefly to the player). */
  received: (CardId[] | null)[];
  trick: TrickCard[];
  leader: Seat;
  turn: Seat;
  tricksPlayed: number;
  taken: CardId[][];
  heartsBroken: boolean;
  /** Running totals. */
  scores: number[];
  /** Points per round, newest last. */
  history: number[][];
  lastTrick: CompletedTrick | null;
  /** Seat that shot the moon in the last finished round. */
  moon: Seat | null;
  /** Monotonic counter, bumped on every change; clients use it to order updates. */
  version: number;
};

export class RuleError extends Error {}

const PASS_CYCLE: PassDirection[] = ["left", "right", "across", "none"];
export const passDirectionFor = (round: number) => PASS_CYCLE[round % 4];
export const passTarget = (from: Seat, dir: PassDirection): Seat =>
  (((from + (dir === "left" ? 1 : dir === "right" ? 3 : dir === "across" ? 2 : 0)) % 4) as Seat);

export function newGame(opts: GameOptions = {}): GameState {
  const base: GameState = {
    seed: opts.seed ?? Math.floor(Math.random() * 2 ** 31),
    round: -1,
    target: opts.target ?? 100,
    phase: "passing",
    passDirection: "left",
    hands: [[], [], [], []],
    passes: [null, null, null, null],
    received: [null, null, null, null],
    trick: [],
    leader: 0,
    turn: 0,
    tricksPlayed: 0,
    taken: [[], [], [], []],
    heartsBroken: false,
    scores: [0, 0, 0, 0],
    history: [],
    lastTrick: null,
    moon: null,
    version: 0,
  };
  return deal(base);
}

/** Shuffle and deal 13 cards each, then go to passing (or straight to play on a "hold" round). */
export function deal(s: GameState): GameState {
  const round = s.round + 1;
  const deck = shuffle(fullDeck(), rng(s.seed + round * 7919));
  const hands = SEATS.map((i) => sortHand(deck.slice(i * 13, i * 13 + 13)));
  const dir = passDirectionFor(round);
  const next: GameState = {
    ...s,
    round,
    phase: dir === "none" ? "playing" : "passing",
    passDirection: dir,
    hands,
    passes: [null, null, null, null],
    received: [null, null, null, null],
    trick: [],
    tricksPlayed: 0,
    taken: [[], [], [], []],
    heartsBroken: false,
    lastTrick: null,
    moon: null,
    version: s.version + 1,
  };
  return dir === "none" ? startPlay(next) : next;
}

function startPlay(s: GameState): GameState {
  const leader = s.hands.findIndex((h) => h.includes(TWO_OF_CLUBS)) as Seat;
  return { ...s, phase: "playing", leader, turn: leader };
}

/** Choose 3 cards to pass. When all four have chosen, cards change hands and play starts. */
export function choosePass(s: GameState, seat: Seat, cards: CardId[]): GameState {
  if (s.phase !== "passing") throw new RuleError("It's not time to pass cards.");
  if (cards.length !== 3 || new Set(cards).size !== 3) throw new RuleError("Choose exactly 3 cards to pass.");
  if (!cards.every((c) => s.hands[seat].includes(c))) throw new RuleError("You can only pass cards in your hand.");
  const passes = s.passes.map((p, i) => (i === seat ? [...cards] : p));
  let next: GameState = { ...s, passes, version: s.version + 1 };
  if (passes.every(Boolean)) {
    const hands = s.hands.map((h, i) => h.filter((c) => !passes[i]!.includes(c)));
    const received: CardId[][] = [[], [], [], []];
    SEATS.forEach((from) => {
      const to = passTarget(from, s.passDirection);
      received[to] = passes[from]!;
      hands[to] = [...hands[to], ...passes[from]!];
    });
    next = startPlay({ ...next, hands: hands.map(sortHand), received });
  }
  return next;
}

/** Why a card can't be played right now, or null if it can. */
export function whyIllegal(s: GameState, seat: Seat, card: CardId): string | null {
  if (s.phase !== "playing") return "It's not time to play.";
  if (seat !== s.turn) return "It's not your turn.";
  const hand = s.hands[seat];
  if (!hand.includes(card)) return "That card isn't in your hand.";
  const firstTrick = s.tricksPlayed === 0;
  if (s.trick.length === 0) {
    if (firstTrick && card !== TWO_OF_CLUBS) return "Lead the 2 of clubs.";
    if (suitOf(card) === "H" && !s.heartsBroken && hand.some((c) => suitOf(c) !== "H")) return "Hearts aren't broken yet.";
    return null;
  }
  const lead = suitOf(s.trick[0].card);
  if (suitOf(card) !== lead && hand.some((c) => suitOf(c) === lead)) return `You must follow suit (${lead === "C" ? "clubs" : lead === "D" ? "diamonds" : lead === "S" ? "spades" : "hearts"}).`;
  // No points on the first trick, unless you have nothing else.
  if (firstTrick && isPenalty(card) && hand.some((c) => !isPenalty(c))) {
    return "No points on the first trick.";
  }
  return null;
}

export const legalCards = (s: GameState, seat: Seat): CardId[] => s.hands[seat].filter((c) => whyIllegal(s, seat, c) === null);

export function trickWinner(trick: TrickCard[]): Seat {
  const lead = suitOf(trick[0].card);
  return trick.filter((t) => suitOf(t.card) === lead).reduce((a, b) => (rankValue(b.card) > rankValue(a.card) ? b : a)).seat;
}

/** Play a card. Completes the trick, the round and the game as they happen. */
export function playCard(s: GameState, seat: Seat, card: CardId): GameState {
  const why = whyIllegal(s, seat, card);
  if (why) throw new RuleError(why);
  const hands = s.hands.map((h, i) => (i === seat ? h.filter((c) => c !== card) : h));
  const trick = [...s.trick, { seat, card }];
  const heartsBroken = s.heartsBroken || suitOf(card) === "H";
  let next: GameState = { ...s, hands, trick, heartsBroken, turn: ((seat + 1) % 4) as Seat, version: s.version + 1 };
  if (trick.length < 4) return next;

  const winner = trickWinner(trick);
  const pts = trick.reduce((a, t) => a + points(t.card), 0);
  const taken = s.taken.map((t, i) => (i === winner ? [...t, ...trick.map((x) => x.card)] : t));
  next = { ...next, trick: [], taken, leader: winner, turn: winner, tricksPlayed: s.tricksPlayed + 1, lastTrick: { cards: trick, winner, points: pts } };
  if (next.tricksPlayed < 13) return next;
  return finishRound(next);
}

function finishRound(s: GameState): GameState {
  let roundPts = s.taken.map((t) => t.reduce((a, c) => a + points(c), 0));
  const shooter = roundPts.findIndex((p) => p === 26);
  let moon: Seat | null = null;
  if (shooter >= 0) {
    moon = shooter as Seat;
    roundPts = roundPts.map((_, i) => (i === shooter ? 0 : 26));
  }
  const scores = s.scores.map((v, i) => v + roundPts[i]);
  const over = scores.some((v) => v >= s.target);
  return { ...s, scores, history: [...s.history, roundPts], moon, phase: over ? "gameOver" : "roundOver" };
}

/** After the round summary, deal the next round. */
export function nextRound(s: GameState): GameState {
  if (s.phase !== "roundOver") throw new RuleError("The round isn't over.");
  return deal(s);
}

/** Seats with the lowest total (ties share the win). */
export const winners = (s: GameState): Seat[] => {
  const low = Math.min(...s.scores);
  return SEATS.filter((i) => s.scores[i] === low);
};
