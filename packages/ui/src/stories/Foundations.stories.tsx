import { For, type JSX } from "solid-js";
import { Button } from "../components";
import { PlayingCard } from "../game";
import { GameTableScreen, LobbyScreen, PhoneFrame } from "../screens";

export default { title: "Foundations", parameters: { layout: "padded" } };

const colors = [
  ["bg", "App background"], ["surface", "Surface"], ["surface-glass", "Glass"], ["surface-sunken", "Sunken"],
  ["fg", "Text"], ["fg-muted", "Secondary text"], ["separator", "Separator"], ["accent", "Accent"],
  ["accent-soft", "Accent soft"], ["success", "Success"], ["warning", "Warning"], ["danger", "Danger"],
];

const Section = (p: { title: string; children: JSX.Element }) => (
  <section class="mb-10">
    <h2 class="font-display mb-4 text-[1.375rem]">{p.title}</h2>
    {p.children}
  </section>
);

export const Tokens = {
  render: () => (
    <div class="bg-app min-h-screen rounded-xl p-6 text-fg">
      <Section title="Color">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <For each={colors}>
            {([v, label]) => (
              <div class="overflow-hidden rounded-md bg-surface shadow-sm">
                <div class="h-16 border-b border-separator" style={{ background: `var(--${v})` }} />
                <div class="p-2 text-[0.8125rem]"><b>{label}</b><br /><code class="text-muted">--{v}</code></div>
              </div>
            )}
          </For>
          <div class="overflow-hidden rounded-md bg-surface shadow-sm">
            <div class="h-16" style={{ background: "var(--table)" }} />
            <div class="p-2 text-[0.8125rem]"><b>Table</b><br /><code class="text-muted">--table</code></div>
          </div>
          <div class="overflow-hidden rounded-md bg-surface shadow-sm">
            <div class="h-16" style={{ background: "var(--card-back)" }} />
            <div class="p-2 text-[0.8125rem]"><b>Card back</b><br /><code class="text-muted">--card-back</code></div>
          </div>
        </div>
      </Section>
      <Section title="Typography">
        <div class="flex flex-col gap-2 rounded-lg bg-surface p-5 shadow-sm">
          <p class="font-display text-[2.125rem] leading-tight">Large title 34</p>
          <p class="font-display text-[1.75rem]">Title 1 · 28</p>
          <p class="font-display text-[1.375rem]">Title 2 · 22</p>
          <p class="text-[1.0625rem] font-semibold">Headline · 17 semibold</p>
          <p class="text-[1.0625rem]">Body · 17 — The quick brown fox shot the moon.</p>
          <p class="text-[0.9375rem] text-muted">Subhead · 15</p>
          <p class="text-[0.8125rem] text-muted">Footnote · 13</p>
          <p class="text-[0.6875rem] text-muted">Caption · 11</p>
        </div>
      </Section>
      <Section title="Radius & elevation">
        <div class="flex flex-wrap gap-4">
          <For each={["sm", "md", "lg", "xl"]}>
            {(r) => <div class="grid h-24 w-24 place-items-center bg-surface text-[0.8125rem] shadow-md" style={{ "border-radius": `var(--t-radius-${r})` }}>radius-{r}</div>}
          </For>
          <For each={["sm", "md", "lg"]}>
            {(s) => <div class="grid h-24 w-24 place-items-center rounded-md bg-surface text-[0.8125rem]" style={{ "box-shadow": `var(--t-shadow-${s})` }}>shadow-{s}</div>}
          </For>
        </div>
      </Section>
      <Section title="Spacing (4pt grid) & touch target">
        <div class="flex items-end gap-3">
          <For each={[1, 2, 3, 4, 5, 6, 8]}>{(n) => <div class="flex flex-col items-center gap-1 text-[0.6875rem] text-muted"><div class="bg-accent" style={{ width: `var(--space-${n})`, height: `var(--space-${n})` }} />{n * 4}</div>}</For>
          <div class="ml-6 grid h-[44px] w-[44px] place-items-center rounded-full border-2 border-dashed border-accent text-[0.6875rem]">44</div>
        </div>
      </Section>
      <Section title="Motion">
        <p class="mb-3 text-[0.9375rem] text-muted">Press and hold the buttons. Glass &amp; Felt use a smooth iOS spring; Playful overshoots.</p>
        <div class="flex gap-3">
          <Button>Press me</Button>
          <Button variant="secondary">Spring</Button>
        </div>
      </Section>
    </div>
  ),
};

const themes = ["glass", "felt", "playful", "xp"] as const;
const names = { glass: "Glass", felt: "Felt", playful: "Playful", xp: "Windows XP" };

const Compare = (p: { mode: "light" | "dark"; screen: "lobby" | "table" }) => (
  <div class="flex flex-wrap justify-center gap-6">
    <For each={themes}>
      {(t) => (
        <div data-theme={t} data-mode={p.mode} class="flex flex-col items-center gap-2 rounded-xl p-2" style={{ background: "var(--bg)", color: "var(--fg)" }}>
          <h3 class="font-display text-[1.25rem]">{names[t]}</h3>
          <div style={{ zoom: 0.66 }}>
            <PhoneFrame>{() => (p.screen === "lobby" ? <LobbyScreen /> : <GameTableScreen />)}</PhoneFrame>
          </div>
        </div>
      )}
    </For>
  </div>
);

export const CompareThemesTable = { parameters: { isolateThemes: true }, name: "Compare themes · table (light)", render: () => <Compare mode="light" screen="table" /> };
export const CompareThemesTableDark = { parameters: { isolateThemes: true }, name: "Compare themes · table (dark)", render: () => <Compare mode="dark" screen="table" /> };
export const CompareThemesLobby = { parameters: { isolateThemes: true }, name: "Compare themes · lobby (light)", render: () => <Compare mode="light" screen="lobby" /> };
export const CompareThemesLobbyDark = { parameters: { isolateThemes: true }, name: "Compare themes · lobby (dark)", render: () => <Compare mode="dark" screen="lobby" /> };

export const CompareCards = {
  parameters: { isolateThemes: true },
  name: "Compare themes · cards",
  render: () => (
    <div class="flex flex-col gap-4">
      <For each={themes}>
        {(t) => (
          <For each={["light", "dark"] as const}>
            {(m) => (
              <div data-theme={t} data-mode={m} class="flex items-center gap-3 rounded-xl p-4" style={{ background: "var(--table)" }}>
                <span class="w-28 text-[0.8125rem] font-semibold text-on-table">{names[t]} · {m}</span>
                <PlayingCard card={{ rank: "A", suit: "S" }} />
                <PlayingCard card={{ rank: "Q", suit: "H" }} />
                <PlayingCard card={{ rank: "10", suit: "D" }} />
                <PlayingCard card={{ rank: "7", suit: "C" }} />
                <PlayingCard faceDown />
              </div>
            )}
          </For>
        )}
      </For>
    </div>
  ),
};
