import { For } from "solid-js";
import { cn } from "../lib/cn";

/** Cumulative score table. Lowest total = leader (Hearts). */
export function ScoreTable(props: { players: string[]; rounds: number[][]; limit?: number }) {
  const totals = () => props.players.map((_, p) => props.rounds.reduce((a, r) => a + (r[p] ?? 0), 0));
  const best = () => Math.min(...totals());
  return (
    <div class="overflow-hidden rounded-lg bg-surface shadow-sm">
      <table class="w-full text-center tabular-nums">
        <caption class="sr-only">Scores by round</caption>
        <thead>
          <tr class="text-[0.75rem] uppercase tracking-wide text-muted">
            <th scope="col" class="py-2 pl-3 text-left font-medium">Rd</th>
            <For each={props.players}>{(p) => <th scope="col" class="truncate px-1 py-2 font-medium">{p}</th>}</For>
          </tr>
        </thead>
        <tbody class="text-[0.9375rem]">
          <For each={props.rounds}>
            {(r, i) => (
              <tr class="border-t border-separator">
                <th scope="row" class="py-2 pl-3 text-left font-normal text-muted">{i() + 1}</th>
                <For each={r}>{(s) => <td class={cn("py-2", s === 26 && "text-danger-ink font-semibold", s === 0 && "text-muted")}>{s}</td>}</For>
              </tr>
            )}
          </For>
          <tr class="border-t-2 border-separator bg-sunken/60 font-bold">
            <th scope="row" class="py-2.5 pl-3 text-left">Total</th>
            <For each={totals()}>
              {(t) => (
                <td class={cn("py-2.5", t === best() && "text-success-ink", t >= (props.limit ?? 100) && "text-danger-ink")}>
                  {t}
                  {t === best() ? " 👑" : ""}
                </td>
              )}
            </For>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
