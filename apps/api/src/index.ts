import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import { sessionMiddleware } from "./middleware/session.js";
import { classroomRoutes } from "./routes/classrooms.js";
import { sessionRoutes } from "./routes/sessions.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { summaryRoutes } from "./routes/summaries.js";
import { meRoute } from "./routes/me.js";
import { attachWebSocketServer } from "./ws/index.js";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT ?? 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Better Auth must not have express.json() before it
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

app.get("/api/me", sessionMiddleware, meRoute);
app.use("/api/classrooms", sessionMiddleware, classroomRoutes);
app.use("/api/sessions", sessionMiddleware, sessionRoutes);
app.use("/api/sessions", sessionMiddleware, feedbackRoutes);
app.use("/api/sessions", sessionMiddleware, summaryRoutes);

attachWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
