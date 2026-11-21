import { createSignal, createUniqueId, type JSX, onCleanup, Show } from "solid-js";
import { cn } from "../lib/cn";
import { createPresence, cssMs } from "../lib/xp";

/**
 * Tooltip. XP timing: appears after the initial delay (500ms) on hover or focus,
 * pops after 5s, fades in and out. On touch: long-press shows it.
 */
export function Tooltip(props: { text: string; children: (p: { "aria-describedby": string; ref: (el: HTMLElement) => void }) => JSX.Element; placement?: "top" | "bottom" }) {
  const id = createUniqueId();
  const [open, setOpen] = createSignal(false);
  let anchor: HTMLElement | undefined;
  let showT: ReturnType<typeof setTimeout> | undefined;
  let popT: ReturnType<typeof setTimeout> | undefined;
  const state = createPresence(open, () => cssMs(anchor, "--tooltip-fade-duration", 0));
  const clear = () => (clearTimeout(showT), clearTimeout(popT));
  const show = () => {
    clear();
    showT = setTimeout(() => {
      setOpen(true);
      popT = setTimeout(() => setOpen(false), cssMs(anchor, "--tooltip-autopop", 5000));
    }, cssMs(anchor, "--tooltip-initial-delay", 500));
  };
  const hide = () => (clear(), setOpen(false));
  onCleanup(clear);
  const bind = (el: HTMLElement) => {
    anchor = el;
    el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && show());
    el.addEventListener("pointerleave", hide);
    el.addEventListener("focus", () => el.matches(":focus-visible") && show());
    el.addEventListener("blur", hide);
    el.addEventListener("pointerdown", (e) => (e.pointerType === "mouse" ? hide() : show()));
    // Touch: only a long-press (held past the initial delay) shows the tip; a normal tap never does.
    el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      if (open()) {
        // The long-press was for the tip, not the button: swallow the click that follows.
        el.addEventListener("click", (c) => (c.preventDefault(), c.stopImmediatePropagation()), { capture: true, once: true });
        setTimeout(hide, 1500);
      } else clear();
    });
    el.addEventListener("keydown", (e) => e.key === "Escape" && hide());
  };
  return (
    <span class="relative inline-flex">
      {props.children({ "aria-describedby": id, ref: bind })}
      <Show when={state() !== "closed"}>
        <span
          id={id}
          role="tooltip"
          class={cn(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-sm bg-[#111] px-2 py-1 text-[0.8125rem] text-white shadow-md",
            props.placement === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]",
            state() === "open" ? "is-open" : "is-closing",
          )}
        >
          {props.text}
        </span>
      </Show>
    </span>
  );
}

/** XP balloon tip (role=tooltip.balloon). In iOS themes it is a callout card. */
export function BalloonTip(props: { title?: string; children: JSX.Element; onClose?: () => void; bottom?: boolean; right?: boolean; icon?: JSX.Element; class?: string }) {
  return (
    <div
      role="tooltip"
      class={cn("balloon is-open relative max-w-[300px] rounded-lg bg-surface p-3 pr-8 text-[0.875rem] text-fg shadow-lg", props.bottom && "is-bottom", props.right && "is-right", props.class)}
    >
      <Show when={props.title}>
        <strong class="balloon-title mb-1 flex items-center gap-2 font-semibold">
          {props.icon}
          {props.title}
        </strong>
      </Show>
      {props.children}
      <Show when={props.onClose}>
        <button type="button" aria-label="Close" class="hit-target absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-sunken text-[0.6875rem] text-muted" onClick={props.onClose}>
          <span class="xp-hide">✕</span>
        </button>
      </Show>
    </div>
  );
}
