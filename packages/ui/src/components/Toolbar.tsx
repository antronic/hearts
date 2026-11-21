import { For, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export type ToolbarItem = { divider: true } | { label: string; icon?: JSX.Element; pressed?: boolean; disabled?: boolean; onClick?: () => void; showLabel?: boolean };

/** Flat toolbar ([role=toolbar]) like Explorer's. Roving focus with ←/→. */
export function Toolbar(props: { label: string; items: ToolbarItem[]; class?: string }) {
  let el!: HTMLDivElement;
  return (
    <div
      ref={el}
      role="toolbar"
      aria-label={props.label}
      class={cn("no-select flex items-center gap-1 overflow-x-auto rounded-md bg-sunken p-1", props.class)}
      onKeyDown={(e) => {
        const bs = [...el.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const i = bs.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "ArrowRight") (e.preventDefault(), bs[(i + 1) % bs.length]?.focus());
        if (e.key === "ArrowLeft") (e.preventDefault(), bs[(i - 1 + bs.length) % bs.length]?.focus());
      }}
    >
      <For each={props.items}>
        {(it, i) =>
          "divider" in it ? (
            <span class="divider mx-1 h-6 w-px self-center bg-separator" />
          ) : (
            <button
              type="button"
              tabindex={i() === 0 ? 0 : -1}
              aria-label={it.showLabel === false ? it.label : undefined}
              aria-pressed={it.pressed === undefined ? undefined : it.pressed}
              disabled={it.disabled}
              onClick={it.onClick}
              class={cn("press flex h-10 shrink-0 items-center gap-1.5 rounded-sm px-3 text-[0.875rem] font-medium text-fg disabled:opacity-40", it.pressed && "bg-surface shadow-sm")}
            >
              {it.icon}
              {it.showLabel === false ? null : it.label}
            </button>
          )
        }
      </For>
    </div>
  );
}
