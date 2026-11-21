import { For } from "solid-js";
import { cn } from "../lib/cn";

/** Floating glass tab bar (iOS 26+ style) */
export function TabBar(props: { items: { id: string; label: string; icon: string }[]; active: string; onChange?: (id: string) => void }) {
  return (
    <nav data-slot="tabbar-wrap" aria-label="Main" class="safe-bottom no-select pointer-events-none sticky bottom-0 z-20 flex justify-center px-6">
      <div data-slot="tabbar" class="glass pointer-events-auto flex gap-1 rounded-full p-1.5 shadow-lg">
        <For each={props.items}>
          {(it) => (
            <button
              type="button"
              data-xp-off
              aria-current={it.id === props.active ? "page" : undefined}
              onClick={() => props.onChange?.(it.id)}
              class={cn("press flex min-w-[72px] flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[0.625rem] font-semibold text-muted", it.id === props.active && "bg-accent-soft text-accent-ink")}
            >
              <span aria-hidden="true" class="text-xl leading-none">{it.icon}</span>
              {it.label}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}
