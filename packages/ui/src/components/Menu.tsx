import { createEffect, createSignal, For, type JSX, onCleanup, Show } from "solid-js";
import { cn } from "../lib/cn";
import { createAltHeld, cssMs, onOutsidePointer, parseAccel } from "../lib/xp";

export type MenuEntry =
  | { type: "separator" }
  | {
      type?: "item" | "checkbox" | "radio";
      /** "&" marks the accelerator letter, e.g. "&New Game" */
      label: string;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
      submenu?: MenuEntry[];
      onSelect?: () => void;
    };

const Label = (p: { label: string }) => {
  const a = parseAccel(p.label);
  return (
    <span>
      {a.before}
      <Show when={a.key}>
        <span class="accel">{a.key}</span>
      </Show>
      {a.after}
    </span>
  );
};

const itemRole = (e: MenuEntry) => (e.type === "checkbox" ? "menuitemcheckbox" : e.type === "radio" ? "menuitemradio" : "menuitem");

/**
 * Popup menu (ul[role=menu], XP.css markup).
 * XP behaviour: fades in; submenus open after the menu show delay (400ms) on hover, or at once
 * with click / → key; after a click the menu vanishes and the chosen item's highlight fades out.
 */
export function MenuList(props: { items: MenuEntry[]; onClose: (chosen: boolean) => void; class?: string; style?: JSX.CSSProperties; autofocus?: boolean; ref?: (el: HTMLUListElement) => void }) {
  const [sub, setSub] = createSignal<number | null>(null);
  const [chosen, setChosen] = createSignal<number | null>(null);
  let ul!: HTMLUListElement;
  let hoverT: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(hoverT));

  const focusables = () => [...ul.querySelectorAll<HTMLElement>(":scope > li[tabindex]")];
  const move = (dir: 1 | -1) => {
    const f = focusables();
    const i = f.indexOf(document.activeElement as HTMLElement);
    f[(i + dir + f.length) % f.length]?.focus();
  };

  const choose = (i: number, e: Exclude<MenuEntry, { type: "separator" }>) => {
    if (e.disabled) return;
    if (e.submenu) return setSub(i);
    setChosen(i);
    e.onSelect?.();
    const ms = cssMs(ul, "--menu-item-fadeout-duration", 0);
    const isXp = !!ul.closest('[data-theme="xp"]');
    setTimeout(() => props.onClose(true), isXp ? ms : 0);
  };

  return (
    <ul
      ref={(el) => {
        ul = el;
        props.ref?.(el);
        if (props.autofocus) queueMicrotask(() => focusables()[0]?.focus());
      }}
      role="menu"
      class={cn(
        "is-open no-select glass-strong z-50 min-w-[220px] rounded-md p-1.5 text-[0.9375rem] shadow-lg",
        chosen() !== null && "is-fading",
        props.class,
      )}
      style={props.style}
      onKeyDown={(ev) => {
        if (ev.key === "ArrowDown") (ev.preventDefault(), move(1));
        else if (ev.key === "ArrowUp") (ev.preventDefault(), move(-1));
        else if (ev.key === "Escape") (ev.stopPropagation(), props.onClose(false));
        else if (ev.key === "Home") focusables()[0]?.focus();
        else if (ev.key === "End") focusables().at(-1)?.focus();
        else if (ev.key.length === 1) {
          // accelerator letter
          const i = props.items.findIndex((e) => e.type !== "separator" && parseAccel(e.label).key.toLowerCase() === ev.key.toLowerCase());
          const e = props.items[i];
          if (e && e.type !== "separator") choose(i, e);
        }
      }}
    >
      <For each={props.items}>
        {(e, i) =>
          e.type === "separator" ? (
            <li role="separator" class="my-1 border-t border-separator" />
          ) : (
            <li
              role={itemRole(e)}
              tabindex="-1"
              aria-disabled={e.disabled ? "true" : undefined}
              aria-checked={e.type === "checkbox" || e.type === "radio" ? !!e.checked : undefined}
              aria-haspopup={e.submenu ? "true" : undefined}
              aria-expanded={e.submenu ? sub() === i() : undefined}
              class={cn(
                "relative flex h-11 cursor-default items-center gap-3 rounded-sm px-3 outline-none focus:bg-accent-soft hover:bg-accent-soft",
                e.disabled && "opacity-40",
                chosen() === i() && "is-closing",
              )}
              onPointerEnter={(ev) => {
                // Hover-to-open is a mouse nicety only. Touch opens submenus with a tap (no hover needed).
                if (ev.pointerType === "touch") return;
                clearTimeout(hoverT);
                if (e.submenu) hoverT = setTimeout(() => setSub(i()), cssMs(ul, "--menu-show-delay", 0));
                else hoverT = setTimeout(() => setSub(null), cssMs(ul, "--menu-show-delay", 0));
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                choose(i(), e);
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") (ev.preventDefault(), choose(i(), e));
                if (ev.key === "ArrowRight" && e.submenu) (ev.preventDefault(), ev.stopPropagation(), setSub(i()));
              }}
            >
              <span class="xp-hide w-4 text-center text-accent-ink" aria-hidden="true">
                {e.checked ? (e.type === "radio" ? "●" : "✓") : ""}
              </span>
              <Label label={e.label} />
              <Show when={e.shortcut}>
                <kbd class="ml-auto font-[inherit] text-[0.8125rem] text-muted">{e.shortcut}</kbd>
              </Show>
              <Show when={e.submenu}>
                <span class="xp-hide ml-auto text-muted" aria-hidden="true">›</span>
              </Show>
              <Show when={e.submenu && sub() === i()}>
                <MenuList
                  items={e.submenu!}
                  autofocus
                  class="absolute top-[-6px] left-[calc(100%-4px)]"
                  onClose={(c) => {
                    setSub(null);
                    if (c) props.onClose(true);
                  }}
                />
              </Show>
            </li>
          )
        }
      </For>
    </ul>
  );
}

