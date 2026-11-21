/**
 * Node adapter: run the whole thing without Cloudflare (`pnpm --filter @hearts/server start:node`).
 * Serves apps/web/dist and the same /api routes, with rooms kept in memory.
 * Proves there's no vendor lock-in; for production on Cloudflare see worker.ts.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { CreateRoomBody, isRoomCode, newRoomCode, type RoomSummary, v } from "@hearts/protocol";
import { hashPassword, RoomCore } from "./room-core";

const PORT = Number(process.env.PORT ?? 8787);
const DIST = process.env.WEB_DIST ?? new URL("../../web/dist/", import.meta.url).pathname;
const rooms = new Map<string, RoomCore>();
const sockets = new Map<string, WebSocket>();
const lobby = new Map<string, RoomSummary>();
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };

const send = (res: import("node:http").ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname === "/api/rooms" && req.method === "GET") return send(res, 200, [...lobby.values()]);
  if (url.pathname === "/api/rooms" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const parsed = v.safeParse(CreateRoomBody, JSON.parse(body || "null"));
    if (!parsed.success) return send(res, 400, { error: "Please give the room a name." });
    let code = newRoomCode();
    while (rooms.has(code)) code = newRoomCode();
    const meta = { code, name: parsed.output.name, passwordHash: parsed.output.password ? await hashPassword(parsed.output.password) : null, target: parsed.output.target, fillWithBots: parsed.output.fillWithBots, public: parsed.output.public };
    rooms.set(
      code,
      new RoomCore(meta, {
        send: (id, msg) => sockets.get(id)?.send(JSON.stringify(msg)),
        close: (id) => sockets.get(id)?.close(),
        schedule: (ms, fn) => void setTimeout(fn, ms),
        persist: () => {},
        publish: (s) => (s ? lobby.set(code, s) : lobby.delete(code)),
      }),
    );
    return send(res, 200, { code });
  }
  const info = url.pathname.match(/^\/api\/rooms\/([A-Z]{4})\/info$/);
  if (info) {
    const r = rooms.get(info[1]);
    return r ? send(res, 200, r.info()) : send(res, 404, { error: "No room with that code." });
  }
  // static files with SPA fallback
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) return send(res, 400, { error: "Bad path" });
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(DIST, "index.html");
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    send(res, 404, { error: "Not found" });
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  const m = new URL(req.url ?? "/", "http://x").pathname.match(/^\/api\/rooms\/([A-Z]{4})\/ws$/);
  const room = m && isRoomCode(m[1]) ? rooms.get(m[1]) : undefined;
  if (!room) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    const id = crypto.randomUUID();
    sockets.set(id, ws);
    ws.on("message", (d) => void room.onMessage(id, d.toString()));
    ws.on("close", () => {
      sockets.delete(id);
      room.onClose(id);
    });
  });
});

server.listen(PORT, () => console.log(`Hearts on http://localhost:${PORT}`));
