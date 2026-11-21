import { createSignal, type JSX, Show } from "solid-js";
import { Button, DropdownMenu, type MenuEntry, Toast, Tooltip } from "../components";
import { type Card, CardPickerSheet, cardKey, Hand, parse, HeartBroken, PlayerSeat, type PlayerSeatProps, sampleHand, type Seat, TrickArea } from "../game";

export type GameTableProps = {
  hand?: Card[];
  trick?: Partial<Record<Seat, Card>>;
  turn?: Seat;
  heartsBroken?: boolean;
  showHeartBroken?: boolean;
  toast?: string;
  offlinePlayer?: Seat;
  playable?: (c: Card) => boolean;
  winner?: Seat;
  banner?: JSX.Element;
  mode?: "play" | "pass";
  selected?: Card[];
  onToggle?: (c: Card) => void;
  footer?: JSX.Element;
  /** Real-app data. Omit for the Storybook sample table. */
  players?: Partial<Record<Exclude<Seat, "south">, PlayerSeatProps>>;
  status?: string;
  /** Pill above your hand; null hides it. */
  hint?: string | null;
  youLabel?: string;
  menu?: MenuEntry[];
  onScores?: () => void;
  /** Controlled mode: when set, hand and trick come only from props and plays are reported here. */
  onPlay?: (c: Card) => void;
  /** Called when a dimmed card is tapped, so the app can explain why. */
  onToast?: (c?: Card) => void;
  twoTap?: boolean;
  /** Toast style: a warning (default) or plain information. */
  toastTone?: "danger" | "info";
};

const samplePlayers: Record<Exclude<Seat, "south">, PlayerSeatProps> = {
  north: { name: "Mint", cards: 8, points: 4 },
  west: { name: "Tan", cards: 9, points: 0 },
  east: { name: "Bot Ace", bot: true, cards: 9, points: 13 },
};

export const gameMenu: MenuEntry[] = [
  { label: "&New Game", shortcut: "F2" },
  { type: "separator" },
  { label: "&Score…", shortcut: "F4" },
  { label: "&Options…", submenu: [
    { label: "&Sound", type: "checkbox", checked: true },
    { label: "&Animations", type: "checkbox", checked: true },
    { type: "separator" },
    { label: "Play to &50", type: "radio" },
    { label: "Play to &100", type: "radio", checked: true },
  ] },
  { label: "&Undo", shortcut: "Ctrl+Z", disabled: true },
  { type: "separator" },
  { label: "&Leave Table" },
];

