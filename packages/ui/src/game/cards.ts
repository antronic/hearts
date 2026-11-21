export type Suit = "S" | "H" | "D" | "C";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
export type Card = { rank: Rank; suit: Suit };

export const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAME: Record<Suit, string> = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
const RANK_NAME: Record<Rank, string> = {
  "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight",
  "9": "Nine", "10": "Ten", J: "Jack", Q: "Queen", K: "King", A: "Ace",
};
export const isRed = (s: Suit) => s === "H" || s === "D";
export const cardLabel = (c: Card) => `${RANK_NAME[c.rank]} of ${SUIT_NAME[c.suit]}`;
export const cardKey = (c: Card) => `${c.rank}${c.suit}`;
export const parse = (s: string): Card => ({ rank: s.slice(0, -1) as Rank, suit: s.slice(-1) as Suit });
export const hand = (...cs: string[]) => cs.map(parse);

/** Sample data for stories */
export const sampleHand = hand("2C", "7C", "QC", "3D", "9D", "JD", "AD", "4S", "10S", "QS", "5H", "8H", "KH");
