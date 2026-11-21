import { type JSX, Show, splitProps } from "solid-js";
import { cn } from "../lib/cn";
import { type Card, cardLabel, isRed, SUIT_SYMBOL } from "./cards";

export type PlayingCardProps = {
  card?: Card;
  faceDown?: boolean;
  width?: number;
  selected?: boolean;
  disabled?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
};

/** Theme-aware vector playing card. Width drives all dimensions (5:7 ratio). */
export function PlayingCard(props: PlayingCardProps) {
  const [local] = splitProps(props, ["card", "faceDown", "width", "selected", "disabled", "class", "style"]);
  const w = () => local.width ?? 64;
  const color = () => (local.card && isRed(local.card.suit) ? "var(--suit-red)" : "var(--suit-black)");
  return (
    <div
      role="img"
      aria-label={local.faceDown || !local.card ? "Face-down card" : cardLabel(local.card)}
      class={cn(
        "no-select relative shrink-0 overflow-hidden transition-[transform,filter,opacity] duration-300 ease-theme",
        local.selected && "-translate-y-4",
        local.disabled && "brightness-[0.82] saturate-50",
        local.class,
      )}
      style={{
        width: `${w()}px`,
        height: `${w() * 1.4}px`,
        "border-radius": `calc(var(--t-radius-card) * ${w() / 64})`,
        "box-shadow": local.selected ? "0 0 0 2.5px var(--accent), var(--t-shadow-card)" : "var(--t-shadow-card)",
        background: local.faceDown ? "var(--card-back)" : "var(--card-face)",
        ...local.style,
      }}
    >
      <Show
        when={!local.faceDown && local.card}
        fallback={
          <div
            class="absolute inset-[6%] rounded-[inherit]"
            style={{
              border: "1.5px solid var(--card-back-pattern)",
              "background-image": "radial-gradient(var(--card-back-pattern) 1.2px, transparent 1.6px)",
              "background-size": `${w() / 6}px ${w() / 6}px`,
            }}
          />
        }
      >
        {(c) => (
          <div aria-hidden="true" class="absolute inset-0" style={{ color: color() }}>
            <div class="absolute flex flex-col items-center leading-none" style={{ top: `${w() * 0.07}px`, left: `${w() * 0.08}px` }}>
              <span class="font-bold tracking-tighter" style={{ "font-size": `${w() * 0.26}px` }}>{c().rank}</span>
              <span style={{ "font-size": `${w() * 0.22}px` }}>{SUIT_SYMBOL[c().suit]}</span>
            </div>
            <div class="absolute inset-0 grid place-items-center" style={{ "font-size": `${w() * 0.55}px`, "padding-top": `${w() * 0.18}px`, "padding-left": `${w() * 0.12}px` }}>
              {SUIT_SYMBOL[c().suit]}
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
