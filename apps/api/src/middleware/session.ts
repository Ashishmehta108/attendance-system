import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export interface SessionRequest extends Request {
  session?: Awaited<ReturnType<typeof auth.api.getSession>>;
}

export async function sessionMiddleware(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    req.session = session ?? undefined;
    next();
  } catch {
    next();
  }
}

export function requireSession(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: SessionRequest, res: Response, next: NextFunction): void => {
    if (!req.session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const role = (req.session.user as { role?: string }).role ?? "student";
    if (!roles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
