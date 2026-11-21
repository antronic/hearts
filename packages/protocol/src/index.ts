/**
 * Wire protocol between the browser and a game room (plain JSON over WebSocket).
 * The same messages work against the Cloudflare Durable Object server and the Node server.
 * Every client message is validated with valibot before the room acts on it.
 */
import * as v from "valibot";
import type { PlayerView, Seat } from "@hearts/engine";

const card = v.pipe(v.string(), v.regex(/^(10|[2-9JQKA])[CDSH]$/));
const name = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(20));
const seat = v.picklist([0, 1, 2, 3]);

export const ClientMessage = v.variant("type", [
  /** First message on a socket. clientId is a random id kept in localStorage so a refresh keeps your seat. */
  v.object({ type: v.literal("hello"), clientId: v.pipe(v.string(), v.minLength(8), v.maxLength(64)), name, password: v.optional(v.pipe(v.string(), v.maxLength(64))) }),
  v.object({ type: v.literal("ready"), ready: v.boolean() }),
  v.object({ type: v.literal("addBot"), seat }),
  v.object({ type: v.literal("removeBot"), seat }),
  v.object({ type: v.literal("pass"), cards: v.pipe(v.array(card), v.length(3)) }),
  v.object({ type: v.literal("play"), card }),
  v.object({ type: v.literal("nextRound") }),
  v.object({ type: v.literal("newGame") }),
  v.object({ type: v.literal("leave") }),
  v.object({ type: v.literal("ping") }),
]);
export type ClientMessage = v.InferOutput<typeof ClientMessage>;

export const parseClientMessage = (raw: unknown) => v.safeParse(ClientMessage, raw);

export type SeatInfo = { name: string; bot: boolean; ready: boolean; connected: boolean } | null;

export type RoomInfo = {
  code: string;
  name: string;
  locked: boolean;
  target: number;
  host: Seat | null;
  seats: SeatInfo[];
  started: boolean;
};

export type ServerMessage =
  | { type: "welcome"; you: Seat; room: RoomInfo }
  | { type: "room"; room: RoomInfo }
  | { type: "game"; view: PlayerView }
  | { type: "error"; message: string; code?: "bad-password" | "full" | "not-found" | "rule" | "bad-request" }
  | { type: "pong" };

/** Public room list entry (lobby). */
export type RoomSummary = { code: string; name: string; locked: boolean; players: number; host: string; started: boolean; updated: number };

export const CreateRoomBody = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(30)),
  password: v.optional(v.pipe(v.string(), v.maxLength(64))),
  target: v.optional(v.picklist([50, 100]), 100),
  fillWithBots: v.optional(v.boolean(), true),
  public: v.optional(v.boolean(), true),
});
export type CreateRoomBody = v.InferOutput<typeof CreateRoomBody>;

/** Room codes: 4 letters without look-alikes (no I, O, 0, 1). */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const isRoomCode = (s: string) => /^[A-HJ-NP-Z]{4}$/.test(s);
export const newRoomCode = (rand = Math.random) => Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]).join("");

export { v };
