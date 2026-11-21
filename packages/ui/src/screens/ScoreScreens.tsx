import { For, Show } from "solid-js";
import { Avatar, Button, Sheet } from "../components";
import { ScoreTable } from "../game";
import { cn } from "../lib/cn";

export const samplePlayers = ["You", "Tan", "Mint", "Bot Ace"];
export const sampleRounds = [
  [3, 10, 0, 13],
  [0, 26, 0, 0],
  [8, 0, 5, 13],
];

export function RoundScoreSheet(props: {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  mount?: HTMLElement;
  title?: string;
  description?: string;
  players?: string[];
  rounds?: number[][];
  limit?: number;
  action?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
      title={props.title ?? "Round 3 complete"}
      description={props.description ?? "Bot Ace took the Queen of Spades."}
      footer={
        <Show when={props.action !== ""}>
          <Button size="lg" disabled={props.actionDisabled} onClick={props.onAction}>{props.action ?? "Next round"}</Button>
        </Show>
      }
    >
      <ScoreTable players={props.players ?? samplePlayers} rounds={props.rounds ?? sampleRounds} limit={props.limit} />
    </Sheet>
  );
}

export function GameOverScreen(props: {
  players?: string[];
  totals?: number[];
  rounds?: number;
  youIndex?: number;
  onAgain?: () => void;
  onLobby?: () => void;
  againLabel?: string;
}) {
  const ranked = () => {
    const players = props.players ?? samplePlayers;
    const totals = props.totals ?? players.map((_, i) => [...sampleRounds, [12, 0, 88, 0]].reduce((a, r) => a + r[i], 0));
    return players.map((p, i) => ({ p, t: totals[i], i })).sort((a, b) => a.t - b.t);
  };
  const best = () => ranked()[0]?.t;
  const youWon = () => ranked().some((r) => r.i === (props.youIndex ?? 0) && r.t === best());
  const headline = () => (youWon() ? "You win!" : `${ranked().filter((r) => r.t === best()).map((r) => r.p).join(" & ")} wins`);
  return (
    <div class="flex flex-1 flex-col overflow-y-auto px-5">
      <div class="safe-top flex flex-col items-center pt-8 text-center">
        <span aria-hidden="true" class="animate-pop text-7xl">{youWon() ? "🏆" : "🃏"}</span>
        <h1 class="font-display mt-3 text-[2.125rem] leading-tight">{headline()}</h1>
        <p class="mt-1 text-[1.0625rem] text-muted">Lowest score after {props.rounds ?? 4} rounds</p>
      </div>
      <ol class="mt-8 flex flex-col gap-2">
        <For each={ranked()}>
          {(r, i) => (
            <li class={cn("animate-rise flex items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-sm", r.t === best() && "ring-2 ring-accent")} style={{ "animation-delay": `${i() * 80}ms` }}>
              <span class="w-6 text-center text-[1.0625rem] font-bold text-muted">{i() + 1}</span>
              <Avatar name={r.p} size={40} />
              <span class="flex-1 text-[1.0625rem] font-semibold">{r.p}</span>
              <span class={cn("text-[1.25rem] font-bold tabular-nums", r.t >= 100 && "text-danger-ink")}>{r.t}</span>
            </li>
          )}
        </For>
      </ol>
      <div class="safe-bottom mt-auto flex flex-col gap-2 pt-6">
        <Button size="lg" onClick={props.onAgain}>{props.againLabel ?? "Play again"}</Button>
        <Button size="lg" variant="secondary" onClick={props.onLobby}>Back to lobby</Button>
      </div>
    </div>
  );
}
