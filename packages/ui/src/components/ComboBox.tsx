import { createMemo, createSignal, createUniqueId, For, Show } from "solid-js";
import { cn } from "../lib/cn";
import { onOutsidePointer } from "../lib/xp";

/**
 * Editable combo box (.combobox from XP.css: input + button + [role=listbox]).
 * XP: the list slides open under the box; ↑/↓ move, Enter picks, Esc closes, typing filters.
 */
export function ComboBox(props: { label: string; options: string[]; value?: string; onChange?: (v: string) => void; placeholder?: string; class?: string }) {
  const id = createUniqueId();
  const [value, setValue] = createSignal(props.value ?? "");
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(0);
  const [typed, setTyped] = createSignal(false);
  let root!: HTMLDivElement;
  onOutsidePointer(() => [root], () => setOpen(false));
  const shown = createMemo(() => (typed() ? props.options.filter((o) => o.toLowerCase().includes(value().toLowerCase())) : props.options));
  const pick = (v: string) => {
    setValue(v);
    setTyped(false);
    setOpen(false);
    props.onChange?.(v);
  };
  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      <label for={id} data-slot="field-label" class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">
        {props.label}
      </label>
      <div ref={root} class="combobox relative flex">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open()}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open() ? `${id}-o${active()}` : undefined}
          placeholder={props.placeholder}
          value={value()}
          class="h-12 w-full rounded-l-md bg-surface px-4 text-[1.0625rem] text-fg shadow-sm outline-none ring-1 ring-separator focus:ring-2 focus:ring-accent"
          onInput={(e) => {
            setValue(e.currentTarget.value);
            setTyped(true);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), open() ? setActive(Math.min(active() + 1, shown().length - 1)) : setOpen(true));
            else if (e.key === "ArrowUp") (e.preventDefault(), setActive(Math.max(active() - 1, 0)));
            else if (e.key === "Enter" && open() && shown()[active()]) (e.preventDefault(), pick(shown()[active()]));
            else if (e.key === "Escape") setOpen(false);
          }}
        />
        <button
          type="button"
          aria-label="Open"
          tabindex="-1"
          aria-expanded={open()}
          class="grid h-12 w-12 place-items-center rounded-r-md bg-sunken text-muted ring-1 ring-separator"
          onClick={() => {
            setTyped(false);
            setOpen(!open());
          }}
        >
          <span class="xp-hide" aria-hidden="true">⌄</span>
        </button>
        <Show when={open() && shown().length}>
          <ul id={`${id}-list`} role="listbox" class="is-popup is-open glass-strong absolute top-[calc(100%+4px)] right-0 left-0 z-50 max-h-60 overflow-auto rounded-md p-1 shadow-lg">
            <For each={shown()}>
              {(o, i) => (
                <li
                  id={`${id}-o${i()}`}
                  role="option"
                  aria-selected={o === value()}
                  class={cn("flex min-h-11 cursor-default items-center rounded-sm px-3 text-[0.9375rem]", i() === active() && "highlighted bg-accent-soft")}
                  onPointerEnter={() => setActive(i())}
                  onClick={() => pick(o)}
                >
                  {o}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}

/** Native select: XP.css draws the XP box (and the XP open list in Chrome/Edge 135+). Phones use the system picker. */
export function Select(props: { label: string; options: string[]; value?: string; onChange?: (v: string) => void; disabled?: boolean }) {
  const id = createUniqueId();
  return (
    <div class="flex flex-col gap-1.5">
      <label for={id} data-slot="field-label" class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">
        {props.label}
      </label>
      <select
        id={id}
        disabled={props.disabled}
        class="h-12 w-full appearance-none rounded-md bg-surface px-4 text-[1.0625rem] text-fg shadow-sm outline-none ring-1 ring-separator focus:ring-2 focus:ring-accent"
        onChange={(e) => props.onChange?.(e.currentTarget.value)}
      >
        <For each={props.options}>{(o) => <option selected={o === props.value}>{o}</option>}</For>
      </select>
    </div>
  );
}