/** Button that opens a popup menu (e.g. the game table ☰). */
export function DropdownMenu(props: { trigger: (p: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu"; ref: (el: HTMLElement) => void }) => JSX.Element; items: MenuEntry[]; align?: "start" | "end" }) {
  const [open, setOpen] = createSignal(false);
  let trig: HTMLElement | undefined;
  let menu: HTMLUListElement | undefined;
  onOutsidePointer(() => [trig, menu], () => setOpen(false));
  return (
    <div class="relative inline-block">
      {props.trigger({ onClick: () => setOpen(!open()), "aria-expanded": open(), "aria-haspopup": "menu", ref: (el) => (trig = el) })}
      <Show when={open()}>
        <MenuList
          ref={(el) => (menu = el)}
          items={props.items}
          autofocus
          class={cn("absolute top-[calc(100%+6px)]", props.align === "end" ? "right-0" : "left-0")}
          onClose={() => {
            setOpen(false);
            trig?.focus();
          }}
        />
      </Show>
    </div>
  );
}

/**
 * Menu bar (ul[role=menubar]) like Windows Hearts' "Game  Help".
 * XP behaviour: click opens a menu; while one is open, hovering another title switches to it;
 * ←/→ move between menus; Alt shows accelerator underlines and Alt+letter opens a menu.
 */
export function Menubar(props: { menus: { label: string; items: MenuEntry[] }[]; class?: string }) {
  const [open, setOpen] = createSignal<number | null>(null);
  // XP fades only the first menu; moving to a neighbour while one is open shows it at once.
  const [instant, setInstant] = createSignal(false);
  const switchTo = (i: number) => (setInstant(true), setOpen(i));
  createEffect(() => open() === null && setInstant(false));
  const alt = createAltHeld();
  let bar!: HTMLUListElement;
  onOutsidePointer(() => [bar], () => setOpen(null));
  const tops = () => [...bar.querySelectorAll<HTMLElement>(":scope > li")];

  const onKey = (e: KeyboardEvent) => {
    if (!e.altKey || e.key.length !== 1) return;
    const i = props.menus.findIndex((m) => parseAccel(m.label).key.toLowerCase() === e.key.toLowerCase());
    if (i >= 0) {
      e.preventDefault();
      setOpen(i);
      tops()[i]?.focus();
    }
  };
  window.addEventListener("keydown", onKey);
  onCleanup(() => window.removeEventListener("keydown", onKey));

  return (
    <ul ref={bar} role="menubar" class={cn("no-select flex gap-0.5 px-1 text-[0.9375rem]", alt() && "show-accel", props.class)}>
      <For each={props.menus}>
        {(m, i) => (
          <li
            role="menuitem"
            tabindex="0"
            aria-haspopup="true"
            aria-expanded={open() === i()}
            class="relative cursor-default rounded-sm px-3 py-2 outline-none hover:bg-accent-soft focus-visible:bg-accent-soft aria-expanded:bg-accent-soft"
            onClick={() => (open() === null ? (setInstant(false), setOpen(i())) : open() === i() ? setOpen(null) : switchTo(i()))}
            onPointerEnter={(e) => e.pointerType !== "touch" && open() !== null && open() !== i() && switchTo(i())}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") (e.preventDefault(), tops()[(i() + 1) % props.menus.length]?.focus(), open() !== null && switchTo((i() + 1) % props.menus.length));
              if (e.key === "ArrowLeft") (e.preventDefault(), tops()[(i() - 1 + props.menus.length) % props.menus.length]?.focus(), open() !== null && switchTo((i() - 1 + props.menus.length) % props.menus.length));
              if (e.key === "ArrowDown" || e.key === "Enter") (e.preventDefault(), setOpen(i()));
            }}
          >
            <Label label={m.label} />
            <Show when={open() === i()}>
              <MenuList
                items={m.items}
                autofocus
                class={cn("absolute top-full left-0 text-fg", instant() && "is-instant")}
                onClose={() => {
                  setOpen(null);
                  tops()[i()]?.focus();
                }}
              />
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}
