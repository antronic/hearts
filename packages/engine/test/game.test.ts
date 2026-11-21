import { describe, expect, it } from "vitest";
import { botPlay, choosePass, fullDeck, legalCards, newGame, passTarget, playCard, points, RuleError, simulate, sortHand, trickWinner, viewFor, whyIllegal, type GameState, type Seat } from "../src";

const state = (over: Partial<GameState>): GameState => ({ ...newGame({ seed: 1 }), ...over });

describe("deck and deal", () => {
  it("deals 13 unique cards to each of 4 seats", () => {
    const s = newGame({ seed: 42 });
    expect(s.hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    expect(new Set(s.hands.flat()).size).toBe(52);
  });
  it("is replayable from a seed", () => {
    expect(newGame({ seed: 7 }).hands).toEqual(newGame({ seed: 7 }).hands);
    expect(newGame({ seed: 7 }).hands).not.toEqual(newGame({ seed: 8 }).hands);
  });
  it("scores 26 points in a deck", () => expect(fullDeck().reduce((a, c) => a + points(c), 0)).toBe(26));
});

describe("passing", () => {
  it("cycles left, right, across, hold", () => {
    let s = newGame({ seed: 3 });
    const dirs = [s.passDirection];
    for (let i = 0; i < 3; i++) {
      s = { ...s, phase: "roundOver" };
      s = (({ ...s, ...require_next(s) }));
      dirs.push(s.passDirection);
    }
    expect(dirs).toEqual(["left", "right", "across", "none"]);
    expect(s.phase).toBe("playing");
  });
  it("moves cards to the right seat and starts play with the 2 of clubs holder", () => {
    let s = newGame({ seed: 5 });
    const picks = s.hands.map((h) => h.filter((c) => c !== "2C").slice(0, 3));
    for (const i of [0, 1, 2, 3] as Seat[]) s = choosePass(s, i, picks[i]);
    expect(s.phase).toBe("playing");
    expect(s.hands[passTarget(0, "left")]).toEqual(expect.arrayContaining(picks[0]));
    expect(s.hands[s.turn]).toContain("2C");
  });
  it("rejects bad passes", () => {
    const s = newGame({ seed: 5 });
    expect(() => choosePass(s, 0, s.hands[0].slice(0, 2))).toThrow(RuleError);
    expect(() => choosePass(s, 0, s.hands[1].slice(0, 3))).toThrow(RuleError);
  });
});

function require_next(s: GameState) {
  // local import to keep the test readable
  return (require_nextRound as (s: GameState) => GameState)(s);
}
import { nextRound as require_nextRound } from "../src";

describe("play rules", () => {
  const hands = [
    sortHand(["2C", "5C", "KH", "QS", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "JD"]),
    sortHand(["3C", "AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH"]),
    sortHand(["4C", "6C", "7C", "8C", "9C", "10C", "JC", "QC", "KC", "AC", "2S", "3S", "4S"]),
    sortHand(["5S", "6S", "7S", "8S", "9S", "10S", "JS", "KS", "AS", "2D", "QD", "KD", "AD"]),
  ];
  const s0 = state({ phase: "playing", hands, turn: 0, leader: 0, tricksPlayed: 0, trick: [] });

  it("must lead the 2 of clubs", () => {
    expect(whyIllegal(s0, 0, "5C")).toMatch(/2 of clubs/);
    expect(legalCards(s0, 0)).toEqual(["2C"]);
  });
  it("must follow suit", () => {
    const s = playCard(s0, 0, "2C");
    expect(legalCards(s, 1)).toEqual(["3C"]);
  });
  it("no points on the first trick, unless only points remain", () => {
    let s = playCard(s0, 0, "2C");
    s = playCard(s, 1, "3C");
    s = playCard(s, 2, "4C");
    // seat 3 is void in clubs: may not play QS... it has no QS; may not play hearts (none). Any diamond/spade OK.
    expect(legalCards(s, 3).length).toBe(13);
    const onlyPoints = state({ phase: "playing", hands: [["2C"], ["QS", "AH"], ["3C"], ["4C"]], turn: 0, leader: 0 });
    const t = playCard(onlyPoints, 0, "2C");
    expect(legalCards(t, 1).sort()).toEqual(["AH", "QS"]);
  });
  it("hearts can't be led until broken", () => {
    const s = state({ phase: "playing", hands: [["KH", "3D"], [], [], []], turn: 0, leader: 0, tricksPlayed: 3 });
    expect(whyIllegal(s, 0, "KH")).toMatch(/aren't broken/);
    expect(whyIllegal({ ...s, heartsBroken: true }, 0, "KH")).toBeNull();
    expect(whyIllegal({ ...s, hands: [["KH"], [], [], []] }, 0, "KH")).toBeNull();
  });
  it("highest card of the led suit wins", () => {
    expect(trickWinner([{ seat: 1, card: "5D" }, { seat: 2, card: "AS" }, { seat: 3, card: "9D" }, { seat: 0, card: "2D" }])).toBe(3);
  });
});

describe("scoring", () => {
  it("shooting the moon gives everyone else 26", () => {
    const s = state({ phase: "playing", tricksPlayed: 12, turn: 0, leader: 0, heartsBroken: true,
      hands: [["AH"], ["2C"], ["3C"], ["4C"]], taken: [["QS", ...["2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH"]], [], [], []] });
    const t = playCard(playCard(playCard(playCard(s, 0, "AH"), 1, "2C"), 2, "3C"), 3, "4C");
    expect(t.history.at(-1)).toEqual([0, 26, 26, 26]);
    expect(t.moon).toBe(0);
  });
  it("ends at the target with the lowest score winning", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const s = simulate(seed, 100);
      expect(s.phase).toBe("gameOver");
      expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(100);
      expect(s.history.every((r) => r.reduce((a, b) => a + b, 0) === 26 || r.reduce((a, b) => a + b, 0) === 78)).toBe(true);
    }
  });
});

describe("bots and views", () => {
  it("bots always choose a legal card across many games", () => {
    for (let seed = 100; seed < 160; seed++) expect(simulate(seed, 50).phase).toBe("gameOver");
  });
  it("bot dumps the Queen of spades when void", () => {
    const s = state({ phase: "playing", tricksPlayed: 4, turn: 1, leader: 0, trick: [{ seat: 0, card: "5D" }], hands: [[], ["QS", "2H", "3C"], [], []] });
    expect(botPlay(s, 1)).toBe("QS");
  });
  it("views hide other hands", () => {
    const v = viewFor(newGame({ seed: 9 }), 2);
    expect(v.hand.length).toBe(13);
    expect(JSON.stringify(v)).not.toContain(JSON.stringify(newGame({ seed: 9 }).hands[0]));
    expect(v.handCounts).toEqual([13, 13, 13, 13]);
  });
});
