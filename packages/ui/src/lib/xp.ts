import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

/** Read an XP timing token (e.g. --xp-menu-show-delay) from the element's theme, in ms. */
export function cssMs(el: Element | undefined, name: string, fallback: number) {
  if (!el) return fallback;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  if (!v) return fallback;
  return v.endsWith("ms") ? Number.parseFloat(v) : Number.parseFloat(v) * 1000;
}

/**
 * Mount/unmount with an exit phase so CSS exit animations can run.
 * state(): "closed" | "open" | "closing"
 */
export function createPresence(open: Accessor<boolean>, exitMs: () => number) {
  const [state, setState] = createSignal<"closed" | "open" | "closing">(open() ? "open" : "closed");
  let t: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    clearTimeout(t);
    if (open()) setState("open");
    else if (state() === "open") {
      const ms = exitMs();
      if (ms <= 0) setState("closed");
      else {
        setState("closing");
        t = setTimeout(() => setState("closed"), ms);
      }
    }
  });
  onCleanup(() => clearTimeout(t));
  return state;
}

/** Close when a pointer goes down outside the given elements. */
export function onOutsidePointer(els: () => (HTMLElement | undefined)[], cb: () => void) {
  const h = (e: PointerEvent) => {
    if (!els().some((el) => el?.contains(e.target as Node))) cb();
  };
  document.addEventListener("pointerdown", h, true);
  onCleanup(() => document.removeEventListener("pointerdown", h, true));
}

/** Track whether Alt is held (XP shows accelerator underlines only then). */
export function createAltHeld() {
  const [held, setHeld] = createSignal(false);
  const down = (e: KeyboardEvent) => e.key === "Alt" && setHeld(true);
  const up = (e: KeyboardEvent) => e.key === "Alt" && setHeld(false);
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", () => setHeld(false));
  onCleanup(() => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  });
  return held;
}

/** Render a label with an accelerator: "&File" → F underlined (XP), shown while Alt is held. */
export function parseAccel(label: string) {
  const i = label.indexOf("&");
  if (i < 0) return { before: label, key: "", after: "", plain: label };
  return { before: label.slice(0, i), key: label[i + 1], after: label.slice(i + 2), plain: label.replace("&", "") };
}
