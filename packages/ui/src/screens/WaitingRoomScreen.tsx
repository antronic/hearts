import { For, Show } from "solid-js";
import { Avatar, Badge, Button, NavBar, Spinner } from "../components";
import { cn } from "../lib/cn";

export type Member = { name: string; ready: boolean; bot?: boolean; host?: boolean; you?: boolean; offline?: boolean };

export const sampleMembers: Member[] = [
  { name: "Job", ready: true, host: true, you: true },
  { name: "Mint", ready: true },
  { name: "Tan", ready: false },
];

export function WaitingRoomScreen(props: {
  roomName?: string;
  code?: string;
  /** Four entries (null = open seat). A shorter list is padded with open seats. */
  members?: (Member | null)[];
  youReady?: boolean;
  fillWithBots?: boolean;
  canManage?: boolean;
  copied?: boolean;
  onLeave?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onReady?: () => void;
  onAddBot?: (seat: number) => void;
  onRemoveBot?: (seat: number) => void;
}) {
  const members = () => props.members ?? sampleMembers;
  const seats = () => [0, 1, 2, 3].map((i) => members()[i] ?? null);
  return (
    <div class="flex flex-1 flex-col overflow-y-auto">
      <NavBar
        title={props.roomName ?? "Friday night"}
        leading={<Button variant="ghost" size="sm" onClick={props.onLeave}>‹ Leave</Button>}
        trailing={<Button variant="ghost" size="sm" onClick={props.onShare}>Share</Button>}
      />
      <div class="flex flex-1 flex-col gap-6 px-4 pt-2">
        <div class="glass flex items-center justify-between rounded-lg px-4 py-3 shadow-sm">
          <div>
            <p class="text-[0.8125rem] text-muted">Room code</p>
            <p class="font-display text-[1.75rem] tracking-[0.2em] select-all">{props.code ?? "HX7Q"}</p>
          </div>
          <Button variant="tinted" size="sm" onClick={props.onCopy}>{props.copied ? "Copied ✓" : "Copy link"}</Button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <For each={seats()}>
            {(m, i) => (
              <div class={cn("flex flex-col items-center gap-2 rounded-lg p-4 text-center", m ? "bg-surface shadow-sm" : "border-2 border-dashed border-separator")}>
                <Show
                  when={m}
                  fallback={
                    <>
                      <span aria-hidden="true" class="grid h-14 w-14 place-items-center rounded-full bg-sunken text-2xl text-muted">＋</span>
                      <span class="text-[0.9375rem] text-muted">Seat {i() + 1} open</span>
                      <Show when={props.canManage ?? true}>
                        <Button variant="secondary" size="sm" onClick={() => props.onAddBot?.(i())}>🤖 Add bot</Button>
                      </Show>
                    </>
                  }
                >
                  {(mm) => (
                    <>
                      <Avatar name={mm().name} size={56} />
                      <span class="text-[1.0625rem] font-semibold">
                        {mm().bot ? "🤖 " : ""}
                        {mm().name}
                        {mm().you ? " (you)" : ""}
                        {mm().host ? " 👑" : ""}
                      </span>
                      <Show
                        when={!mm().bot}
                        fallback={
                          <Show when={props.canManage ?? true} fallback={<Badge tone="success">✓ Ready</Badge>}>
                            <Button variant="ghost" size="sm" onClick={() => props.onRemoveBot?.(i())}>Remove</Button>
                          </Show>
                        }
                      >
                        <Badge tone={mm().offline ? "neutral" : mm().ready ? "success" : "neutral"}>
                          {mm().offline ? "Offline" : mm().ready ? "✓ Ready" : <><Spinner size={10} label="Waiting" /> Not ready</>}
                        </Badge>
                      </Show>
                    </>
                  )}
                </Show>
              </div>
            )}
          </For>
        </div>
        <p class="text-center text-[0.9375rem] text-muted">
          {props.fillWithBots === false
            ? "The game starts when all 4 seats are filled and everyone is ready."
            : "The game starts when everyone here is ready. Bots fill any open seats."}
        </p>
      </div>
      <div class="safe-bottom px-4 pt-3">
        <Button size="lg" variant={props.youReady ? "secondary" : "primary"} onClick={props.onReady}>{props.youReady ? "Not ready" : "I'm ready"}</Button>
      </div>
    </div>
  );
}
