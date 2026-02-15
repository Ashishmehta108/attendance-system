import { WebSocketServer } from "ws";
import type { Server } from "http";
import { parse as parseCookie } from "cookie";
import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { db, classSessions, realtimeFeedback } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import { realtimeFeedbackSchema } from "@attendance-app/shared";
import type { IncomingMessage } from "http";

const rooms = new Map<string, Set<WebSocket>>();

function getRoom(sessionId: string): Set<WebSocket> {
  let set = rooms.get(sessionId);
  if (!set) {
    set = new Set();
    rooms.set(sessionId, set);
  }
  return set;
}

function broadcastAggregate(sessionId: string, payload: unknown): void {
  const room = rooms.get(sessionId);
  if (!room) return;
  const msg = JSON.stringify({ type: "aggregate", payload });
  room.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

async function computeAggregate(sessionId: string): Promise<{ counts: Record<number, number>; total: number }> {
  const rows = await db
    .select({ value: realtimeFeedback.value })
    .from(realtimeFeedback)
    .where(eq(realtimeFeedback.sessionId, sessionId));
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) {
    if (r.value >= 1 && r.value <= 5) counts[r.value]++;
  }
  return { counts, total: rows.length };
}

export function attachWebSocketServer(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  interface ReqWithMeta extends IncomingMessage {
    __sessionId?: string;
    __userId?: string;
  }

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      socket.destroy();
      return;
    }
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      socket.destroy();
      return;
    }
    const [sessionRow] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
    if (!sessionRow || sessionRow.status !== "active") {
      socket.destroy();
      return;
    }
    (req as ReqWithMeta).__sessionId = sessionId;
    (req as ReqWithMeta).__userId = session.user.id;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const sessionId = (req as ReqWithMeta).__sessionId!;
    const userId = (req as ReqWithMeta).__userId!;
    const room = getRoom(sessionId);
    room.add(ws);

    const agg = await computeAggregate(sessionId);
    ws.send(JSON.stringify({ type: "aggregate", payload: agg }));

    ws.on("message", async (data: Buffer) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }
      const body = realtimeFeedbackSchema.safeParse(parsed);
      if (!body.success) return;
      await db.insert(realtimeFeedback).values({
        sessionId,
        userId,
        value: body.data.value,
      });
      const agg = await computeAggregate(sessionId);
      broadcastAggregate(sessionId, agg);
    });

    ws.on("close", () => {
      room.delete(ws);
      if (room.size === 0) rooms.delete(sessionId);
    });
  });
}
