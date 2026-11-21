import { type CardId, isPenalty, points, QUEEN_OF_SPADES, rankValue, suitOf, type Suit } from "./cards";
import { type GameState, legalCards, type Seat, trickWinner } from "./game";

/**
 * A sensible, fast Hearts bot. Deterministic for a given state, so offline and online games
 * behave the same. Strategy in plain words:
 * - Pass: the Queen, Ace and King of spades (unless well guarded), high hearts, and cards that
 *   empty a short suit so you can discard later.
 * - Lead: low cards in safe suits; don't lead spades while holding the Queen.
 * - Follow: duck under the current winner if you can; if you'll win anyway, win high (but not
 *   with points if it can be helped). Last to play on a clean trick: take it with your highest.
 * - Discard (void in the led suit): dump the Queen of spades, then high spades, then high hearts,
 *   then the highest card.
 */
export function botPass(hand: CardId[]): CardId[] {
  const bySuit = (s: Suit) => hand.filter((c) => suitOf(c) === s);
  const spades = bySuit("S");
  const score = (c: CardId) => {
    const s = suitOf(c);
    const r = rankValue(c);
    let v = r; // high cards are dangerous
    if (c === QUEEN_OF_SPADES) v += spades.length >= 5 ? 0 : 30;
    if (s === "S" && r >= 11) v += spades.length >= 5 ? 0 : 20; // K, A of spades
    if (s === "H") v += r >= 9 ? 10 : 2;
    const len = bySuit(s).length;
    if (s !== "S" && len <= 2) v += 8; // help void a short suit
    if (c === "2C") v -= 50; // never pass the 2 of clubs: it's harmless to keep
    return v;
  };
  return [...hand].sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export function botPlay(s: GameState, seat: Seat): CardId {
  const legal = legalCards(s, seat);
  if (legal.length === 1) return legal[0];
  const hand = s.hands[seat];
  const low = (cs: CardId[]) => cs.reduce((a, b) => (rankValue(b) < rankValue(a) ? b : a));
  const high = (cs: CardId[]) => cs.reduce((a, b) => (rankValue(b) > rankValue(a) ? b : a));
  const holdsQueen = hand.includes(QUEEN_OF_SPADES);
  const queenOut = !holdsQueen && !s.taken.some((t) => t.includes(QUEEN_OF_SPADES)) && !s.trick.some((t) => t.card === QUEEN_OF_SPADES);

  // Leading
  if (s.trick.length === 0) {
    const safe = legal.filter((c) => !(suitOf(c) === "S" && (holdsQueen || rankValue(c) >= 10 && queenOut)) && suitOf(c) !== "H");
    const pool = safe.length ? safe : legal;
    // Prefer the suit where we hold the fewest cards (to void it), low card first.
    const count = (c: CardId) => hand.filter((x) => suitOf(x) === suitOf(c)).length;
    return [...pool].sort((a, b) => rankValue(a) - rankValue(b) || count(a) - count(b))[0];
  }

  const lead = suitOf(s.trick[0].card);
  const following = legal.filter((c) => suitOf(c) === lead);
  const trickPts = s.trick.reduce((a, t) => a + points(t.card), 0);
  const winning = s.trick.filter((t) => suitOf(t.card) === lead).reduce((a, b) => (rankValue(b.card) > rankValue(a.card) ? b : a)).card;
  const last = s.trick.length === 3;

  if (following.length) {
    const under = following.filter((c) => rankValue(c) < rankValue(winning));
    // Spades: never put the Queen on a trick an Ace/King already wins unless forced... actually do: it's safe to dump it under.
    if (lead === "S" && holdsQueen && following.includes(QUEEN_OF_SPADES) && rankValue(winning) > rankValue(QUEEN_OF_SPADES)) return QUEEN_OF_SPADES;
    if (last && trickPts === 0 && !(lead === "S" && holdsQueen)) {
      const nonQ = following.filter((c) => c !== QUEEN_OF_SPADES);
      return high(nonQ.length ? nonQ : following);
    }
    if (under.length) return high(under);
    // We'll win it: if last, win with the highest; otherwise play the lowest that wins, avoiding the Queen.
    const nonQ = following.filter((c) => c !== QUEEN_OF_SPADES);
    return last ? high(nonQ.length ? nonQ : following) : low(nonQ.length ? nonQ : following);
  }

  // Void in the led suit: discard
  if (legal.includes(QUEEN_OF_SPADES)) return QUEEN_OF_SPADES;
  const bigSpades = legal.filter((c) => suitOf(c) === "S" && rankValue(c) > rankValue(QUEEN_OF_SPADES));
  if (bigSpades.length && queenOut) return high(bigSpades);
  const hearts = legal.filter((c) => suitOf(c) === "H");
  if (hearts.length) return high(hearts);
  const nonPenalty = legal.filter((c) => !isPenalty(c));
  return high(nonPenalty.length ? nonPenalty : legal);
}

/** Exported for tests and for hints. */
export const wouldWin = (s: GameState, seat: Seat, card: CardId) => trickWinner([...s.trick, { seat, card }]) === seat;
