import { createSignal, For } from "solid-js";
import { cn } from "../lib/cn";
import { type Card, cardKey, cardLabel } from "./cards";
import { PlayingCard } from "./PlayingCard";

export type HandProps = {
  cards: Card[];
  /** Cards the player may legally play; others are dimmed. Omit = all playable */
  playable?: (c: Card) => boolean;
  /** "play": drag up or tap twice to play. "pass": tap to toggle up to maxSelect cards. */
  mode?: "play" | "pass";
  selected?: Card[];
  maxSelect?: number;
  onPlay?: (c: Card) => void;
  onToggle?: (c: Card) => void;
  /** A card that can't be played was chosen (the app can explain why). */
  onReject?: (c: Card) => void;
  onDragChange?: (dragging: boolean, overTable: boolean) => void;
  cardWidth?: number;
  disabled?: boolean;
  /** false: a single tap plays (scrubbing still only selects). Default true. */
  twoTap?: boolean;
};

const PLAY_THRESHOLD = 70; // px dragged upward to count as a play
const SLOP = 8; // px of movement before a touch counts as a drag or scrub

/**
 * Fanned hand with full touch, drag, keyboard and screen-reader support.
 *
 * Touch (fanned cards overlap, so each visible strip is narrower than 44pt):
 * - Touch anywhere on the hand and slide sideways to "scrub": the card under your finger rises,
 *   so the whole hand acts as one large target and you see the card before committing.
 * - Lift your finger to select it; tap it again, or drag it up past the line, to play.
 * - The table also offers "Choose card", a list of 44pt rows, as an equivalent control.
 *
 * Mouse and pen work the same. Keyboard: Tab or ←/→ between cards, Enter/Space selects then plays.
 * VoiceOver/TalkBack: each card is a button named "Queen of Spades"; double-tap selects, double-tap
 * again plays, and a live region announces each step. Nothing requires a drag.
 * touch-action:none + user-select:none + no callout: the page never scrolls, zooms or selects text.
 */
