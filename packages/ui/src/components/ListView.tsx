import { createMemo, createSignal, createUniqueId, For } from "solid-js";
import { cn } from "../lib/cn";

/** Details-view list (.list-view > table) with sortable headers and selectable rows. */
export function ListView<T extends Record<string, string | number>>(props: {
  label: string;
  columns: { key: keyof T & string; label: string; numeric?: boolean }[];
  rows: T[];
  height?: number;
  class?: string;
}) {
  const [sort, setSort] = createSignal<{ key: string; dir: 1 | -1 }>({ key: props.columns[0].key, dir: 1 });
  const [sel, setSel] = createSignal(0);
  const rows = createMemo(() =>
    [...props.rows].sort((a, b) => {
      const k = sort().key;
      return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * sort().dir;
    }),
  );
  const uid = createUniqueId();
  const toggleSort = (key: string) => setSort({ key, dir: sort().key === key ? (-sort().dir as 1 | -1) : 1 });
  return (
    <div
      class={cn("list-view no-select overflow-auto rounded-md bg-surface shadow-sm ring-1 ring-separator outline-none focus-visible:ring-2 focus-visible:ring-accent", props.class)}
      style={{ height: props.height ? `${props.height}px` : undefined }}
    >
      <table
        role="grid"
        tabindex="0"
        aria-label={props.label}
        aria-activedescendant={`${uid}-r${sel()}`}
        class="w-full text-left text-[0.875rem] tabular-nums outline-none"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowDown") (e.preventDefault(), setSel(Math.min(sel() + 1, rows().length - 1)));
          if (e.key === "ArrowUp") (e.preventDefault(), setSel(Math.max(sel() - 1, 0)));
        }}
      >
        <thead class="sticky top-0 bg-sunken">
          <tr>
            <For each={props.columns}>
              {(c) => (
                <th
                  scope="col"
                  tabindex="0"
                  aria-sort={sort().key === c.key ? (sort().dir === 1 ? "ascending" : "descending") : "none"}
                  class={cn("cursor-default px-3 py-2 font-medium text-muted", c.numeric && "text-right")}
                  onClick={() => toggleSort(c.key)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleSort(c.key))}
                >
                  {c.label}
                  <span class="xp-hide" aria-hidden="true">{sort().key === c.key ? (sort().dir === 1 ? " ▲" : " ▼") : ""}</span>
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={rows()}>
            {(r, i) => (
              <tr id={`${uid}-r${i()}`} aria-selected={i() === sel()} class={cn("border-t border-separator", i() === sel() && "bg-accent text-accent-fg")} onClick={() => setSel(i())}>
                <For each={props.columns}>{(c) => <td class={cn("px-3 py-2", c.numeric && "text-right")}>{r[c.key]}</td>}</For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