/** Main game table. Interactive in Storybook: drag a card up (or tap twice) to play it. */
export function GameTableScreen(props: GameTableProps) {
  const [hand, setHand] = createSignal(props.hand ?? sampleHand);
  const [trick, setTrick] = createSignal<Partial<Record<Seat, Card>>>(props.trick ?? { west: parse("9C"), north: parse("KC") });
  const [dragging, setDragging] = createSignal(false);
  const [over, setOver] = createSignal(false);
  const [localToast, setToast] = createSignal(props.toast);
  const toast = () => (props.onPlay ? props.toast : localToast());
  const ctl = () => !!props.onPlay;
  const cards = () => (ctl() ? (props.hand ?? []) : hand());
  const table = () => (ctl() ? (props.trick ?? {}) : trick());
  const seat = (s: Exclude<Seat, "south">): PlayerSeatProps => (props.players ?? samplePlayers)[s] ?? { name: "" };
  const canPlay = (c: Card) => (props.playable ?? ((x: Card) => x.suit === "C"))(c);
  const [picker, setPicker] = createSignal(false);
  let root!: HTMLDivElement;

  const play = (c: Card) => {
    if (props.onPlay) return props.onPlay(c);
    if (trick().south) return;
    setHand(hand().filter((h) => cardKey(h) !== cardKey(c)));
    setTrick({ ...trick(), south: c });
  };
  const turn = () => props.turn ?? "south";

  // The table is a fixed game surface: its text follows the system size up to ~115%, then caps so seats,
  // trick and hand never collide. Lists, sheets and menus (incl. "Card list") scale fully.
  return (
    <div ref={root} class="relative flex flex-1 flex-col overflow-hidden text-[min(1rem,18.5px)]" style={{ background: "var(--table)" }}>
      <div class="safe-top flex items-center justify-between px-4 pb-1">
        <DropdownMenu items={props.menu ?? gameMenu} trigger={(t) => <Button variant="glass" size="icon" aria-label="Game menu" class="text-[1.125em]" {...t}>☰</Button>} />
        <div class="glass rounded-full px-3 py-1.5 text-[0.8125em] font-semibold tabular-nums">{props.status ?? "Round 3 · Trick 5/13"}</div>
        <Tooltip text="Score (F4)" placement="bottom">
          {(t) => <Button variant="glass" size="icon" aria-label="Scores" class="text-[1.125em]" {...t} onClick={props.onScores}>🏆</Button>}
        </Tooltip>
      </div>

      <Show when={props.banner}>{props.banner}</Show>

      <div class="relative flex flex-1 flex-col items-center justify-center px-2">
        <div class="absolute top-2 left-1/2 -translate-x-1/2">
          <PlayerSeat {...seat("north")} active={turn() === "north"} offline={seat("north").offline || props.offlinePlayer === "north"} />
        </div>
        <div class="absolute top-1/2 left-2 -translate-y-1/2">
          <PlayerSeat {...seat("west")} active={turn() === "west"} offline={seat("west").offline || props.offlinePlayer === "west"} />
        </div>
        <div class="absolute top-1/2 right-2 -translate-y-1/2">
          <PlayerSeat {...seat("east")} active={turn() === "east"} offline={seat("east").offline || props.offlinePlayer === "east"} />
        </div>
        <TrickArea cards={table()} winner={props.winner} dropActive={dragging()} dropHover={over()} />
        <Show when={props.showHeartBroken}>
          <div class="absolute inset-0 grid place-items-center bg-black/10">
            <HeartBroken />
          </div>
        </Show>
        <div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <Show when={toast()}>
            <Toast message={toast()!} icon={props.toastTone === "info" ? "🂠" : "⚠︎"} tone={props.toastTone === "info" ? "neutral" : "danger"} />
          </Show>
          <Show when={!toast() && props.hint !== null && (props.hint !== undefined || (turn() === "south" && props.mode !== "pass"))}>
            <span role="status" class="glass animate-pop rounded-full px-3 py-1 text-[0.8125em] font-semibold">{props.hint ?? "Your turn · follow ♣"}</span>
          </Show>
        </div>
      </div>

      <div class="safe-bottom relative z-10">
        <div class="flex items-center justify-between gap-2 px-4 text-[0.8125em] font-semibold whitespace-nowrap text-on-table">
          <span>{props.youLabel ?? "You · ♥ 2 points"}</span>
          <span>{props.heartsBroken ? "💔 Hearts broken" : "♥ Not broken"}</span>
          <Button variant="glass" size="sm" class="shrink-0 text-[0.875em]" aria-haspopup="dialog" onClick={() => setPicker(true)}>
            <span aria-hidden="true">☰ </span>Card list
          </Button>
        </div>
        <Hand
          cards={cards()}
          mode={props.mode}
          selected={props.selected}
          onToggle={props.onToggle}
          playable={canPlay}
          twoTap={props.twoTap}
          onReject={(c) => props.onToast?.(c)}
          disabled={turn() !== "south" && props.mode !== "pass"}
          onPlay={play}
          onDragChange={(d, o) => {
            setDragging(d);
            setOver(o);
            if (d) setToast(undefined);
            if (d) props.onToast?.(undefined);
          }}
        />
        <CardPickerSheet
          open={picker()}
          onOpenChange={setPicker}
          mount={root}
          cards={cards()}
          mode={props.mode}
          selected={props.selected}
          playable={(c) => turn() === "south" && (props.playable ?? ((x: Card) => x.suit === "C"))(c)}
          onPick={(c) => {
            if (props.mode === "pass") return props.onToggle?.(c);
            setPicker(false);
            play(c);
          }}
        />
        <Show when={props.footer}>
          <div class="px-4 pt-1">{props.footer}</div>
        </Show>
      </div>
    </div>
  );
}
