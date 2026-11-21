import { For, Show } from "solid-js";
import { Avatar, Badge, Button, ListGroup, ListItem, NavBar, TabBar } from "../components";
import { PlayingCard } from "../game";

export type RoomSummary = { id: string; name: string; players: number; locked?: boolean; host: string };

export const sampleRooms: RoomSummary[] = [
  { id: "1", name: "Friday night", players: 3, host: "Mint" },
  { id: "2", name: "Office lunch", players: 1, locked: true, host: "Ploy" },
  { id: "3", name: "Shoot the moon", players: 2, host: "Tan" },
];

export function LobbyScreen(props: {
  rooms?: RoomSummary[];
  offline?: boolean;
  name?: string;
  loading?: boolean;
  resume?: { label: string; onResume: () => void };
  onCreate?: () => void;
  onJoin?: (r: RoomSummary) => void;
  onJoinCode?: () => void;
  onSolo?: () => void;
  onTab?: (id: string) => void;
}) {
  const rooms = () => props.rooms ?? sampleRooms;
  return (
    <>
      <div class="flex-1 overflow-y-auto pb-4">
        <NavBar title="Hearts" large trailing={<Avatar name={props.name || "You"} size={34} />}  />
        <div class="flex flex-col gap-6 px-4">
          <Show when={props.offline}>
            <div role="status" class="glass flex items-center gap-2 rounded-md px-3 py-2 text-[0.8125rem]">
              <span aria-hidden="true">📴</span> You're offline. Solo games against bots still work.
            </div>
          </Show>
          <Show when={props.resume}>
            {(r) => (
              <button type="button" data-xp-off onClick={r().onResume} class="glass no-select flex min-h-[52px] items-center justify-between rounded-lg px-4 py-3 text-left shadow-sm">
                <span>
                  <span class="block text-[0.8125rem] text-muted">Game in progress</span>
                  <span class="block text-[1.0625rem] font-semibold">{r().label}</span>
                </span>
                <span class="text-accent-ink font-semibold">Resume ›</span>
              </button>
            )}
          </Show>
          <div class="relative overflow-hidden rounded-xl p-5 text-white shadow-md" style={{ background: "var(--table)" }}>
            <div aria-hidden="true" class="absolute -right-4 -bottom-6 flex rotate-[-12deg]">
              <PlayingCard card={{ rank: "Q", suit: "S" }} width={58} class="rotate-[-10deg]" />
              <PlayingCard card={{ rank: "A", suit: "H" }} width={58} class="-ml-6 rotate-[4deg]" />
              <PlayingCard card={{ rank: "2", suit: "C" }} width={58} class="-ml-6 rotate-[16deg]" />
            </div>
            <p class="text-[0.8125rem] font-semibold uppercase tracking-wide opacity-80">Quick play</p>
            <h2 class="font-display mt-1 max-w-[60%] text-[1.625rem] leading-tight">Play against bots</h2>
            <p class="mt-1 max-w-[55%] text-[0.875rem] opacity-85">Works offline. Jump straight in.</p>
            <Button variant="glass" class="mt-4" onClick={props.onSolo}>Start game</Button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <Button variant="primary" size="lg" disabled={props.offline} onClick={props.onCreate}>＋ Create room</Button>
            <Button variant="secondary" size="lg" disabled={props.offline} onClick={props.onJoinCode}>Join by code</Button>
          </div>
          <ListGroup header="Open rooms" footer={props.offline ? "Rooms are unavailable while offline." : "Rooms refresh automatically."}>
            <Show when={!props.offline && rooms().length} fallback={<ListItem title={props.loading ? "Looking for rooms…" : "No open rooms right now"} subtitle={props.loading ? undefined : "Create one and invite friends"} />}>
              <For each={rooms()}>
                {(r) => (
                  <ListItem
                    title={r.name}
                    subtitle={`Hosted by ${r.host}`}
                    leading={<Avatar name={r.host} size={36} />}
                    trailing={
                      <span class="flex items-center gap-1.5">
                        <Show when={r.locked}>
                          <span aria-label="Password protected">🔒</span>
                        </Show>
                        <Badge tone={r.players === 3 ? "soft" : "neutral"}>{r.players}/4</Badge>
                      </span>
                    }
                    chevron
                    onClick={() => props.onJoin?.(r)}
                  />
                )}
              </For>
            </Show>
          </ListGroup>
        </div>
      </div>
      <TabBar
        active="play"
        onChange={(id) => props.onTab?.(id)}
        items={[
          { id: "play", label: "Play", icon: "♠" },
          { id: "settings", label: "Settings", icon: "⚙" },
        ]}
      />
    </>
  );
}
