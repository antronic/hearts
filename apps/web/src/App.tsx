import type { RoomInfo, RoomSummary } from "@hearts/protocol";
import {
  Button,
  CreateRoomSheet,
  HowToPlay,
  JoinCodeSheet,
  JoinRoomSheet,
  LobbyScreen,
  type Member,
  type RoomSummary as UiRoom,
  SettingsScreen,
  Sheet,
  Spinner,
  TabBar,
  Toast,
  WaitingRoomScreen,
} from "@hearts/ui";
import { createEffect, createResource, createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { Game } from "./Game";
import { connectRoom, createRoom, listRooms, roomInfo, roomLink } from "./online";
import { setSettings, settings } from "./settings";
import { createSoloGame, discardSolo, hasSoloGame } from "./solo";

type Route = { name: "lobby" } | { name: "settings" } | { name: "solo"; resume: boolean } | { name: "room"; code: string; password?: string };

const VERSION = __APP_VERSION__;

function routeFromUrl(): Route {
  const m = location.pathname.match(/^\/r\/([A-Za-z]{4})\/?$/);
  return m ? { name: "room", code: m[1].toUpperCase() } : { name: "lobby" };
}

export function App() {
  const [mount, setMount] = createSignal<HTMLElement>();
  const [route, setRoute] = createSignal<Route>({ name: "lobby" });
  const [online, setOnline] = createSignal(navigator.onLine);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [pendingJoin, setPendingJoin] = createSignal<{ code: string; info: RoomInfo; error?: string } | null>(null);
  const [createOpen, setCreateOpen] = createSignal(false);
  const [codeOpen, setCodeOpen] = createSignal(false);
  const [codeError, setCodeError] = createSignal<string>();
  const [howTo, setHowTo] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [createError, setCreateError] = createSignal<string>();
  const [installEvt, setInstallEvt] = createSignal<any>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  const flash = (m: string) => {
    clearTimeout(noticeTimer);
    setNotice(m);
    noticeTimer = setTimeout(() => setNotice(null), 3500);
  };

  const go = (r: Route) => {
    const path = r.name === "room" ? `/r/${r.code}` : "/";
    if (location.pathname !== path) history.pushState(null, "", path);
    setRoute(r);
  };

  /** Open a room link or code: check it exists, ask for a name or password when needed. */
  const openRoom = async (code: string, password?: string) => {
    if (!navigator.onLine) return flash("You're offline. Online rooms need a connection.");
    const info = await roomInfo(code).catch(() => null);
    if (!info) {
      go({ name: "lobby" });
      return flash(`No room with the code ${code}.`);
    }
    if ((info.locked && password === undefined) || !settings().name.trim()) {
      if (route().name !== "lobby") go({ name: "lobby" });
      return setPendingJoin({ code, info });
    }
    go({ name: "room", code, password });
  };

  onMount(() => {
    const r = routeFromUrl();
    if (r.name === "room") void openRoom(r.code);
    const pop = () => {
      const r2 = routeFromUrl();
      if (r2.name === "room") void openRoom(r2.code);
      else setRoute({ name: "lobby" });
    };
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const bip = (e: Event) => (e.preventDefault(), setInstallEvt(e));
    window.addEventListener("popstate", pop);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", bip);
    onCleanup(() => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", bip);
    });
  });

  // Lobby room list, refreshed every 5 s while the lobby is visible.
  const [tick, setTick] = createSignal(0);
  const iv = setInterval(() => document.visibilityState === "visible" && setTick(tick() + 1), 5000);
  onCleanup(() => clearInterval(iv));
  const [rooms] = createResource(
    () => (route().name === "lobby" && online() ? tick() + 1 : false),
    () => listRooms().catch(() => [] as RoomSummary[]),
  );
  const uiRooms = (): UiRoom[] =>
    (rooms.latest ?? [])
      .filter((r) => !r.started && r.players < 4)
      .map((r) => ({ id: r.code, name: r.name, players: r.players, locked: r.locked, host: r.host }));

  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  const install = async () => {
    const e = installEvt();
    if (e) {
      e.prompt();
      await e.userChoice.catch(() => null);
      setInstallEvt(null);
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) flash("In Safari, tap Share, then “Add to Home Screen”.");
    else flash("Use your browser's menu and choose “Install app” or “Add to Home screen”.");
  };

  const tabs = (active: string) => (
    <TabBar
      active={active}
      onChange={(id) => go({ name: id === "settings" ? "settings" : "lobby" })}
      items={[
        { id: "play", label: "Play", icon: "♠" },
        { id: "settings", label: "Settings", icon: "⚙" },
      ]}
    />
  );

  return (
    <div class="app-shell flex min-h-[100dvh] w-full justify-center">
      <div ref={setMount} class="bg-app relative isolate flex h-[100dvh] w-full max-w-[520px] flex-col overflow-hidden text-fg sm:shadow-lg">
        <Show when={mount()}>
          {(m) => (
            <>
              <Switch>
                <Match when={route().name === "lobby"}>
                  <LobbyScreen
                    rooms={uiRooms()}
                    loading={rooms.loading && !rooms.latest}
                    offline={!online()}
                    name={settings().name}
                    resume={hasSoloGame() ? { label: "Solo game vs bots", onResume: () => go({ name: "solo", resume: true }) } : undefined}
                    onSolo={() => {
                      discardSolo();
                      go({ name: "solo", resume: false });
                    }}
                    onCreate={() => (setCreateError(undefined), setCreateOpen(true))}
                    onJoinCode={() => (setCodeError(undefined), setCodeOpen(true))}
                    onJoin={(r) => void openRoom(r.id)}
                    onTab={(id) => id === "settings" && go({ name: "settings" })}
                  />
                </Match>
                <Match when={route().name === "settings"}>
                  <SettingsScreen
                    settings={settings()}
                    onChange={setSettings}
                    version={VERSION}
                    canInstall={!isStandalone()}
                    onInstall={install}
                    onHowTo={() => setHowTo(true)}
                  />
                  {tabs("settings")}
                </Match>
                <Match when={route().name === "solo" && route()} keyed>
                  {(r) => <SoloGame resume={(r as Extract<Route, { name: "solo" }>).resume} mount={m()} onExit={() => go({ name: "lobby" })} />}
                </Match>
                <Match when={route().name === "room" && route()} keyed>
                  {(r) => {
                    const rr = r as Extract<Route, { name: "room" }>;
                    return (
                      <OnlineRoomView
                        code={rr.code}
                        password={rr.password}
                        mount={m()}
                        onExit={(msg) => {
                          go({ name: "lobby" });
                          if (msg) flash(msg);
                        }}
                        onBadPassword={(info) => {
                          go({ name: "lobby" });
                          setPendingJoin({ code: rr.code, info, error: "Wrong password. Try again." });
                        }}
                      />
                    );
                  }}
                </Match>
              </Switch>

              <CreateRoomSheet
                open={createOpen()}
                onOpenChange={setCreateOpen}
                mount={m()}
                defaultName={settings().name}
                busy={busy()}
                error={createError()}
                onSubmit={async (v) => {
                  setBusy(true);
                  setSettings({ name: v.name });
                  try {
                    const code = await createRoom({ name: v.roomName, password: v.password, target: v.target, fillWithBots: v.fillWithBots, public: v.public });
                    setCreateOpen(false);
                    go({ name: "room", code, password: v.password });
                  } catch (e) {
                    setCreateError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <JoinCodeSheet
                open={codeOpen()}
                onOpenChange={setCodeOpen}
                mount={m()}
                error={codeError()}
                onSubmit={async (code) => {
                  const info = await roomInfo(code).catch(() => null);
                  if (!info) return setCodeError("No room with that code.");
                  setCodeOpen(false);
                  void openRoom(code);
                }}
              />
              <Show when={pendingJoin()} keyed>
                {(p) => (
                  <JoinRoomSheet
                    open
                    onOpenChange={(o) => !o && setPendingJoin(null)}
                    mount={m()}
                    defaultName={settings().name}
                    error={p.error}
                    room={{ id: p.code, name: p.info.name, locked: p.info.locked, players: p.info.seats.filter((s) => s && !s.bot).length, host: p.info.host !== null ? (p.info.seats[p.info.host]?.name ?? "") : "nobody yet" }}
                    onSubmit={(v) => {
                      setSettings({ name: v.name });
                      setPendingJoin(null);
                      go({ name: "room", code: p.code, password: v.password });
                    }}
                  />
                )}
              </Show>
              <Sheet open={howTo()} onOpenChange={setHowTo} mount={m()} title="How to play Hearts" footer={<Button size="lg" onClick={() => setHowTo(false)}>Got it</Button>}>
                <HowToPlay />
              </Sheet>
              <Show when={notice()}>
                {(n) => (
                  <div class="pointer-events-none absolute inset-x-0 bottom-28 z-[70] flex justify-center px-4">
                    <Toast message={n()} />
                  </div>
                )}
              </Show>
            </>
          )}
        </Show>
      </div>
    </div>
  );
}

function SoloGame(props: { resume: boolean; mount: HTMLElement; onExit: () => void }) {
  const ctl = createSoloGame({ name: () => settings().name, resume: props.resume });
  return <Game ctl={ctl} mount={props.mount} onExit={() => (ctl.leave(), props.onExit())} />;
}

function OnlineRoomView(props: { code: string; password?: string; mount: HTMLElement; onExit: (msg?: string) => void; onBadPassword: (info: RoomInfo) => void }) {
  const room = connectRoom(props.code, () => settings().name, props.password);
  const [copied, setCopied] = createSignal(false);
  const [confirmLeave, setConfirmLeave] = createSignal(false);

  createEffect(() => {
    const f = room.fatal();
    if (!f) return;
    if (f.code === "bad-password") {
      void roomInfo(props.code).then((info) => (info ? props.onBadPassword(info) : props.onExit(f.message)));
    } else props.onExit(f.message);
  });

  const leave = () => {
    room.leave();
    props.onExit();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(roomLink(props.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const share = async () => {
    const url = roomLink(props.code);
    if (navigator.share) await navigator.share({ title: "Play Hearts with me", text: `Join my Hearts table (code ${props.code})`, url }).catch(() => {});
    else void copy();
  };

  const members = (): (Member | null)[] =>
    (room.room()?.seats ?? []).map((s, i) => (s ? { name: s.name, ready: s.ready, bot: s.bot, host: room.room()!.host === i, you: room.you() === i, offline: !s.connected } : null));
  const banner = () => (room.status() === "reconnecting" ? "Reconnecting…" : null);

  return (
    <Show
      when={room.room()}
      fallback={
        <div class="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
          <Spinner label="Connecting" />
          <span>{room.status() === "reconnecting" ? "Reconnecting…" : `Joining ${props.code}…`}</span>
          <Button variant="ghost" size="sm" onClick={() => props.onExit()}>Cancel</Button>
        </div>
      }
    >
      {(info) => (
        <Show
          when={info().started}
          fallback={
            <WaitingRoomScreen
              roomName={info().name}
              code={info().code}
              members={members()}
              youReady={room.you() !== null && !!info().seats[room.you()!]?.ready}
              canManage={room.you() === info().host}
              copied={copied()}
              onLeave={leave}
              onShare={share}
              onCopy={copy}
              onReady={() => room.send({ type: "ready", ready: !(room.you() !== null && info().seats[room.you()!]?.ready) })}
              onAddBot={(seat) => room.send({ type: "addBot", seat: seat as 0 | 1 | 2 | 3 })}
              onRemoveBot={(seat) => room.send({ type: "removeBot", seat: seat as 0 | 1 | 2 | 3 })}
            />
          }
        >
          <Game ctl={room} mount={props.mount} onExit={() => setConfirmLeave(true)} banner={banner} />
          <Sheet
            open={confirmLeave()}
            onOpenChange={setConfirmLeave}
            mount={props.mount}
            title="Leave the table?"
            description="A bot will take your seat so the others can finish."
            footer={
              <>
                <Button size="lg" variant="destructive" onClick={leave}>Leave table</Button>
                <Button size="lg" variant="secondary" onClick={() => setConfirmLeave(false)}>Stay</Button>
              </>
            }
          >
            <span />
          </Sheet>
        </Show>
      )}
    </Show>
  );
}
