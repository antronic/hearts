import { For, Show } from "solid-js";
import { Sheet } from "../components/Sheet";
import { cn } from "../lib/cn";
import { type Card, cardKey, cardLabel, isRed, SUIT_NAME, SUIT_SYMBOL, type Suit } from "./cards";

/**
 * Accessible equivalent of the fanned hand: every card as a full-width 44pt+ row, grouped by suit.
 * Use it for one-handed play, motor impairments, large text, or screen readers.
 * Fanned cards are narrower than 44pt, so this is the WCAG 2.5.8 "equivalent control".
 */
export function CardPickerSheet(props: {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  cards: Card[];
  mode?: "play" | "pass";
  playable?: (c: Card) => boolean;
  selected?: Card[];
  onPick?: (c: Card) => void;
  mount?: HTMLElement;
}) {
  const suits: Suit[] = ["C", "D", "S", "H"];
  const ok = (c: Card) => props.mode === "pass" || (props.playable ? props.playable(c) : true);
  const sel = (c: Card) => props.selected?.some((s) => cardKey(s) === cardKey(c)) ?? false;
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
      title={props.mode === "pass" ? "Choose cards to pass" : "Choose a card"}
      description={props.mode === "pass" ? "Tap three cards." : "Cards you can't play now are dimmed."}
    >
      <div class="-mx-1 flex max-h-[55dvh] flex-col gap-3 overflow-y-auto px-1 pb-1">
        <For each={suits}>
          {(s) => (
            <Show when={props.cards.some((c) => c.suit === s)}>
              <section aria-label={SUIT_NAME[s]}>
                <h3 class="mb-1 px-1 text-[0.8125rem] font-medium text-muted" aria-hidden="true">
                  {SUIT_SYMBOL[s]} {SUIT_NAME[s]}
                </h3>
                <div data-slot="list" class="overflow-hidden rounded-lg bg-surface [&>*+*]:border-t [&>*+*]:border-separator">
                  <For each={props.cards.filter((c) => c.suit === s)}>
                    {(c) => (
                      <button
                        type="button"
                        data-xp-off
                        aria-pressed={props.mode === "pass" ? sel(c) : undefined}
                        aria-disabled={!ok(c)}
                        onClick={() => ok(c) && props.onPick?.(c)}
                        class={cn(
                          "no-select flex min-h-12 w-full items-center gap-3 px-4 text-left text-[1.0625rem] transition-colors active:bg-sunken",
                          !ok(c) && "opacity-45",
                        )}
                      >
                        <span aria-hidden="true" class={cn("w-10 font-display text-[1.25rem] tabular-nums", isRed(c.suit) ? "text-danger-ink" : "")}>
                          {c.rank}
                          {SUIT_SYMBOL[c.suit]}
                        </span>
                        <span class="flex-1">{cardLabel(c)}</span>
                        <Show when={sel(c)}>
                          <span aria-hidden="true" class="text-accent-ink">✓</span>
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
              </section>
            </Show>
          )}
        </For>
      </div>
    </Sheet>
  );
}
