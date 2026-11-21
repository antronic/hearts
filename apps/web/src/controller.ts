import type { PlayerView } from "@hearts/engine";
import type { Accessor } from "solid-js";

/** What the game screen needs, whether the game runs on this device (solo) or in an online room. */
export type GameController = {
  kind: "solo" | "online";
  view: Accessor<PlayerView | null>;
  names: Accessor<string[]>;
  bots: Accessor<boolean[]>;
  offline: Accessor<boolean[]>;
  error: Accessor<string | null>;
  clearError: () => void;
  pass: (cards: string[]) => void;
  play: (card: string) => void;
  nextRound: () => void;
  newGame: () => void;
  leave: () => void;
};
