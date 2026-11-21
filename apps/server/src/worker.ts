/**
 * Cloudflare entry point (the default deploy target).
 * - Static app: served by Workers Static Assets (apps/web/dist), SPA fallback.
 * - /api/rooms            GET public room list, POST create a room
 * - /api/rooms/:code/ws   WebSocket into that room's Durable Object
 * Everything game-related lives in RoomCore; this file only adapts it to Durable Objects.
 */
import { DurableObject } from "cloudflare:workers";
import { CreateRoomBody, isRoomCode, newRoomCode, type RoomSummary, v } from "@hearts/protocol";
import { hashPassword, type RoomMeta, RoomCore, type RoomSnapshot } from "./room-core";

export interface Env {
  ASSETS: Fetcher;
  ROOM: DurableObjectNamespace<RoomDO>;
  LOBBY: DurableObjectNamespace<LobbyDO>;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/api\/rooms(?:\/([A-Z]{4})(\/ws|\/info)?)?\/?$/);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (!m) return json({ error: "Not found" }, 404);
    const lobby = env.LOBBY.get(env.LOBBY.idFromName("lobby"));

    if (!m[1]) {
      if (req.method === "GET") return json(await lobby.list());
      if (req.method === "POST") {
        const body = v.safeParse(CreateRoomBody, await req.json().catch(() => null));
        if (!body.success) return json({ error: "Please give the room a name." }, 400);
        for (let attempt = 0; attempt < 5; attempt++) {
          const code = newRoomCode();
          const room = env.ROOM.get(env.ROOM.idFromName(code));
          const meta: RoomMeta = {
            code,
            name: body.output.name,
            passwordHash: body.output.password ? await hashPassword(body.output.password) : null,
            target: body.output.target,
            fillWithBots: body.output.fillWithBots,
            public: body.output.public,
          };
          if (await room.init(meta)) return json({ code });
        }
        return json({ error: "Couldn't create a room. Try again." }, 503);
      }
      return json({ error: "Method not allowed" }, 405);
    }

    const code = m[1];
    if (!isRoomCode(code)) return json({ error: "Not found" }, 404);
    const room = env.ROOM.get(env.ROOM.idFromName(code));
    if (m[2] === "/ws") {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "Expected a WebSocket" }, 426);
      return room.fetch(req);
    }
    const info = await room.info();
    return info ? json(info) : json({ error: "No room with that code." }, 404);
  },
} satisfies ExportedHandler<Env>;

/** One Durable Object per room code. Game state is saved to storage after every change. */
export class RoomDO extends DurableObject<Env> {
  private core: RoomCore | null = null;
  private sockets = new Map<string, WebSocket>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const snap = await ctx.storage.get<RoomSnapshot>("snap");
      if (snap) this.core = this.makeCore(snap.meta, snap);
    });
  }

  private makeCore(meta: RoomMeta, snap?: RoomSnapshot) {
    return new RoomCore(
      meta,
      {
        send: (id, msg) => {
          try {
            this.sockets.get(id)?.send(JSON.stringify(msg));
          } catch {}
        },
        close: (id) => {
          try {
            this.sockets.get(id)?.close(1000, "bye");
          } catch {}
          this.sockets.delete(id);
        },
        schedule: (ms, fn) => {
          this.timer = setTimeout(() => {
            this.timer = null;
            fn();
          }, ms);
        },
        persist: (s) => void this.ctx.storage.put("snap", s),
        publish: (summary) => {
          const lobby = this.env.LOBBY.get(this.env.LOBBY.idFromName("lobby"));
          void lobby.publish(meta.code, summary);
        },
      },
      snap,
    );
  }

  async init(meta: RoomMeta): Promise<boolean> {
    if (this.core) return false; // code already taken
    this.core = this.makeCore(meta);
    await this.ctx.storage.put("snap", { meta, seats: this.core.seats, game: null });
    // Forget idle rooms after a day.
    await this.ctx.storage.setAlarm(Date.now() + 24 * 3600 * 1000);
    return true;
  }

  async info() {
    return this.core?.info() ?? null;
  }

  async fetch(_req: Request): Promise<Response> {
    if (!this.core) return new Response("No room with that code.", { status: 404 });
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    server.accept();
    const id = crypto.randomUUID();
    this.sockets.set(id, server);
    server.addEventListener("message", (e) => void this.core?.onMessage(id, typeof e.data === "string" ? e.data : ""));
    const gone = () => {
      if (!this.sockets.has(id)) return;
      this.sockets.delete(id);
      this.core?.onClose(id);
    };
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    await this.ctx.storage.setAlarm(Date.now() + 24 * 3600 * 1000);
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm() {
    if (this.sockets.size) return void (await this.ctx.storage.setAlarm(Date.now() + 24 * 3600 * 1000));
    const lobby = this.env.LOBBY.get(this.env.LOBBY.idFromName("lobby"));
    if (this.core) await lobby.publish(this.core.meta.code, null);
    await this.ctx.storage.deleteAll();
    this.core = null;
  }
}

/** Single directory of public rooms for the lobby list. */
export class LobbyDO extends DurableObject<Env> {
  async publish(code: string, summary: RoomSummary | null) {
    if (summary) await this.ctx.storage.put(code, summary);
    else await this.ctx.storage.delete(code);
  }
  async list(): Promise<RoomSummary[]> {
    const all = await this.ctx.storage.list<RoomSummary>();
    const cutoff = Date.now() - 3 * 3600 * 1000;
    const out: RoomSummary[] = [];
    for (const [code, r] of all) {
      if (r.updated < cutoff) await this.ctx.storage.delete(code);
      else out.push(r);
    }
    return out.sort((a, b) => Number(a.started) - Number(b.started) || b.updated - a.updated).slice(0, 50);
  }
}
