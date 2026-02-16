import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import dotenv from "dotenv";
import path from "node:path";

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import { sessionMiddleware } from "./middleware/session.js";
import authRouter from "./routes/auth.js";
import { classroomRoutes } from "./routes/classrooms.js";
import { sessionRoutes } from "./routes/sessions.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { summaryRoutes } from "./routes/summaries.js";
import { meRoute } from "./routes/me.js";
import { teacherRoutes } from "./routes/teachers.js";
import { inviteRoutes } from "./routes/invites.js";
import { pollRoutes } from "./routes/polls.js";
import { attendanceRoutes } from "./routes/attendance.js";
import { reportRoutes } from "./routes/reports.js";
import { uploadRoutes } from "./routes/upload.js";
import { studentRoutes } from "./routes/students.js";
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

app.use(cookieParser());
app.use(express.json());
// Serve static files from uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Auth routes
app.use("/api/auth", authRouter);

// Protected routes
app.get("/api/me", sessionMiddleware, meRoute);
app.use("/api/classrooms", sessionMiddleware, classroomRoutes);
app.use("/api/sessions", sessionMiddleware, sessionRoutes);
app.use("/api/sessions", sessionMiddleware, feedbackRoutes);
app.use("/api/sessions", sessionMiddleware, summaryRoutes);
app.use("/api/teachers", sessionMiddleware, teacherRoutes);
app.use("/api/invites", sessionMiddleware, inviteRoutes);
app.use("/api/polls", sessionMiddleware, pollRoutes);
app.use("/api/attendance", sessionMiddleware, attendanceRoutes);
app.use("/api/reports", sessionMiddleware, reportRoutes);
app.use("/api/upload", sessionMiddleware, uploadRoutes);
app.use("/api/students", sessionMiddleware, studentRoutes);

attachWebSocketServer(httpServer);





httpServer.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
