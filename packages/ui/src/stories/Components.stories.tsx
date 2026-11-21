import { createSignal, For, type JSX } from "solid-js";
import { AlertDialog, Avatar, Badge, Button, ListGroup, ListItem, NavBar, SegmentedControl, Sheet, Spinner, Switch, TabBar, TextField, Toast } from "../components";
import { PhoneFrame } from "../screens";

export default { title: "Components", parameters: { layout: "padded" } };

const Board = (p: { children: JSX.Element }) => <div class="bg-app flex min-h-[60vh] flex-col gap-6 rounded-xl p-6 text-fg">{p.children}</div>;
const Row = (p: { label: string; children: JSX.Element }) => (
  <div class="flex flex-col gap-2">
    <span class="text-[0.75rem] font-medium uppercase tracking-wide text-muted">{p.label}</span>
    <div class="flex flex-wrap items-center gap-3">{p.children}</div>
  </div>
);

export const Buttons = {
  render: () => (
    <Board>
      <Row label="Variants">
        <For each={["primary", "secondary", "tinted", "glass", "ghost", "destructive"] as const}>{(v) => <Button variant={v}>{v[0].toUpperCase() + v.slice(1)}</Button>}</For>
      </Row>
      <Row label="Sizes">
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="icon" variant="glass" aria-label="Settings">⚙</Button>
      </Row>
      <Row label="Full width (large)">
        <div class="w-full max-w-sm"><Button size="lg">Create room</Button></div>
      </Row>
      <Row label="Disabled">
        <Button disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
      </Row>
    </Board>
  ),
};

export const FormControls = {
  name: "Text field, switch, segmented control",
  render: () => {
    const [seg, setSeg] = createSignal<"50" | "100">("100");
    return (
      <Board>
        <div class="flex max-w-sm flex-col gap-5">
          <TextField label="Your name" placeholder="e.g. Job" description="Shown to other players." />
          <TextField label="Password" type="password" value="hunter2" error="Wrong password. Try again." />
          <div class="rounded-lg bg-surface px-4 shadow-sm [&>*]:min-h-[52px]">
            <Switch label="Fill empty seats with bots" checked />
          </div>
          <div class="rounded-lg bg-surface px-4 shadow-sm [&>*]:min-h-[52px]">
            <Switch label="Password protect" />
          </div>
          <SegmentedControl label="Play to" value={seg()} onChange={setSeg} options={[{ value: "50", label: "50 points" }, { value: "100", label: "100 points" }]} />
        </div>
      </Board>
    );
  },
};

export const BadgesAvatarsSpinner = {
  name: "Badge, avatar, spinner, toast",
  render: () => (
    <Board>
      <Row label="Badges">
        <Badge>3/4</Badge>
        <Badge tone="accent">Your turn</Badge>
        <Badge tone="soft">♥ 13</Badge>
        <Badge tone="success">✓ Ready</Badge>
        <Badge tone="warning">Reconnecting</Badge>
        <Badge tone="danger">26</Badge>
      </Row>
      <Row label="Avatars">
        <Avatar name="Job" />
        <Avatar name="Mint" />
        <Avatar name="Tan" />
        <Avatar name="Bot Ace" />
        <Avatar name="Ploy" ring />
        <Avatar name="Big" size={64} />
      </Row>
      <Row label="Spinner">
        <Spinner />
        <Spinner size={32} />
      </Row>
      <Row label="Toasts">
        <Toast message="You must follow suit" icon="⚠︎" tone="danger" />
        <Toast message="Mint joined the room" icon="●" tone="success" />
        <Toast message="Reconnecting…" />
      </Row>
    </Board>
  ),
};

export const Lists = {
  name: "Inset grouped list",
  render: () => (
    <Board>
      <div class="max-w-md">
        <ListGroup header="Open rooms" footer="Tap a room to join.">
          <ListItem title="Friday night" subtitle="Hosted by Mint" leading={<Avatar name="Mint" size={36} />} trailing={<Badge tone="soft">3/4</Badge>} chevron onClick={() => {}} />
          <ListItem title="Office lunch" subtitle="Hosted by Ploy" leading={<Avatar name="Ploy" size={36} />} trailing={<span>🔒</span>} chevron onClick={() => {}} />
          <ListItem title="Version" trailing={<span class="text-muted">2.0.0</span>} />
        </ListGroup>
      </div>
    </Board>
  ),
};

export const Navigation = {
  name: "Nav bar & tab bar",
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneFrame>
      {() => (
        <>
          <NavBar title="Hearts" large trailing={<Avatar name="Job" size={34} />} />
          <NavBar title="Friday night" leading={<Button variant="ghost" size="sm">‹ Leave</Button>} trailing={<Button variant="ghost" size="sm">Share</Button>} />
          <div class="flex-1" />
          <TabBar active="play" items={[{ id: "play", label: "Play", icon: "♠" }, { id: "stats", label: "Stats", icon: "📊" }, { id: "settings", label: "Settings", icon: "⚙" }]} />
        </>
      )}
    </PhoneFrame>
  ),
};

export const BottomSheet = {
  name: "Bottom sheet",
  parameters: { layout: "fullscreen" },
  render: () => {
    const [open, setOpen] = createSignal(true);
    return (
      <PhoneFrame>
        {(m) => (
          <div class="flex flex-1 items-center justify-center">
            <Button onClick={() => setOpen(true)}>Open sheet</Button>
            <Sheet open={open()} onOpenChange={setOpen} mount={m} title="Sheet title" description="Sheets replace pop-up dialogs on mobile." footer={<Button size="lg" onClick={() => setOpen(false)}>Done</Button>}>
              <TextField label="Your name" placeholder="e.g. Job" />
            </Sheet>
          </div>
        )}
      </PhoneFrame>
    );
  },
};

export const Alert = {
  name: "Alert dialog",
  parameters: { layout: "fullscreen" },
  render: () => {
    const [open, setOpen] = createSignal(true);
    return (
      <PhoneFrame>
        {(m) => (
          <div class="flex flex-1 items-center justify-center">
            <Button variant="destructive" onClick={() => setOpen(true)}>Leave game</Button>
            <AlertDialog
              open={open()}
              onOpenChange={setOpen}
              mount={m}
              title="Leave this game?"
              message="A bot will take your seat so the others can keep playing."
              actions={[{ label: "Cancel", style: "cancel" }, { label: "Leave", style: "destructive" }]}
            />
          </div>
        )}
      </PhoneFrame>
    );
  },
};
