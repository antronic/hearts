import { createSignal, Show } from "solid-js";
import { Button, SegmentedControl, Sheet, Switch, TextField } from "../components";
import type { RoomSummary } from "./LobbyScreen";

export type CreateRoomValues = { roomName: string; name: string; target: 50 | 100; fillWithBots: boolean; password?: string; public: boolean };

export function CreateRoomSheet(props: {
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  mount?: HTMLElement;
  defaultName?: string;
  busy?: boolean;
  error?: string;
  onSubmit?: (v: CreateRoomValues) => void;
}) {
  const [locked, setLocked] = createSignal(false);
  const [bots, setBots] = createSignal(true);
  const [listed, setListed] = createSignal(true);
  const [target, setTarget] = createSignal<"50" | "100">("100");
  const [roomName, setRoomName] = createSignal("");
  const [name, setName] = createSignal(props.defaultName ?? "");
  const [pw, setPw] = createSignal("");
  const valid = () => name().trim().length > 0 && (!locked() || pw().length > 0);
  const submit = () =>
    props.onSubmit?.({
      roomName: roomName().trim() || `${name().trim()}'s table`,
      name: name().trim(),
      target: target() === "50" ? 50 : 100,
      fillWithBots: bots(),
      password: locked() ? pw() : undefined,
      public: listed(),
    });
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
      title="Create room"
      description="Invite friends with a link or code."
      footer={<Button size="lg" disabled={!valid() || props.busy} onClick={submit}>{props.busy ? "Creating…" : "Create room"}</Button>}
    >
      <TextField label="Room name" placeholder={name() ? `${name()}'s table` : "Friday night"} value={roomName()} onChange={(v) => setRoomName(v.slice(0, 24))} />
      <TextField label="Your name" placeholder="e.g. Job" value={name()} onChange={(v) => setName(v.slice(0, 16))} error={props.error} />
      <div class="flex flex-col gap-1.5">
        <span class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-muted">Play to</span>
        <SegmentedControl label="Play to" value={target()} onChange={setTarget} options={[{ value: "50", label: "50 points" }, { value: "100", label: "100 points" }]} />
      </div>
      <div class="flex flex-col divide-y divide-separator rounded-lg bg-surface px-4 shadow-sm [&>*]:min-h-[52px]">
        <Switch label="Fill empty seats with bots" checked={bots()} onChange={setBots} />
        <Switch label="Show in open rooms" checked={listed()} onChange={setListed} />
        <Switch label="Password protect" checked={locked()} onChange={setLocked} />
      </div>
      <Show when={locked()}>
        <TextField label="Password" type="password" value={pw()} onChange={setPw} />
      </Show>
    </Sheet>
  );
}

export function JoinRoomSheet(props: {
  room: RoomSummary;
  open: boolean;
  onOpenChange?: (o: boolean) => void;
  mount?: HTMLElement;
  error?: string;
  defaultName?: string;
  busy?: boolean;
  onSubmit?: (v: { name: string; password?: string }) => void;
}) {
  const [name, setName] = createSignal(props.defaultName ?? "");
  const [pw, setPw] = createSignal("");
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
      title={`Join “${props.room.name}”`}
      description={`${props.room.players} of 4 seats taken · hosted by ${props.room.host}`}
      footer={
        <Button size="lg" disabled={!name().trim() || props.busy} onClick={() => props.onSubmit?.({ name: name().trim(), password: props.room.locked ? pw() : undefined })}>
          {props.busy ? "Joining…" : "Join"}
        </Button>
      }
    >
      <TextField label="Your name" placeholder="e.g. Job" value={name()} onChange={(v) => setName(v.slice(0, 16))} />
      <Show when={props.room.locked}>
        <TextField label="Password" type="password" value={pw()} onChange={setPw} error={props.error} />
      </Show>
      <Show when={!props.room.locked && props.error}>
        <p role="alert" class="px-1 text-[0.875rem] text-danger-ink">{props.error}</p>
      </Show>
    </Sheet>
  );
}

export function JoinCodeSheet(props: { open: boolean; onOpenChange?: (o: boolean) => void; mount?: HTMLElement; error?: string; onSubmit?: (code: string) => void }) {
  const [code, setCode] = createSignal("");
  const clean = () => code().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  return (
    <Sheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
      title="Join by code"
      description="Ask the host for the 4-letter room code."
      footer={<Button size="lg" disabled={clean().length !== 4} onClick={() => props.onSubmit?.(clean())}>Continue</Button>}
    >
      <TextField label="Room code" placeholder="HX7Q" value={clean()} onChange={setCode} error={props.error} />
    </Sheet>
  );
}
