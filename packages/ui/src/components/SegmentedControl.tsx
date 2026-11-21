import { For } from "solid-js";
import { cn } from "../lib/cn";

export function SegmentedControl<T extends string>(props: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange?: (v: T) => void;
  class?: string;
}) {
  const index = () => Math.max(0, props.options.findIndex((o) => o.value === props.value));
  return (
    <div data-slot="segmented" role="radiogroup" aria-label={props.label} class={cn("no-select relative grid h-9 rounded-sm bg-sunken p-0.5", props.class)} style={{ "grid-template-columns": `repeat(${props.options.length}, 1fr)` }}>
      <span
        data-slot="segmented-thumb"
        aria-hidden="true"
        class="absolute top-0.5 bottom-0.5 rounded-[calc(var(--t-radius-sm)-2px)] bg-surface shadow-sm transition-transform duration-300 ease-theme"
        style={{ width: `calc((100% - 4px) / ${props.options.length})`, transform: `translateX(${index() * 100}%)`, left: "2px" }}
      />
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            role="radio"
            aria-checked={o.value === props.value}
            class={cn("relative z-10 text-[0.8125rem] font-semibold text-muted outline-none focus-visible:underline", o.value === props.value && "text-fg")}
            onClick={() => props.onChange?.(o.value)}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  );
}
