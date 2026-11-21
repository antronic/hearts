/** Cards are short strings: rank + suit, e.g. "QS", "10H", "2C". Compact on the wire and easy to log. */
export type Suit = "C" | "D" | "S" | "H";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
export type CardId = string;

export const SUITS: Suit[] = ["C", "D", "S", "H"];
export const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export const suitOf = (c: CardId) => c.slice(-1) as Suit;
export const rankOf = (c: CardId) => c.slice(0, -1) as Rank;
/** 0 (two) … 12 (ace) */
export const rankValue = (c: CardId) => RANKS.indexOf(rankOf(c));
export const QUEEN_OF_SPADES = "QS";
export const TWO_OF_CLUBS = "2C";

export const fullDeck = (): CardId[] => SUITS.flatMap((s) => RANKS.map((r) => `${r}${s}`));

/** Hand order: clubs, diamonds, spades, hearts; low to high (alternating colours, like Windows Hearts). */
export const sortHand = (cards: CardId[]) =>
  [...cards].sort((a, b) => SUITS.indexOf(suitOf(a)) - SUITS.indexOf(suitOf(b)) || rankValue(a) - rankValue(b));

export const points = (c: CardId) => (suitOf(c) === "H" ? 1 : c === QUEEN_OF_SPADES ? 13 : 0);
export const isPenalty = (c: CardId) => points(c) > 0;

/** Small, fast, seedable PRNG (mulberry32), so games can be replayed from a seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
