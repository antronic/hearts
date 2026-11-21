import { createSignal } from "solid-js";
import { Button } from "../components";
import { type Card, cardKey, sampleHand } from "../game";
import { GameTableScreen } from "./GameTableScreen";

/** Card passing phase: choose 3 cards to pass left/right/across. */
export function PassingScreen(props: { direction?: "left" | "right" | "across"; preselected?: Card[] }) {
  const [sel, setSel] = createSignal<Card[]>(props.preselected ?? []);
  const toggle = (c: Card) => {
    const has = sel().some((s) => cardKey(s) === cardKey(c));
    if (has) setSel(sel().filter((s) => cardKey(s) !== cardKey(c)));
    else if (sel().length < 3) setSel([...sel(), c]);
  };
  const dir = () => props.direction ?? "left";
  const arrow = { left: "←", right: "→", across: "↑" };
  return (
    <GameTableScreen
      hand={sampleHand}
      trick={{}}
      turn="south"
      mode="pass"
      selected={sel()}
      onToggle={toggle}
      banner={
        <div class="glass animate-rise mx-4 mt-2 rounded-lg px-4 py-3 text-center shadow-md">
          <p class="font-display text-[1.25em]">
            Pass 3 cards {dir()} {arrow[dir()]}
          </p>
          <p class="text-[0.8125em] text-muted">Tap cards to select · {sel().length}/3 chosen</p>
        </div>
      }
      footer={
        <Button size="lg" disabled={sel().length !== 3}>
          Pass {sel().length === 3 ? "cards" : `(${sel().length}/3)`}
        </Button>
      }
    />
  );
}
