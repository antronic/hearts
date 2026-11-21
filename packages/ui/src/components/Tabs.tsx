import { createSignal, For, type JSX } from "solid-js";
import { cn } from "../lib/cn";

/** Tabs (XP.css markup: menu[role=tablist] + [role=tabpanel]). ←/→ switch tabs. */
export function Tabs(props: { label: string; tabs: { id: string; label: string; content: JSX.Element }[]; class?: string }) {
  const [active, setActive] = createSignal(props.tabs[0].id);
  let list!: HTMLMenuElement;
  const idx = () => props.tabs.findIndex((t) => t.id === active());
  const go = (d: number) => {
    const t = props.tabs[(idx() + d + props.tabs.length) % props.tabs.length];
    setActive(t.id);
    list.querySelector<HTMLButtonElement>(`#tab-${t.id}`)?.focus();
  };
  return (
    <div class={cn("flex flex-col", props.class)}>
      <menu ref={list} role="tablist" aria-label={props.label} class="no-select m-0 flex gap-1 p-0" onKeyDown={(e) => (e.key === "ArrowRight" ? go(1) : e.key === "ArrowLeft" ? go(-1) : null)}>
        <For each={props.tabs}>
          {(t) => (
            <button
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === active()}
              aria-controls={`panel-${t.id}`}
              tabindex={t.id === active() ? 0 : -1}
              onClick={() => setActive(t.id)}
              class={cn("rounded-t-md px-4 py-2 text-[0.9375rem] font-semibold text-muted", t.id === active() && "bg-surface text-fg shadow-sm")}
            >
              {t.label}
            </button>
          )}
        </For>
      </menu>
      <For each={props.tabs}>
        {(t) => (
          <div role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active()} class="window-body rounded-b-md rounded-tr-md bg-surface p-4 shadow-sm">
            {t.content}
          </div>
        )}
      </For>
    </div>
  );
}
