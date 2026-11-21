import { createContext, createEffect, createSignal, For, type JSX, on, onCleanup, Show, useContext } from "solid-js";
import { cn } from "../lib/cn";
import { cssMs } from "../lib/xp";
import { MenuList, type MenuEntry } from "./Menu";

/* ───────────── Window manager (z-order, active window, minimize, taskbar) ───────────── */

type WinState = { id: string; title: string; icon?: string; minimized: boolean; open: boolean };
type Ctx = {
  wins: () => WinState[];
  order: () => string[];
  active: () => string | null;
  activate: (id: string) => void;
  register: (w: Omit<WinState, "minimized" | "open">) => void;
  setMin: (id: string, m: boolean) => void;
  close: (id: string) => void;
  open: (id: string) => void;
  taskButton: (id: string) => HTMLElement | undefined;
  setTaskButton: (id: string, el: HTMLElement) => void;
  area: () => HTMLElement | undefined;
};
const DesktopCtx = createContext<Ctx>();

/**
 * XP desktop: Bliss wallpaper, desktop icons, windows and a taskbar with Start menu and clock.
 * Clicking a window brings it to the front and makes the others inactive; taskbar buttons
 * restore, activate or minimize windows, like XP.
 */
export function Desktop(props: { children: JSX.Element; icons?: { id: string; label: string; icon: string }[]; startMenu?: MenuEntry[]; class?: string }) {
  const [wins, setWins] = createSignal<WinState[]>([]);
  const [order, setOrder] = createSignal<string[]>([]);
  const [active, setActive] = createSignal<string | null>(null);
  const [start, setStart] = createSignal(false);
  const [area, setArea] = createSignal<HTMLElement>();
  const taskBtns = new Map<string, HTMLElement>();
  const upd = (id: string, f: (w: WinState) => WinState) => setWins(wins().map((w) => (w.id === id ? f(w) : w)));
  const ctx: Ctx = {
    wins,
    order,
    active,
    activate: (id) => {
      setOrder([...order().filter((x) => x !== id), id]);
      setActive(id);
    },
    register: (w) => {
      if (!wins().some((x) => x.id === w.id)) {
        setWins([...wins(), { ...w, minimized: false, open: true }]);
        setOrder([...order(), w.id]);
        setActive(w.id);
      }
    },
    setMin: (id, m) => {
      upd(id, (w) => ({ ...w, minimized: m }));
      if (m) setActive(order().filter((x) => x !== id && !wins().find((w) => w.id === x)?.minimized).at(-1) ?? null);
      else ctx.activate(id);
    },
    close: (id) => {
      upd(id, (w) => ({ ...w, open: false }));
      setActive(order().filter((x) => x !== id && wins().find((w) => w.id === x)?.open).at(-1) ?? null);
    },
    open: (id) => {
      upd(id, (w) => ({ ...w, open: true, minimized: false }));
      ctx.activate(id);
    },
    taskButton: (id) => taskBtns.get(id),
    setTaskButton: (id, el) => taskBtns.set(id, el),
    area,
  };
  const [clock, setClock] = createSignal(new Date());
  const t = setInterval(() => setClock(new Date()), 15000);
  onCleanup(() => clearInterval(t));
  return (
    <DesktopCtx.Provider value={ctx}>
      <div class={cn("bg-app relative flex h-full min-h-[560px] w-full flex-col overflow-hidden", props.class)} data-xp-desktop>
        <div ref={setArea} class="relative flex-1" onPointerDown={(e) => e.target === e.currentTarget && (setActive(null), setStart(false))}>
          <div class="absolute top-3 left-3 flex flex-col gap-4">
            <For each={props.icons ?? []}>
              {(ic) => (
                <button
                  type="button"
                  data-xp-off
                  class="no-select flex w-20 flex-col items-center gap-1 rounded-sm p-1 text-center text-[0.75rem] text-white [text-shadow:1px_1px_2px_#000] focus:bg-[#316ac5]/60 focus:outline-1 focus:outline-dotted focus:outline-white"
                  onDblClick={() => ctx.open(ic.id)}
                  onKeyDown={(e) => e.key === "Enter" && ctx.open(ic.id)}
                  onPointerUp={(e) => e.pointerType !== "mouse" && ctx.open(ic.id)}
                >
                  <span class="text-[2rem] leading-none drop-shadow" aria-hidden="true">{ic.icon}</span>
                  {ic.label}
                </button>
              )}
            </For>
          </div>
          {props.children}
        </div>
        {/* Taskbar */}
        <div data-xp-off class="no-select relative z-[100] flex min-h-[34px] items-stretch gap-1 pr-0" style={{ background: "var(--xp-taskbar)" }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={start()}
            class="flex items-center gap-1.5 rounded-r-[10px] pr-5 pl-2 text-[0.9375rem] font-bold text-white italic [text-shadow:1px_1px_1px_#1a4b1a]"
            style={{ background: start() ? "radial-gradient(circle at 30% 20%, #5aa65a, #2f7d2f 60%, #1f5f1f)" : "var(--xp-start)", "box-shadow": "inset -2px -2px 3px rgb(0 0 0/.3), inset 2px 2px 3px rgb(255 255 255/.35)" }}
            onClick={() => setStart(!start())}
          >
            <span aria-hidden="true" class="not-italic">⊞</span> start
          </button>
          <Show when={start()}>
            <MenuList
              items={props.startMenu ?? [{ label: "&Hearts", onSelect: () => ctx.open("hearts") }, { type: "separator" }, { label: "T&urn Off Computer…", disabled: true }]}
              autofocus
              class="absolute bottom-full left-0 mb-0.5"
              onClose={() => setStart(false)}
            />
          </Show>
          <div class="flex flex-1 items-center gap-1 overflow-hidden px-1">
            <For each={wins().filter((w) => w.open)}>
              {(w) => (
                <button
                  type="button"
                  ref={(el) => ctx.setTaskButton(w.id, el)}
                  aria-pressed={active() === w.id && !w.minimized}
                  class={cn(
                    "flex h-[26px] max-w-[160px] min-w-0 flex-1 items-center gap-1.5 truncate rounded-[3px] px-2 text-left text-[0.75rem] text-white",
                    active() === w.id && !w.minimized ? "bg-[#1e52b7] shadow-[inset_1px_1px_2px_#0c3a8f]" : "bg-[#2a66dc] shadow-[inset_-1px_-1px_#1a50b8,inset_1px_1px_#77a8f8]",
                  )}
                  onClick={() => (w.minimized ? ctx.setMin(w.id, false) : active() === w.id ? ctx.setMin(w.id, true) : ctx.activate(w.id))}
                >
                  <span aria-hidden="true">{w.icon}</span>
                  <span class="truncate">{w.title}</span>
                </button>
              )}
            </For>
          </div>
          <div class="flex items-center border-l border-[#092e9c] px-3 text-[0.75rem] text-white" style={{ background: "linear-gradient(180deg,#0c59b9,#139ee9 10%,#18b5f2 15%,#139beb 50%,#1290e8 90%,#0d8dea)" }}>
            {clock().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </DesktopCtx.Provider>
  );
}

/**
 * XP "Animate windows when minimizing and maximizing" (DrawAnimatedRects, IDANI_CAPTION):
 * a copy of the title bar flies linearly from one rectangle to another while the window itself
 * is hidden. The window never scales or fades. Skipped with reduced motion.
 */
function captionZoom(title: HTMLElement, from: DOMRect, to: DOMRect, ms: number): Promise<void> {
  if (ms <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const ghost = document.createElement("div");
  ghost.className = "title-bar xp-caption-zoom";
  ghost.setAttribute("aria-hidden", "true");
  const text = title.querySelector(".title-bar-text");
  if (text) ghost.append(text.cloneNode(true));
  document.body.append(ghost);
  const h = (r: DOMRect) => Math.min(r.height, title.offsetHeight || r.height);
  const box = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${h(r)}px` });
  const a = ghost.animate([box(from), box(to)], { duration: ms, easing: "linear", fill: "forwards" });
  return a.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}

/**
 * XP window (.window / .title-bar / .window-body / .status-bar from XP.css).
 * Drag by the title bar (contents shown while dragging, the XP default), double-click it to maximize,
 * Minimize flies the caption into the taskbar button,
 * Close removes it. Inactive windows get the pale title bar.
 */
export function Window(props: {
  id: string;
  title: string;
  icon?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  controls?: ("minimize" | "maximize" | "help" | "close")[];
  menubar?: JSX.Element;
  toolbar?: JSX.Element;
  status?: string[];
  children: JSX.Element;
  class?: string;
}) {
  const d = useContext(DesktopCtx);
  d?.register({ id: props.id, title: props.title, icon: props.icon });
  const [pos, setPos] = createSignal({ x: props.x ?? 40, y: props.y ?? 40 });
  const [max, setMax] = createSignal(false);
  // Hidden while the caption zoom plays (XP shows only the flying caption, never a scaled window).
  const [zooming, setZooming] = createSignal(false);
  let el!: HTMLDivElement;
  const me = () => d?.wins().find((w) => w.id === props.id);
  const isActive = () => !d || d.active() === props.id;
  const z = () => (d ? d.order().indexOf(props.id) + 1 : 1);
  const controls = () => props.controls ?? ["minimize", "maximize", "close"];
  const titleBar = () => el.querySelector<HTMLElement>(".title-bar")!;
  const zoom = (from: DOMRect, to: DOMRect) => captionZoom(titleBar(), from, to, cssMs(el, "--xp-minimize", 0));

  let drag: { dx: number; dy: number } | null = null;
  const minimize = () => {
    if (!d) return;
    const tb = d.taskButton(props.id)?.getBoundingClientRect();
    const from = titleBar().getBoundingClientRect();
    d.setMin(props.id, true); // the window disappears at once; only its caption flies
    if (tb) zoom(from, tb);
  };
  // Restore from the taskbar: caption flies from the button back to the title bar, then the window appears.
  createEffect(
    on(
      () => !!me()?.minimized,
      (m, prev) => {
        if (prev && !m) {
          const tb = d?.taskButton(props.id)?.getBoundingClientRect();
          if (!tb) return;
          setZooming(true);
          zoom(tb, titleBar().getBoundingClientRect()).then(() => setZooming(false));
        }
      },
    ),
  );
  const toggleMax = () => {
    const from = titleBar().getBoundingClientRect();
    setMax(!max());
    const to = titleBar().getBoundingClientRect();
    setZooming(true);
    zoom(from, to).then(() => setZooming(false));
  };

  return (
    <Show when={!d || me()?.open}>
      <div
        ref={el}
        role="dialog"
        aria-label={props.title}
        class={cn("window absolute flex flex-col overflow-hidden rounded-t-lg bg-surface shadow-lg", !isActive() && "is-inactive", props.class)}
        style={{
          left: max() ? "0" : `${pos().x}px`,
          top: max() ? "0" : `${pos().y}px`,
          width: max() ? "100%" : `${props.width ?? 320}px`,
          height: max() ? "100%" : props.height ? `${props.height}px` : undefined,
          "z-index": z(),
          visibility: me()?.minimized || zooming() ? "hidden" : "visible",
        }}
        onPointerDown={() => d?.activate(props.id)}
      >
        <div
          class="title-bar flex h-10 items-center justify-between gap-2 px-3"
          onDblClick={() => controls().includes("maximize") && toggleMax()}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button") || max()) return;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag = { dx: e.clientX - pos().x, dy: e.clientY - pos().y };
          }}
          onPointerMove={(e) => {
            if (!drag) return;
            const a = d?.area()?.getBoundingClientRect();
            const nx = e.clientX - drag.dx;
            const ny = e.clientY - drag.dy;
            setPos({ x: a ? Math.min(Math.max(nx, -el.offsetWidth + 60), a.width - 60) : nx, y: a ? Math.min(Math.max(ny, 0), a.height - 28) : ny });
          }}
          onPointerUp={() => (drag = null)}
        >
          <div class="title-bar-text flex min-w-0 items-center gap-1.5 truncate font-semibold">
            <Show when={props.icon}>
              <span aria-hidden="true">{props.icon}</span>
            </Show>
            {props.title}
          </div>
          <div class="title-bar-controls flex gap-1">
            <Show when={controls().includes("help")}>
              <button type="button" aria-label="Help" />
            </Show>
            <Show when={controls().includes("minimize")}>
              <button type="button" aria-label="Minimize" onClick={minimize} />
            </Show>
            <Show when={controls().includes("maximize")}>
              <button type="button" aria-label={max() ? "Restore" : "Maximize"} onClick={toggleMax} />
            </Show>
            <Show when={controls().includes("close")}>
              <button type="button" aria-label="Close" onClick={() => d?.close(props.id)} />
            </Show>
          </div>
        </div>
        {props.menubar}
        {props.toolbar}
        <div class="window-body min-h-0 flex-1 overflow-auto">{props.children}</div>
        <Show when={props.status}>
          <div class="status-bar flex gap-1">
            <For each={props.status}>{(s) => <p class="status-bar-field m-0 flex-1 truncate px-1 text-[0.6875rem]">{s}</p>}</For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
