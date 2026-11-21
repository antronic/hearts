import { Show } from "solid-js";
import { Avatar } from "../components/Avatar";
import { cn } from "../lib/cn";
import { PlayingCard } from "./PlayingCard";

export type PlayerSeatProps = {
  name: string;
  cards?: number;
  points?: number;
  active?: boolean;
  bot?: boolean;
  offline?: boolean;
  layout?: "column" | "row";
};

/** Opponent seat: avatar with turn ring, name, penalty points and hand size. */
export function PlayerSeat(props: PlayerSeatProps) {
  return (
    <div
      aria-label={`${props.name}${props.active ? ", playing now" : ""}, ${props.points ?? 0} points, ${props.cards ?? 0} cards`}
      class={cn("no-select flex items-center gap-2", props.layout === "row" ? "flex-row" : "flex-col")}
    >
      <div class={cn("relative", props.offline && "opacity-40")}>
        <Avatar name={props.name} size={44} ring={props.active} />
        <Show when={props.cards !== undefined}>
          <div class="absolute -right-3 -bottom-1 flex" aria-hidden="true">
            <PlayingCard faceDown width={18} class="rotate-[-8deg]" />
            <PlayingCard faceDown width={18} class="-ml-3 rotate-[6deg]" />
          </div>
        </Show>
      </div>
      <div class={cn("flex flex-col", props.layout === "row" ? "items-start" : "items-center")}>
        <span class="glass max-w-[96px] truncate rounded-full px-2 py-0.5 text-[0.75em] font-semibold text-fg">
          {props.bot ? "🤖 " : ""}
          {props.name}
        </span>
        <span class="mt-0.5 text-[0.6875em] font-semibold text-on-table tabular-nums">
          {props.offline ? "Reconnecting…" : `♥ ${props.points ?? 0} · ${props.cards ?? 0} cards`}
        </span>
      </div>
    </div>
  );
}
