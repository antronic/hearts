import { createSignal, For } from "solid-js";
import { cn } from "../lib/cn";

/** List box ([role=listbox]). Single or multi-select; ↑/↓, Home/End, Space/Enter, Ctrl/Shift-click for multi. */
export function ListBox(props: { label: string; options: { value: string; label: string; disabled?: boolean }[]; multiple?: boolean; value?: string[]; onChange?: (v: string[]) => void; class?: string; height?: number }) {
  const [sel, setSel] = createSignal<string[]>(props.value ?? []);
  const [focus, setFocus] = createSignal(0);
  const toggle = (v: string, additive: boolean) => {
    const next = props.multiple && additive ? (sel().includes(v) ? sel().filter((x) => x !== v) : [...sel(), v]) : [v];
    setSel(next);
    props.onChange?.(next);
  };
  return (
    <ul
      role="listbox"
      tabindex="0"
      aria-label={props.label}
      aria-multiselectable={props.multiple}
      aria-activedescendant={`lb-${props.label}-${focus()}`}
      class={cn("no-select overflow-auto rounded-md bg-surface p-1 shadow-sm outline-none ring-1 ring-separator focus-visible:ring-2 focus-visible:ring-accent", props.class)}
      style={{ height: props.height ? `${props.height}px` : undefined }}
      onKeyDown={(e) => {
        const n = props.options.length;
        if (e.key === "ArrowDown") (e.preventDefault(), setFocus(Math.min(focus() + 1, n - 1)), !props.multiple && toggle(props.options[focus()].value, false));
        if (e.key === "ArrowUp") (e.preventDefault(), setFocus(Math.max(focus() - 1, 0)), !props.multiple && toggle(props.options[focus()].value, false));
        if (e.key === "Home") setFocus(0);
        if (e.key === "End") setFocus(n - 1);
        if (e.key === " " || e.key === "Enter") (e.preventDefault(), toggle(props.options[focus()].value, true));
      }}
    >
      <For each={props.options}>
        {(o, i) => (
          <li
            id={`lb-${props.label}-${i()}`}
            role="option"
            aria-selected={sel().includes(o.value)}
            aria-disabled={o.disabled}
            class={cn(
              "flex min-h-11 cursor-default items-center rounded-sm px-3 text-[0.9375rem]",
              sel().includes(o.value) && "bg-accent text-accent-fg",
              o.disabled && "opacity-40",
              i() === focus() && "outline-1 outline-dotted outline-offset-[-2px]",
            )}
            onClick={(e) => {
              if (o.disabled) return;
              setFocus(i());
              toggle(o.value, e.ctrlKey || e.metaKey || !!props.multiple);
            }}
          >
            {o.label}
          </li>
        )}
      </For>
    </ul>
  );
}
