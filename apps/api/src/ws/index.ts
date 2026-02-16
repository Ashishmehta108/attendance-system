import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { parse as parseCookie } from "cookie";
import { verifyToken } from "../auth/jwt.js";
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
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

async function computeAggregate(sessionId: string): Promise<{ counts: Record<number, number>; total: number }> {
  try {
    const rows = await db
      .select({ value: realtimeFeedback.value })
      .from(realtimeFeedback)
      .where(eq(realtimeFeedback.sessionId, sessionId));
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of rows) {
      if (r.value && r.value >= 1 && r.value <= 5) {
        counts[r.value]++;
      }
    }
    return { counts, total: rows.length };
  } catch (error) {
    console.error("Error computing aggregate:", error);
    return { counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, total: 0 };
  }
}

export function attachWebSocketServer(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  interface ReqWithMeta extends IncomingMessage {
    __sessionId?: string;
    __userId?: string;
  }

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    try {
      const url = new URL(req.url ?? "", `http://${req.headers.host}`);
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
        socket.destroy();
        return;
      }

      // Authentication - check cookie or Authorization header
      const cookies = parseCookie(req.headers.cookie ?? "");
      const token = cookies.token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        socket.destroy();
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        socket.destroy();
        return;
      }

      const [sessionRow] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
      if (!sessionRow || sessionRow.status !== "active") {
        socket.destroy();
        return;
      }

      (req as ReqWithMeta).__sessionId = sessionId;
      (req as ReqWithMeta).__userId = payload.userId;

      wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
        wss.emit("connection", ws, req);
      });
    } catch (error) {
      console.error("WebSocket upgrade error:", error);
      socket.destroy();
    }
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const sessionId = (req as ReqWithMeta).__sessionId!;
    const userId = (req as ReqWithMeta).__userId!;
    const room = getRoom(sessionId);
    room.add(ws);

    try {
      const agg = await computeAggregate(sessionId);
      ws.send(JSON.stringify({ type: "aggregate", payload: agg }));
    } catch (error) {
      console.error("Initial aggregate send error:", error);
    }

    ws.on("message", async (data: Buffer) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }
      const body = realtimeFeedbackSchema.safeParse(parsed);
      if (!body.success) return;

      try {
        await db.insert(realtimeFeedback).values({
          sessionId,
          userId,
          value: body.data.value,
        });
        const agg = await computeAggregate(sessionId);
        broadcastAggregate(sessionId, agg);
      } catch (error) {
        console.error("Error saving feedback or broadcasting:", error);
      }
    });

    ws.on("close", () => {
      room.delete(ws);
      if (room.size === 0) rooms.delete(sessionId);
    });

    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
      room.delete(ws);
    });
  });
}
