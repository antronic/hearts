import { Show } from "solid-js";
import { cn } from "../lib/cn";
import type { Card } from "./cards";
import { PlayingCard } from "./PlayingCard";

export type Seat = "south" | "west" | "north" | "east";

const pos: Record<Seat, string> = {
  north: "left-1/2 top-0 -translate-x-1/2 rotate-[-4deg]",
  south: "left-1/2 bottom-0 -translate-x-1/2 rotate-[3deg]",
  west: "left-0 top-1/2 -translate-y-1/2 rotate-[-10deg]",
  east: "right-0 top-1/2 -translate-y-1/2 rotate-[9deg]",
};

/** The four played cards of the current trick, plus a drop-zone highlight while dragging. */
export function TrickArea(props: { cards: Partial<Record<Seat, Card>>; winner?: Seat; dropActive?: boolean; dropHover?: boolean; cardWidth?: number }) {
  const w = () => props.cardWidth ?? 56;
  return (
    <div
      aria-label="Current trick"
      role="region"
      data-xp-off
      class={cn(
        "no-select relative mx-auto rounded-full transition-all duration-300",
        props.dropActive && "outline-2 outline-dashed outline-offset-4 outline-[color-mix(in_srgb,var(--table-fg)_50%,transparent)]",
        props.dropHover && "bg-white/15 outline-[var(--table-fg)] scale-105",
      )}
      style={{ width: `${w() * 3.1}px`, height: `${w() * 3.4}px` }}
    >
      {(["north", "west", "east", "south"] as Seat[]).map((s) => (
        <Show when={props.cards[s]}>
          {(c) => (
            <div data-trick-seat={s} class={cn("absolute animate-pop", pos[s], props.winner === s && "z-10")}>
              <PlayingCard card={c()} width={w()} class={cn(props.winner === s && "ring-2 ring-warning")} />
            </div>
          )}
        </Show>
      ))}
      <Show when={props.dropActive && !props.cards.south}>
        <span class="absolute inset-0 grid place-items-center text-center text-[0.8125em] font-semibold text-on-table/80">Drop to play</span>
      </Show>
    </div>
  );
}
