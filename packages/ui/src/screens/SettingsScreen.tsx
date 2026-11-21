import { createSignal, For, type JSX, Show } from "solid-js";
import { ListGroup, ListItem, NavBar, SegmentedControl, Switch, TextField } from "../components";
import { cn } from "../lib/cn";

export type ThemeId = "glass" | "felt" | "playful" | "xp";
export type ModeId = "system" | "light" | "dark";
export type Settings = {
  name: string;
  theme: ThemeId;
  mode: ModeId;
  twoTap: boolean;
  sound: boolean;
  reduceMotion: boolean;
};

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "felt", label: "Felt", swatch: "linear-gradient(135deg,#1f6b45,#0f3d27)" },
  { id: "glass", label: "Glass", swatch: "linear-gradient(135deg,#e9eef7,#9fb4d6)" },
  { id: "playful", label: "Playful", swatch: "linear-gradient(135deg,#ff6b8b,#7b5cff)" },
  { id: "xp", label: "Windows XP", swatch: "linear-gradient(180deg,#3a8cf3,#0a49c9 55%,#2f9e2f 56%,#5cc65c)" },
];

export const defaultSettings: Settings = { name: "", theme: "xp", mode: "system", twoTap: true, sound: true, reduceMotion: false };

/** People shown in Settings → About. */
export const CREDITS = {
  creator: { name: "wytesk133", url: "https://github.com/wytesk133" },
  modernizer: { name: "antronic", url: "https://github.com/antronic" },
};

export function Credits(props: { class?: string }) {
  const link = (p: { name: string; url: string }) => (
    <a href={p.url} target="_blank" rel="noopener noreferrer" class="font-semibold text-accent-ink underline-offset-2 hover:underline">
      {p.name}
    </a>
  );
  return (
    <div class={cn("flex flex-col gap-1 px-4 py-3 text-[0.9375rem]", props.class)}>
      <p>
        <span class="text-muted">Creator: </span>
        {link(CREDITS.creator)}
      </p>
      <p>
        <span class="text-muted">Modernized by: </span>
        {link(CREDITS.modernizer)} + Claude
      </p>
    </div>
  );
}

export function SettingsScreen(props: {
  settings?: Settings;
  onChange?: (patch: Partial<Settings>) => void;
  version?: string;
  onHowTo?: () => void;
  onInstall?: () => void;
  canInstall?: boolean;
  leading?: JSX.Element;
}) {
  const [local, setLocal] = createSignal<Settings>({ ...defaultSettings, name: "Job" });
  const s = () => props.settings ?? local();
  const set = (patch: Partial<Settings>) => (props.onChange ? props.onChange(patch) : setLocal({ ...local(), ...patch }));
  return (
    <div class="flex flex-1 flex-col overflow-y-auto pb-8">
      <NavBar title="Settings" large leading={props.leading} />
      <div class="flex flex-col gap-6 px-4">
        <ListGroup header="Player">
          <div class="px-4 py-3">
            <TextField label="Your name" hideLabel placeholder="Your name" value={s().name} onChange={(v) => set({ name: v.slice(0, 16) })} />
          </div>
        </ListGroup>
        <ListGroup header="Theme">
          <div role="radiogroup" aria-label="Theme" class="grid grid-cols-2 gap-2 p-3">
            <For each={THEMES}>
              {(t) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={s().theme === t.id}
                  data-xp-off
                  onClick={() => set({ theme: t.id })}
                  class={cn(
                    "no-select flex min-h-[52px] items-center gap-3 rounded-md px-3 py-2 text-left ring-1 ring-separator",
                    s().theme === t.id && "ring-2 ring-accent",
                  )}
                >
                  <span aria-hidden="true" class="h-8 w-8 shrink-0 rounded-full shadow-sm" style={{ background: t.swatch }} />
                  <span class="text-[0.9375rem] font-medium">{t.label}</span>
                </button>
              )}
            </For>
          </div>
          <div class="px-4 py-3">
            <SegmentedControl
              label="Appearance"
              value={s().mode}
              onChange={(v) => set({ mode: v as ModeId })}
              options={[{ value: "system", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
            />
          </div>
        </ListGroup>
        <ListGroup header="Gameplay" footer="Two-tap play lifts a card first so you never misplay. Dragging a card up always plays it.">
          <div class="px-4 [&>*]:min-h-[52px]"><Switch label="Two-tap to play" checked={s().twoTap} onChange={(v) => set({ twoTap: v })} /></div>
          <div class="px-4 [&>*]:min-h-[52px]"><Switch label="Sound effects" checked={s().sound} onChange={(v) => set({ sound: v })} /></div>
          <div class="px-4 [&>*]:min-h-[52px]"><Switch label="Reduce motion" checked={s().reduceMotion} onChange={(v) => set({ reduceMotion: v })} /></div>
        </ListGroup>
        <ListGroup header="About">
          <ListItem title="How to play Hearts" chevron onClick={props.onHowTo ?? (() => {})} />
          <Show when={props.canInstall ?? true}>
            <ListItem title="Install app" subtitle="Add to Home Screen for offline play" chevron onClick={props.onInstall ?? (() => {})} />
          </Show>
          <ListItem title="Version" trailing={<span class="text-muted">{props.version ?? "2.0.0"}</span>} />
        </ListGroup>
        <ListGroup header="Credits">
          <Credits />
        </ListGroup>
      </div>
    </div>
  );
}

/** Short rules sheet body. */
export function HowToPlay() {
  return (
    <div class="flex flex-col gap-3 text-[0.9375rem] leading-relaxed">
      <p>Four players, 13 cards each. The lowest score wins when someone reaches the target.</p>
      <ul class="flex list-disc flex-col gap-1.5 pl-5">
        <li>Before each round, pass 3 cards: left, right, across, then no pass.</li>
        <li>Whoever holds the 2♣ leads it. You must follow suit if you can.</li>
        <li>The highest card of the led suit wins the trick.</li>
        <li>Each ♥ is 1 point and the Q♠ is 13. No points on the first trick.</li>
        <li>You can't lead ♥ until a heart has been played.</li>
        <li>Take all 13 hearts and the Q♠ to shoot the moon: everyone else gets 26.</li>
      </ul>
      <p class="text-muted">Drag a card up to play it, or tap it twice. "Card list" shows your hand as a list.</p>
    </div>
  );
}
