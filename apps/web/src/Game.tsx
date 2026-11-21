import type { Seat } from "@hearts/engine";
import { Button, type Card, GameOverScreen, GameTableScreen, type MenuEntry, type PlayerSeatProps, RoundScoreSheet, Spinner, type Seat as UiSeat } from "@hearts/ui";
import { createEffect, createMemo, createSignal, on, onCleanup, Show } from "solid-js";
import { hintFor, reason, relSeat, toCard, toId } from "./adapt";
import type { GameController } from "./controller";
import { settings } from "./settings";
import { sfx } from "./sound";

const ARROW = { left: "←", right: "→", across: "↑", none: "" } as const;

export function Game(props: { ctl: GameController; mount: HTMLElement; onExit: () => void; banner?: () => string | null }) {
  const c = props.ctl;
  const v = () => c.view();
  const [selected, setSelected] = createSignal<string[]>([]);
  const [toast, setToast] = createSignal<string | undefined>();
  const [tone, setTone] = createSignal<"danger" | "info">("danger");
  const [scores, setScores] = createSignal(false);
  const [held, setHeld] = createSignal<{ trick: Partial<Record<UiSeat, Card>>; winner: UiSeat } | null>(null);
  const [nextPressed, setNextPressed] = createSignal(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let heldTimer: ReturnType<typeof setTimeout> | undefined;

  const say = (msg: string | undefined, ms = 2600, t: "danger" | "info" = "danger") => {
    clearTimeout(toastTimer);
    setTone(t);
    setToast(msg);
    if (msg) toastTimer = setTimeout(() => setToast(undefined), ms);
  };
  onCleanup(() => (clearTimeout(toastTimer), clearTimeout(heldTimer)));

  // Server or engine refused a move.
  createEffect(() => {
    const e = c.error();
    if (e) (say(e), c.clearError(), sfx("error"));
  });

  // Keep a finished trick on the table for a moment so you can see who took it.
  createEffect(
    on(
      createMemo(() => v()?.tricksPlayed),
      (n, prev) => {
        const view = v();
        if (!view || prev === undefined || n === undefined || n <= prev || !view.lastTrick) return;
        const t: Partial<Record<UiSeat, Card>> = {};
        for (const x of view.lastTrick.cards) t[relSeat(x.seat, view.you)] = toCard(x.card);
        const winner = relSeat(view.lastTrick.winner, view.you);
        setHeld({ trick: t, winner });
        if (view.lastTrick.points > 0) sfx(view.lastTrick.winner === view.you ? "ouch" : "trick");
        else sfx("trick");
        clearTimeout(heldTimer);
        heldTimer = setTimeout(() => setHeld(null), 1200);
      },
    ),
  );
  // A new card on the table ends the pause early.
  createEffect(on(createMemo(() => v()?.trick.length), (n) => n && (setHeld(null), sfx("card"))));

  // New round: clear selection; tell the player what they received.
  createEffect(
    on(
      createMemo(() => v()?.round),
      () => {
        setSelected([]);
        setNextPressed(false);
      },
    ),
  );
  createEffect(
    on(
      createMemo(() => (v()?.phase === "playing" && v()?.received ? `${v()!.round}:${v()!.received!.join(",")}` : null)),
      (k) => {
        const r = v()?.received;
        if (k && r && v()!.tricksPlayed === 0) say(`You received ${r.map((id) => id.replace(/[CDSH]$/, (s) => ({ C: "♣", D: "♦", S: "♠", H: "♥" })[s]!)).join("  ")}`, 4000, "info");
      },
    ),
  );
  createEffect(on(createMemo(() => v()?.turn === v()?.you && v()?.phase === "playing"), (mine) => mine && sfx("turn"), { defer: true }));

  const players = createMemo(() => {
    const view = v();
    const out: Partial<Record<Exclude<UiSeat, "south">, PlayerSeatProps>> = {};
    if (!view) return out;
    for (const s of [0, 1, 2, 3] as Seat[]) {
      if (s === view.you) continue;
      out[relSeat(s, view.you) as Exclude<UiSeat, "south">] = {
        name: c.names()[s] ?? "",
        bot: c.bots()[s],
        offline: c.offline()[s],
        cards: view.handCounts[s],
        points: view.roundPoints[s],
      };
    }
    return out;
  });

  const trick = createMemo(() => {
    const view = v();
    if (!view) return {};
    if (held() && view.trick.length === 0) return held()!.trick;
    const t: Partial<Record<UiSeat, Card>> = {};
    for (const x of view.trick) t[relSeat(x.seat, view.you)] = toCard(x.card);
    return t;
  });

  const passing = () => v()?.phase === "passing" && !v()?.yourPass;
  const waitingPass = () => v()?.phase === "passing" && !!v()?.yourPass;
  const status = () => {
    const view = v()!;
    if (view.phase === "passing") return `Round ${view.round + 1} · Pass ${view.passDirection}`;
    return `Round ${view.round + 1} · Trick ${Math.min(view.tricksPlayed + 1, 13)}/13`;
  };
  const hint = () => {
    const view = v()!;
    if (waitingPass()) return "Waiting for others to pass…";
    if (passing()) return null;
    if (held()) return `${c.names()[view.lastTrick!.winner]} takes the trick${view.lastTrick!.points ? ` · ♥ ${view.lastTrick!.points}` : ""}`;
    return hintFor(view, c.names());
  };

  const toggle = (card: Card) => {
    const id = toId(card);
    const s = selected();
    if (s.includes(id)) setSelected(s.filter((x) => x !== id));
    else if (s.length < 3) setSelected([...s, id]);
    else say("You can pass 3 cards. Tap one to put it back.");
  };

  const menu = (): MenuEntry[] => [
    ...(c.kind === "solo" ? [{ label: "&New Game", onSelect: () => c.newGame() } as MenuEntry, { type: "separator" } as MenuEntry] : []),
    { label: "&Score…", onSelect: () => setScores(true) },
    { type: "separator" },
    { label: c.kind === "solo" ? "&Back to Lobby" : "&Leave Table", onSelect: props.onExit },
  ];

  const roundTitle = () => {
    const view = v()!;
    const last = view.history.at(-1) ?? [];
    if (view.moon !== null) return `${c.names()[view.moon]} shot the moon!`;
    const q = last.findIndex((p) => p >= 13);
    return q >= 0 ? `${c.names()[q]} took the Queen of Spades.` : "No one took the Queen of Spades.";
  };

  return (
    <Show
      when={v()}
      fallback={
        <div class="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
          <Spinner label="Dealing" />
          <span>Dealing…</span>
        </div>
      }
    >
      {(view) => (
        <Show
          when={view().phase !== "gameOver"}
          fallback={
            <GameOverScreen
              players={c.names()}
              totals={view().scores}
              rounds={view().history.length}
              youIndex={view().you}
              againLabel={c.kind === "solo" ? "Play again" : "Play again with this table"}
              onAgain={() => c.newGame()}
              onLobby={props.onExit}
            />
          }
        >
          <GameTableScreen
            hand={view().hand.map(toCard)}
            trick={trick()}
            turn={view().phase === "playing" ? relSeat(view().turn, view().you) : "south"}
            heartsBroken={view().heartsBroken}
            winner={held()?.winner}
            players={players()}
            status={status()}
            hint={hint()}
            toast={toast()}
            toastTone={tone()}
            youLabel={`${c.names()[view().you] || "You"} · ♥ ${view().roundPoints[view().you]} · total ${view().scores[view().you]}`}
            menu={menu()}
            onScores={() => setScores(true)}
            mode={passing() ? "pass" : "play"}
            selected={selected().map(toCard)}
            onToggle={toggle}
            twoTap={settings().twoTap}
            playable={(card) => view().phase === "playing" && view().legal.includes(toId(card))}
            onPlay={(card) => {
              if (view().phase !== "playing" || view().turn !== view().you) return say("It's not your turn yet.");
              const why = reason(view(), toId(card));
              if (why) return say(why);
              c.play(toId(card));
            }}
            onToast={(card) => {
              if (!card) return say(undefined);
              const why = view().phase === "playing" && view().turn !== view().you ? "It's not your turn yet." : reason(view(), toId(card));
              if (why) (say(why), sfx("error"));
            }}
            banner={
              <Show when={view().phase === "passing"}>
                <div class="glass animate-rise mx-4 mt-2 rounded-lg px-4 py-3 text-center shadow-md">
                  <p class="font-display text-[1.25em]">
                    Pass 3 cards {view().passDirection} {ARROW[view().passDirection]}
                    {" · to "}
                    {c.names()[(view().you + ({ left: 1, right: 3, across: 2, none: 0 } as const)[view().passDirection]) % 4]}
                  </p>
                  <p class="text-[0.8125em] text-muted">
                    {passing() ? `Tap cards to select · ${selected().length}/3 chosen` : "Cards passed. Waiting for the others…"}
                  </p>
                </div>
              </Show>
            }
            footer={
              <Show when={passing()}>
                <Button
                  size="lg"
                  disabled={selected().length !== 3}
                  onClick={() => {
                    c.pass(selected());
                    sfx("card");
                  }}
                >
                  Pass {selected().length === 3 ? "cards" : `(${selected().length}/3)`}
                </Button>
              </Show>
            }
          />
          <Show when={props.banner?.()}>
            {(b) => (
              <div role="status" class="glass absolute top-[calc(var(--safe-top,12px)+56px)] left-1/2 z-30 -translate-x-1/2 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold shadow-md">
                {b()}
              </div>
            )}
          </Show>
          <RoundScoreSheet
            open={view().phase === "roundOver" || scores()}
            onOpenChange={(o) => {
              if (!o) setScores(false);
            }}
            mount={props.mount}
            title={view().phase === "roundOver" ? `Round ${view().round + 1} complete` : "Scores"}
            description={view().phase === "roundOver" ? roundTitle() : `Playing to ${view().target}. Lowest score wins.`}
            players={c.names()}
            rounds={view().history}
            limit={view().target}
            action={view().phase === "roundOver" ? (nextPressed() ? "Waiting for the table…" : "Next round") : ""}
            actionDisabled={nextPressed()}
            onAction={() => {
              setScores(false);
              if (c.kind === "online") setNextPressed(true);
              c.nextRound();
            }}
          />
        </Show>
      )}
    </Show>
  );
}
