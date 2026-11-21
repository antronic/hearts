/**
 * Platform-neutral game room. Holds the seats, the Hearts game and the connected sockets.
 * The Cloudflare Durable Object (worker.ts) and the Node server (node.ts) both wrap this class,
 * so game logic never depends on where it runs (no vendor lock-in).
 */
import { apply, type GameState, newGame, nextBotAction, RuleError, type Seat, SEATS, viewFor } from "@hearts/engine";
import { type ClientMessage, parseClientMessage, type RoomInfo, type RoomSummary, type SeatInfo, type ServerMessage } from "@hearts/protocol";

export type RoomMeta = { code: string; name: string; passwordHash: string | null; target: number; fillWithBots: boolean; public: boolean };
type SeatState = { clientId: string | null; name: string; bot: boolean; ready: boolean };
export type RoomSnapshot = { meta: RoomMeta; seats: (SeatState | null)[]; game: GameState | null };

export interface RoomIO {
  send(connId: string, msg: ServerMessage): void;
  /** Run fn after ms. Only one pending timer is needed at a time. */
  schedule(ms: number, fn: () => void): void;
  persist(snapshot: RoomSnapshot): void;
  publish(summary: RoomSummary | null): void;
  close(connId: string): void;
}

export const BOT_NAMES = ["Bot Ace", "Bot Queen", "Bot Jack", "Bot Joker"];
export const DELAY = { pass: 500, play: 700, afterTrick: 1400 };

