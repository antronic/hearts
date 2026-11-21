import { createSignal, type JSX } from "solid-js";
import {
  BalloonTip, Button, Checkbox, ComboBox, DropdownMenu, GroupBox, ListBox, ListView, Menubar, type MenuEntry, ProgressBar,
  RadioGroup, Select, Slider, Tabs, Toolbar, Tooltip, XpIcon,
} from "../components";
import { gameMenu } from "../screens/GameTableScreen";

export default { title: "Components/Controls", parameters: { layout: "padded" } };

const Board = (p: { children: JSX.Element; note?: string }) => (
  <div class="bg-app flex min-h-[70vh] flex-col gap-6 rounded-xl p-6 text-fg">
    {p.note && <p class="max-w-xl text-[0.875rem] text-muted">{p.note}</p>}
    {p.children}
  </div>
);

const helpMenu: MenuEntry[] = [{ label: "&Contents", shortcut: "F1" }, { label: "&Search for Help on…" }, { type: "separator" }, { label: "&About Hearts" }];

export const Menus = {
  name: "Menu bar & menus",
  render: () => {
    const [log, setLog] = createSignal("Nothing chosen yet");
    const withLog = (items: MenuEntry[]): MenuEntry[] =>
      items.map((e) => (e.type === "separator" ? e : { ...e, onSelect: () => setLog(`Chose “${e.label.replace("&", "")}”`), submenu: e.submenu && withLog(e.submenu) }));
    return (
      <Board note="Click a menu title to open it; while a menu is open, hover the other title to switch. Submenus open after XP's 400ms hover delay (or → key). Hold Alt to see accelerator underlines, Alt+G opens Game. After a click the menu vanishes and the chosen item fades out.">
        <div class="rounded-md bg-surface shadow-sm">
          <Menubar menus={[{ label: "&Game", items: withLog(gameMenu) }, { label: "&Help", items: withLog(helpMenu) }]} />
        </div>
        <div class="flex items-center gap-3">
          <DropdownMenu items={withLog(gameMenu)} trigger={(t) => <Button {...t}>Game menu ▾</Button>} />
          <span class="text-[0.875rem] text-muted" role="status">{log()}</span>
        </div>
      </Board>
    );
  },
};

export const Tooltips = {
  name: "Tooltip & balloon tip",
  render: () => {
    const [show, setShow] = createSignal(true);
    return (
      <Board note="Tooltips appear after 500ms of hover (or a long-press on touch), stay for 5s, and fade in and out.">
        <div class="flex gap-3 pt-8">
          <Tooltip text="Pass three cards to the left">{(t) => <Button {...t}>Hover me</Button>}</Tooltip>
          <Tooltip text="Show scores (F4)" placement="bottom">{(t) => <Button variant="secondary" {...t}>🏆 Scores</Button>}</Tooltip>
        </div>
        {show() && (
          <BalloonTip title="Hearts are broken" icon={<XpIcon kind="info" size={16} />} onClose={() => setShow(false)}>
            You can now lead with a heart.
          </BalloonTip>
        )}
        <BalloonTip title="Connection lost" icon={<XpIcon kind="warning" size={16} />} bottom right>
          Trying to reconnect to the room…
        </BalloonTip>
      </Board>
    );
  },
};

export const Dropdowns = {
  name: "Combo box, dropdown & list box",
  render: () => (
    <Board note="The combo box list slides open like XP. ↑/↓ to move, Enter to pick, typing filters. The dropdown is a native select: on phones it opens the system picker.">
      <div class="grid max-w-md gap-5">
        <ComboBox label="Room" options={["Friday night", "Office lunch", "Shoot the moon", "Lobby 4"]} value="Friday night" />
        <Select label="Play to" options={["50 points", "100 points", "150 points"]} value="100 points" />
        <div class="flex flex-col gap-1.5">
          <span data-slot="field-label" class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">Bots (multi-select)</span>
          <ListBox label="Bots" multiple height={180} value={["ace"]} options={[{ value: "ace", label: "Bot Ace" }, { value: "queen", label: "Bot Queen" }, { value: "jack", label: "Bot Jack" }, { value: "joker", label: "Bot Joker", disabled: true }]} />
        </div>
      </div>
    </Board>
  ),
};

export const Toolbars = {
  name: "Toolbar",
  render: () => {
    const [sound, setSound] = createSignal(true);
    return (
      <Board note="Flat buttons that raise on hover, like Explorer. ←/→ move between buttons.">
        <Toolbar
          label="Table tools"
          items={[
            { label: "New game", icon: <span aria-hidden="true">🂠</span> },
            { label: "Undo", icon: <span aria-hidden="true">↶</span>, disabled: true },
            { divider: true },
            { label: "Scores", icon: <span aria-hidden="true">🏆</span> },
            { label: "Sound", icon: <span aria-hidden="true">🔊</span>, pressed: sound(), onClick: () => setSound(!sound()) },
            { divider: true },
            { label: "Help", icon: <span aria-hidden="true">❓</span>, showLabel: false },
          ]}
        />
      </Board>
    );
  },
};

export const DetailsList = {
  name: "Details list (list view)",
  render: () => (
    <Board note="Click a column header to sort; ↑/↓ moves the selection.">
      <ListView
        label="Game history"
        height={220}
        class="max-w-lg"
        columns={[{ key: "date", label: "Date" }, { key: "winner", label: "Winner" }, { key: "score", label: "Your score", numeric: true }, { key: "rounds", label: "Rounds", numeric: true }]}
        rows={[
          { date: "2026-11-21", winner: "You", score: 38, rounds: 6 },
          { date: "2026-11-20", winner: "Mint", score: 71, rounds: 5 },
          { date: "2026-11-18", winner: "Bot Ace", score: 102, rounds: 7 },
          { date: "2026-11-15", winner: "You", score: 22, rounds: 4 },
          { date: "2026-11-12", winner: "Tan", score: 64, rounds: 6 },
        ]}
      />
    </Board>
  ),
};

export const TabsStory = {
  name: "Tabs",
  render: () => (
    <Board>
      <Tabs
        label="Options"
        class="max-w-md"
        tabs={[
          { id: "game", label: "Game", content: <RadioGroup legend="Play to" name="target" options={["50 points", "100 points"]} value="100 points" /> },
          { id: "sound", label: "Sound", content: <Checkbox label="Play sounds" checked /> },
          { id: "about", label: "About", content: <p class="text-[0.875rem]">Hearts 2.0</p> },
        ]}
      />
    </Board>
  ),
};

export const FormBits = {
  name: "Checkbox, radio, group box, progress, slider",
  render: () => {
    const [vol, setVol] = createSignal(60);
    return (
      <Board>
        <div class="grid max-w-md gap-5">
          <GroupBox legend="Options">
            <Checkbox label="Fill empty seats with bots" checked />
            <Checkbox label="Show hints" />
            <Checkbox label="Allow spectators" disabled />
          </GroupBox>
          <RadioGroup legend="Pass direction" name="pass" options={["Left", "Right", "Across", "No pass"]} value="Left" />
          <ProgressBar label="Connecting to room…" value={64} />
          <ProgressBar label="Waiting for players (no end)" />
          <Slider label={`Volume ${vol()}%`} value={vol()} onInput={setVol} />
        </div>
      </Board>
    );
  },
};
