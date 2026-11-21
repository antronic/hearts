import { botPass, botPlay } from "./bot";
import { type CardId } from "./cards";
import { choosePass, type GameState, legalCards, newGame, nextRound, playCard, type Seat, SEATS, type PassDirection, type Phase, type CompletedTrick, type TrickCard, winners } from "./game";

export type Action = { type: "pass"; cards: CardId[] } | { type: "play"; card: CardId } | { type: "nextRound" };

/** What one player is allowed to see. Other players' hands are only counts. */
export type PlayerView = {
  you: Seat;
  phase: Phase;
  round: number;
  target: number;
  passDirection: PassDirection;
  hand: CardId[];
  handCounts: number[];
  passed: boolean[];
  yourPass: CardId[] | null;
  received: CardId[] | null;
  trick: TrickCard[];
  leader: Seat;
  turn: Seat;
  tricksPlayed: number;
  heartsBroken: boolean;
  /** Points taken so far this round, per seat. */
  roundPoints: number[];
  scores: number[];
  history: number[][];
  lastTrick: CompletedTrick | null;
  moon: Seat | null;
  winners: Seat[];
  legal: CardId[];
  version: number;
};

export function viewFor(s: GameState, you: Seat): PlayerView {
  return {
    you,
    phase: s.phase,
    round: s.round,
    target: s.target,
    passDirection: s.passDirection,
    hand: s.hands[you],
    handCounts: s.hands.map((h) => h.length),
    passed: s.passes.map(Boolean),
    yourPass: s.passes[you],
    received: s.received[you],
    trick: s.trick,
    leader: s.leader,
    turn: s.turn,
    tricksPlayed: s.tricksPlayed,
    heartsBroken: s.heartsBroken,
    roundPoints: s.taken.map((t) => t.reduce((a, c) => a + (c.endsWith("H") ? 1 : c === "QS" ? 13 : 0), 0)),
    scores: s.scores,
    history: s.history,
    lastTrick: s.lastTrick,
    moon: s.moon,
    winners: s.phase === "gameOver" ? winners(s) : [],
    legal: s.phase === "playing" && s.turn === you ? legalCards(s, you) : [],
    version: s.version,
  };
}

export function apply(s: GameState, seat: Seat, a: Action): GameState {
  switch (a.type) {
    case "pass":
      return choosePass(s, seat, a.cards);
    case "play":
      return playCard(s, seat, a.card);
    case "nextRound":
      return nextRound(s);
  }
}

/** The next move a bot should make, if any bot is due to act. Used by the server and offline play alike. */
export function nextBotAction(s: GameState, isBot: (seat: Seat) => boolean): { seat: Seat; action: Action } | null {
  if (s.phase === "passing") {
    const seat = SEATS.find((i) => isBot(i) && !s.passes[i]);
    return seat === undefined ? null : { seat, action: { type: "pass", cards: botPass(s.hands[seat]) } };
  }
  if (s.phase === "playing" && isBot(s.turn)) return { seat: s.turn, action: { type: "play", card: botPlay(s, s.turn) } };
  return null;
}

/** Plays a whole game with four bots. Handy for tests and simulations. */
export function simulate(seed: number, target = 100): GameState {
  let s = newGame({ seed, target });
  for (let guard = 0; guard < 10000 && s.phase !== "gameOver"; guard++) {
    if (s.phase === "roundOver") {
      s = nextRound(s);
      continue;
    }
    const b = nextBotAction(s, () => true)!;
    s = apply(s, b.seat, b.action);
  }
  return s;
}
