import { type GameState, type PlayerView, type Seat, whyIllegal } from "@hearts/engine";
import { type Card, parse, type Seat as UiSeat } from "@hearts/ui";

export const REL: UiSeat[] = ["south", "west", "north", "east"];
/** Where an absolute seat sits on your screen. */
export const relSeat = (seat: Seat, you: Seat): UiSeat => REL[(seat - you + 4) % 4];
export const toCard = (id: string): Card => parse(id);
export const toId = (c: Card) => `${c.rank}${c.suit}`;

const SUIT_WORD: Record<string, string> = { C: "♣", D: "♦", S: "♠", H: "♥" };

/** Same rule check as the server, from what this player can see. */
export function reason(v: PlayerView, card: string): string | null {
  const hands = [[], [], [], []] as string[][];
  hands[v.you] = v.hand;
  const s = { phase: v.phase, turn: v.turn, hands, tricksPlayed: v.tricksPlayed, trick: v.trick, heartsBroken: v.heartsBroken } as unknown as GameState;
  return whyIllegal(s, v.you, card);
}

export function hintFor(v: PlayerView, names: string[]): string | null {
  if (v.phase !== "playing") return null;
  if (v.turn !== v.you) return `${names[v.turn]} is playing…`;
  if (v.trick.length === 0) return v.tricksPlayed === 0 ? "Your lead · play the 2♣" : "Your lead";
  const lead = v.trick[0].card.slice(-1);
  const can = v.hand.some((c) => c.endsWith(lead));
  return can ? `Your turn · follow ${SUIT_WORD[lead]}` : "Your turn · you can play any card";
}