export function Hand(props: HandProps) {
  const [lifted, setLifted] = createSignal<string | null>(null);
  const [scrub, setScrub] = createSignal<string | null>(null);
  const [drag, setDrag] = createSignal<{ key: string; x: number; y: number } | null>(null);
  const [say, setSay] = createSignal("");
  let g = { id: -1, x: 0, y: 0, key: "", mode: "none" as "none" | "scrub" | "drag" };
  let lastUp = 0;
  let root!: HTMLDivElement;

  const w = () => props.cardWidth ?? 60;
  const n = () => props.cards.length;
  const byKey = (k: string) => props.cards.find((c) => cardKey(c) === k);
  const isSelected = (c: Card) => props.selected?.some((s) => cardKey(s) === cardKey(c)) ?? false;
  const canPlay = (c: Card) => !props.disabled && (props.playable ? props.playable(c) : true);
  const announce = (t: string) => setSay(say() === t ? `${t} ` : t);

  const activate = (c: Card) => {
    if (props.disabled) return announce("Not your turn yet");
    if (props.mode === "pass") {
      props.onToggle?.(c);
      return announce(`${cardLabel(c)} ${isSelected(c) ? "will be passed" : "kept"}`);
    }
    if (!canPlay(c)) {
      props.onReject?.(c);
      return announce(`${cardLabel(c)} can't be played now`);
    }
    if (lifted() === cardKey(c) || props.twoTap === false) {
      setLifted(null);
      props.onPlay?.(c);
      announce(`Played ${cardLabel(c)}`);
    } else {
      setLifted(cardKey(c));
      announce(`${cardLabel(c)} selected. Activate again to play`);
    }
  };

  /** The card button under a point: hit-test top-most first so overlapping cards resolve correctly. */
  const cardAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-card]");
    if (el && root.contains(el)) return el.dataset.card!;
    // Finger beside the fan (e.g. below the arc): pick the nearest card horizontally.
    let best: string | null = null;
    let dist = Infinity;
    for (const b of root.querySelectorAll<HTMLElement>("[data-card]")) {
      const r = b.getBoundingClientRect();
      const d = Math.abs(x - (r.left + Math.min(r.width, 28) / 2));
      if (d < dist) (dist = d), (best = b.dataset.card!);
    }
    return best;
  };

  const buzz = () => navigator.vibrate?.(4);

  const onDown = (e: PointerEvent) => {
    if (props.disabled || g.id !== -1 || e.button > 0) return;
    const key = cardAt(e.clientX, e.clientY);
    if (!key) return;
    root.setPointerCapture(e.pointerId);
    g = { id: e.pointerId, x: e.clientX, y: e.clientY, key, mode: "none" };
    if (e.pointerType !== "mouse") setScrub(key);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === "none" && Math.hypot(dx, dy) < SLOP) return;
    if (g.mode === "none") {
      const c = byKey(g.key)!;
      // Mostly upward on a playable card = drag to play; otherwise scrub along the hand.
      g.mode = -dy > Math.abs(dx) && props.mode !== "pass" && canPlay(c) ? "drag" : "scrub";
    }
    if (g.mode === "scrub") {
      const k = cardAt(e.clientX, e.clientY);
      if (k && k !== g.key) {
        g.key = k;
        buzz();
      }
      setScrub(g.key);
      // A scrub can turn into a play: slide onto a card, then push up.
      const c = byKey(g.key)!;
      if (-dy > 40 && props.mode !== "pass" && canPlay(c)) {
        g.mode = "drag";
        g.x = e.clientX;
        g.y = e.clientY - 40;
      }
      return;
    }
    const ddx = e.clientX - g.x;
    const ddy = e.clientY - g.y;
    setScrub(null);
    setDrag({ key: g.key, x: ddx, y: Math.min(ddy, 20) });
    props.onDragChange?.(true, -ddy > PLAY_THRESHOLD);
  };
  const end = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerId !== g.id) return;
    const d = drag();
    const key = g.key;
    const mode = g.mode;
    g.id = -1;
    lastUp = performance.now();
    setDrag(null);
    setScrub(null);
    props.onDragChange?.(false, false);
    if (cancelled) return;
    const c = byKey(key);
    if (!c) return;
    if (mode === "drag") {
      if (d && -d.y > PLAY_THRESHOLD) {
        setLifted(null);
        props.onPlay?.(c);
        announce(`Played ${cardLabel(c)}`);
      }
      return;
    }
    if (mode === "scrub" && lifted() !== key && props.mode !== "pass") {
      // Scrubbing then lifting selects the card you settled on (never plays by accident).
      if (canPlay(c)) {
        setLifted(key);
        announce(`${cardLabel(c)} selected. Tap again or drag up to play`);
      } else announce(`${cardLabel(c)} can't be played now`);
      return;
    }
    activate(c);
  };

  const transform = (c: Card, i: number) => {
    const mid = (n() - 1) / 2;
    const off = i - mid;
    const angle = off * Math.min(3, 30 / Math.max(n(), 1));
    const arc = Math.abs(off) ** 2 * 0.45;
    const d = drag();
    if (d && d.key === cardKey(c)) return `translate(${d.x}px, ${d.y + arc - 8}px) rotate(${angle * 0.3}deg) scale(var(--card-pop-scale, 1.08))`;
    const k = cardKey(c);
    const lift = scrub() === k ? -30 : lifted() === k || isSelected(c) ? -22 : 0;
    return `translateY(${arc + lift}px) rotate(${angle}deg)${scrub() === k ? " scale(var(--card-pop-scale, 1.06))" : ""}`;
  };

  return (
    <div
      ref={root}
      role="group"
      data-xp-off
      aria-label={props.mode === "pass" ? `Your hand, ${n()} cards. Select ${props.maxSelect ?? 3} cards to pass` : `Your hand, ${n()} cards`}
      class="touch-surface flex justify-center px-2 pt-8 pb-2"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
    >
      <For each={props.cards}>
        {(c, i) => (
          <button
            type="button"
            data-card={cardKey(c)}
            aria-label={cardLabel(c)}
            aria-pressed={props.mode === "pass" ? isSelected(c) : lifted() === cardKey(c)}
            aria-disabled={props.disabled || (!canPlay(c) && props.mode !== "pass")}
            class={cn(
              "relative origin-bottom outline-none focus-visible:z-30 focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-accent",
              drag()?.key === cardKey(c) ? "z-40 transition-none" : "transition-transform duration-200 ease-theme",
            )}
            style={{
              "margin-left": i() === 0 ? "0" : `${-Math.max(w() * 0.42, w() - (330 - w()) / Math.max(n() - 1, 1))}px`,
              transform: transform(c, i()),
              "z-index": drag()?.key === cardKey(c) ? 40 : scrub() === cardKey(c) ? 35 : i(),
            }}
            // Keyboard, switch control and screen readers fire click without pointer events.
            onClick={(e) => {
              if (performance.now() - lastUp < 600) return; // already handled as a pointer gesture
              e.preventDefault();
              activate(c);
            }}
            onKeyDown={(e) => {
              const btns = [...root.querySelectorAll<HTMLElement>("[data-card]")];
              const at = btns.indexOf(e.currentTarget);
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                btns[(at + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length]?.focus();
              }
            }}
          >
            <PlayingCard card={c} width={w()} disabled={props.mode !== "pass" && !canPlay(c)} selected={isSelected(c)} />
          </button>
        )}
      </For>
      <span class="sr-only" aria-live="polite">{say()}</span>
    </div>
  );
}