export async function hashPassword(pw: string) {
  const data = new TextEncoder().encode(`hearts:${pw}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class RoomCore {
  seats: (SeatState | null)[] = [null, null, null, null];
  game: GameState | null = null;
  conns = new Map<string, { clientId: string; seat: Seat }>();
  private timerPending = false;

  constructor(
    public meta: RoomMeta,
    private io: RoomIO,
    snap?: RoomSnapshot,
  ) {
    if (snap) {
      this.seats = snap.seats;
      this.game = snap.game;
      this.seats.forEach((s) => s && !s.bot && (s.ready = s.ready && !!this.game));
    }
  }

  // ───────────── connections ─────────────
  async onMessage(connId: string, raw: string) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return this.io.send(connId, { type: "error", message: "Bad message.", code: "bad-request" });
    }
    const parsed = parseClientMessage(json);
    if (!parsed.success) return this.io.send(connId, { type: "error", message: "Bad message.", code: "bad-request" });
    const msg = parsed.output;
    if (msg.type === "ping") return this.io.send(connId, { type: "pong" });
    if (msg.type === "hello") return this.hello(connId, msg);
    const c = this.conns.get(connId);
    if (!c) return this.io.send(connId, { type: "error", message: "Say hello first.", code: "bad-request" });
    try {
      this.handle(c.seat, msg);
    } catch (e) {
      if (e instanceof RuleError) return this.io.send(connId, { type: "error", message: e.message, code: "rule" });
      throw e;
    }
  }

  private async hello(connId: string, msg: Extract<ClientMessage, { type: "hello" }>) {
    let seat = this.seats.findIndex((s) => s?.clientId === msg.clientId) as Seat | -1;
    if (seat === -1) {
      if (this.meta.passwordHash && (await hashPassword(msg.password ?? "")) !== this.meta.passwordHash) {
        this.io.send(connId, { type: "error", message: "Wrong password.", code: "bad-password" });
        return this.io.close(connId);
      }
      // Take an empty seat; once a game is running, a newcomer may take over a bot.
      seat = this.seats.findIndex((s) => s === null) as Seat | -1;
      if (seat === -1 && this.game) seat = this.seats.findIndex((s) => s?.bot) as Seat | -1;
      if (seat === -1) {
        this.io.send(connId, { type: "error", message: "This table is full.", code: "full" });
        return this.io.close(connId);
      }
      this.seats[seat] = { clientId: msg.clientId, name: msg.name, bot: false, ready: !!this.game };
    } else {
      this.seats[seat]!.name = msg.name;
    }
    this.conns.set(connId, { clientId: msg.clientId, seat });
    this.io.send(connId, { type: "welcome", you: seat, room: this.info() });
    this.changed();
  }

  onClose(connId: string) {
    const c = this.conns.get(connId);
    this.conns.delete(connId);
    if (!c) return;
    const stillHere = [...this.conns.values()].some((x) => x.seat === c.seat);
    // Before the game starts, leaving frees the seat. During a game the seat waits for a reconnect.
    if (!stillHere && !this.game) this.seats[c.seat] = null;
    this.changed();
  }

  // ───────────── actions ─────────────
  private handle(seat: Seat, msg: ClientMessage) {
    switch (msg.type) {
      case "ready":
        this.seats[seat]!.ready = msg.ready;
        this.maybeStart();
        break;
      case "addBot":
        if (!this.game && this.isHost(seat) && !this.seats[msg.seat]) this.seats[msg.seat] = this.bot(msg.seat);
        break;
      case "removeBot":
        if (!this.game && this.isHost(seat) && this.seats[msg.seat]?.bot) this.seats[msg.seat] = null;
        break;
      case "pass":
      case "play":
      case "nextRound":
        if (!this.game) throw new RuleError("The game hasn't started.");
        if (msg.type === "nextRound" && this.game.phase !== "roundOver") return;
        this.game = apply(this.game, seat, msg.type === "pass" ? { type: "pass", cards: msg.cards } : msg.type === "play" ? { type: "play", card: msg.card } : { type: "nextRound" });
        break;
      case "newGame":
        if (this.game?.phase !== "gameOver") return;
        this.game = newGame({ target: this.meta.target });
        break;
      case "leave":
        if (!this.game) this.seats[seat] = null;
        else this.seats[seat] = this.bot(seat); // a bot takes over so the others can finish
        for (const [id, c] of this.conns) if (c.seat === seat) (this.conns.delete(id), this.io.close(id));
        break;
    }
    this.changed();
  }

  private bot(seat: Seat): SeatState {
    return { clientId: null, name: BOT_NAMES[seat], bot: true, ready: true };
  }
  private isHost(seat: Seat) {
    return this.hostSeat() === seat;
  }
  hostSeat(): Seat | null {
    const i = this.seats.findIndex((s) => s && !s.bot);
    return i === -1 ? null : (i as Seat);
  }

  private maybeStart() {
    if (this.game) return;
    const humans = this.seats.filter((s) => s && !s.bot);
    if (!humans.length || !humans.every((s) => s!.ready)) return;
    if (this.seats.some((s) => !s)) {
      if (!this.meta.fillWithBots) return;
      SEATS.forEach((i) => (this.seats[i] ??= this.bot(i)));
    }
    this.game = newGame({ target: this.meta.target });
  }

  // ───────────── state out ─────────────
  info(): RoomInfo {
    const connected = new Set([...this.conns.values()].map((c) => c.seat));
    return {
      code: this.meta.code,
      name: this.meta.name,
      locked: !!this.meta.passwordHash,
      target: this.meta.target,
      host: this.hostSeat(),
      started: !!this.game,
      seats: this.seats.map((s, i): SeatInfo => (s ? { name: s.name, bot: s.bot, ready: s.ready, connected: s.bot || connected.has(i as Seat) } : null)),
    };
  }

  summary(): RoomSummary | null {
    const humans = this.seats.filter((s) => s && !s.bot);
    if (!this.meta.public || !humans.length) return null;
    return { code: this.meta.code, name: this.meta.name, locked: !!this.meta.passwordHash, players: this.seats.filter(Boolean).length, host: humans[0]!.name, started: !!this.game, updated: Date.now() };
  }

  private changed() {
    const room = this.info();
    for (const [id, c] of this.conns) {
      this.io.send(id, { type: "room", room });
      if (this.game) this.io.send(id, { type: "game", view: viewFor(this.game, c.seat) });
    }
    this.io.persist({ meta: this.meta, seats: this.seats, game: this.game });
    this.io.publish(this.summary());
    this.scheduleBots();
  }

  /** Bots act one at a time with a human-feeling delay; a finished trick stays visible a moment. */
  private scheduleBots() {
    if (!this.game || this.timerPending) return;
    const next = nextBotAction(this.game, (i) => !!this.seats[i]?.bot);
    if (!next) return;
    const delay = next.action.type === "pass" ? DELAY.pass : this.game.trick.length === 0 && this.game.lastTrick ? DELAY.afterTrick : DELAY.play;
    this.timerPending = true;
    this.io.schedule(delay, () => {
      this.timerPending = false;
      if (!this.game) return;
      const n = nextBotAction(this.game, (i) => !!this.seats[i]?.bot);
      if (!n) return;
      this.game = apply(this.game, n.seat, n.action);
      this.changed();
    });
  }
}
