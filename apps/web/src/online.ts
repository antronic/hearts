import type { PlayerView, Seat } from "@hearts/engine";
import type { ClientMessage, CreateRoomBody, RoomInfo, RoomSummary, ServerMessage } from "@hearts/protocol";
import { createMemo, createSignal, onCleanup } from "solid-js";
import type { GameController } from "./controller";
import { clientId } from "./settings";

export async function listRooms(): Promise<RoomSummary[]> {
  const r = await fetch("/api/rooms");
  if (!r.ok) throw new Error("Couldn't load rooms.");
  return r.json();
}

export async function createRoom(body: Partial<CreateRoomBody> & { name: string }): Promise<string> {
  const r = await fetch("/api/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.code) throw new Error(data.error ?? "Couldn't create a room. Try again.");
  return data.code;
}

export async function roomInfo(code: string): Promise<RoomInfo | null> {
  const r = await fetch(`/api/rooms/${code}/info`);
  return r.ok ? r.json() : null;
}

export type OnlineRoom = GameController & {
  room: () => RoomInfo | null;
  you: () => Seat | null;
  status: () => "connecting" | "open" | "reconnecting" | "closed";
  fatal: () => { message: string; code?: string } | null;
  send: (m: ClientMessage) => void;
};

/** One room over a WebSocket. Reconnects with backoff and keeps your seat via clientId. */
export function connectRoom(code: string, name: () => string, password?: string): OnlineRoom {
  const [room, setRoom] = createSignal<RoomInfo | null>(null);
  const [view, setView] = createSignal<PlayerView | null>(null);
  const [you, setYou] = createSignal<Seat | null>(null);
  const [status, setStatus] = createSignal<"connecting" | "open" | "reconnecting" | "closed">("connecting");
  const [error, setError] = createSignal<string | null>(null);
  const [fatal, setFatal] = createSignal<{ message: string; code?: string } | null>(null);
  let ws: WebSocket | null = null;
  let tries = 0;
  let closed = false;
  let ping: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const send = (m: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
  };

  const open = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/api/rooms/${code}/ws`);
    ws.onopen = () => {
      tries = 0;
      setStatus("open");
      send({ type: "hello", clientId: clientId(), name: name() || "Player", password });
      clearInterval(ping);
      ping = setInterval(() => send({ type: "ping" }), 25_000);
    };
    ws.onmessage = (e) => {
      let m: ServerMessage;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (m.type === "welcome") (setYou(m.you), setRoom(m.room));
      else if (m.type === "room") setRoom(m.room);
      else if (m.type === "game") setView(m.view);
      else if (m.type === "error") {
        if (m.code === "bad-password" || m.code === "full" || m.code === "not-found") {
          closed = true;
          setFatal({ message: m.message, code: m.code });
        } else setError(m.message);
      }
    };
    ws.onclose = (e) => {
      clearInterval(ping);
      if (closed) return setStatus("closed");
      if (e.code === 1008 || e.code === 4404) {
        closed = true;
        setFatal({ message: "No room with that code.", code: "not-found" });
        return setStatus("closed");
      }
      setStatus("reconnecting");
      const wait = Math.min(10_000, 500 * 2 ** tries++);
      retry = setTimeout(open, wait);
    };
  };

  // Come back quickly when the phone wakes up or the network returns.
  const wake = () => {
    if (!closed && ws && ws.readyState > WebSocket.OPEN) (clearTimeout(retry), open());
  };
  window.addEventListener("online", wake);
  document.addEventListener("visibilitychange", wake);

  open();
  const stop = () => {
    closed = true;
    clearInterval(ping);
    clearTimeout(retry);
    window.removeEventListener("online", wake);
    document.removeEventListener("visibilitychange", wake);
    ws?.close();
  };
  onCleanup(stop);

  const names = createMemo(() => (room()?.seats ?? []).map((s, i) => s?.name ?? `Seat ${i + 1}`));
  return {
    kind: "online",
    room,
    you,
    status,
    fatal,
    send,
    view,
    names,
    bots: () => (room()?.seats ?? []).map((s) => !!s?.bot),
    offline: () => (room()?.seats ?? []).map((s) => !!s && !s.connected),
    error,
    clearError: () => setError(null),
    pass: (cards) => send({ type: "pass", cards }),
    play: (card) => send({ type: "play", card }),
    nextRound: () => send({ type: "nextRound" }),
    newGame: () => send({ type: "newGame" }),
    leave: () => {
      send({ type: "leave" });
      setTimeout(stop, 50);
    },
  };
}

export const roomLink = (code: string) => `${location.origin}/r/${code}`;
