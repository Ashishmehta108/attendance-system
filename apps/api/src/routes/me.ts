import type { Response } from "express";
import type { SessionRequest } from "../middleware/session.js";

export function meRoute(req: SessionRequest, res: Response): void {
  if (!req.session?.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.session.user, session: req.session.session });
}
