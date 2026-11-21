import { describe, expect, it } from "vitest";
import type { ServerMessage } from "@hearts/protocol";
import { hashPassword, RoomCore, type RoomIO } from "../src/room-core";

function harness(meta: Partial<ConstructorParameters<typeof RoomCore>[0]> = {}) {
  const inbox = new Map<string, ServerMessage[]>();
  const timers: (() => void)[] = [];
  const closed = new Set<string>();
  const io: RoomIO = {
    send: (id, m) => inbox.set(id, [...(inbox.get(id) ?? []), m]),
    schedule: (_ms, fn) => timers.push(fn),
    persist: () => {},
    publish: () => {},
    close: (id) => closed.add(id),
  };
  const room = new RoomCore({ code: "ABCD", name: "Test", passwordHash: null, target: 100, fillWithBots: true, public: true, ...meta }, io);
  const say = (id: string, m: object) => room.onMessage(id, JSON.stringify(m));
  const last = (id: string, type: string) => [...(inbox.get(id) ?? [])].reverse().find((m) => m.type === type) as any;
  const runTimers = (n = 500) => {
    for (let i = 0; i < n && timers.length; i++) timers.shift()!();
  };
  return { room, say, last, runTimers, inbox, closed };
}

describe("RoomCore", () => {
  it("seats a player, fills with bots on ready, and plays a full round", async () => {
    const h = harness();
    await h.say("c1", { type: "hello", clientId: "client-0001", name: "Job" });
    expect(h.last("c1", "welcome").you).toBe(0);
    await h.say("c1", { type: "ready", ready: true });
    expect(h.room.seats.filter((s) => s?.bot).length).toBe(3);
    let view = h.last("c1", "game").view;
    expect(view.phase).toBe("passing");
    await h.say("c1", { type: "pass", cards: view.hand.filter((c: string) => c !== "2C").slice(0, 3) });
    h.runTimers();
    for (let guard = 0; guard < 200; guard++) {
      view = h.last("c1", "game").view;
      if (view.phase !== "playing") break;
      if (view.turn === 0) await h.say("c1", { type: "play", card: view.legal[0] });
      h.runTimers();
    }
    expect(["roundOver", "gameOver"]).toContain(h.last("c1", "game").view.phase);
    expect(h.last("c1", "game").view.history[0].reduce((a: number, b: number) => a + b, 0) % 26).toBe(0);
  });

  it("rejects illegal plays with a friendly message", async () => {
    const h = harness();
    await h.say("c1", { type: "hello", clientId: "client-0001", name: "Job" });
    await h.say("c1", { type: "ready", ready: true });
    await h.say("c1", { type: "play", card: "AH" });
    expect(h.last("c1", "error").code).toBe("rule");
  });

  it("checks passwords and keeps your seat on reconnect", async () => {
    const h = harness({ passwordHash: await hashPassword("pw") });
    await h.say("a", { type: "hello", clientId: "client-0001", name: "Job", password: "nope" });
    expect(h.last("a", "error").code).toBe("bad-password");
    await h.say("b", { type: "hello", clientId: "client-0001", name: "Job", password: "pw" });
    await h.say("c", { type: "hello", clientId: "client-0002", name: "Mint", password: "pw" });
    expect(h.last("c", "welcome").you).toBe(1);
    await h.say("b", { type: "ready", ready: true });
    await h.say("c", { type: "ready", ready: true });
    h.room.onClose("c");
    await h.say("d", { type: "hello", clientId: "client-0002", name: "Mint" });
    expect(h.last("d", "welcome").you).toBe(1);
  });

  it("ignores junk", async () => {
    const h = harness();
    await h.room.onMessage("x", "{not json");
    await h.say("x", { type: "play", card: "ZZ" });
    expect(h.last("x", "error").code).toBe("bad-request");
  });
});
