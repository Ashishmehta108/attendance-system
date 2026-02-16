import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth/jwt.js";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
      session?: {
        user: {
          id: string;
          role: string;
        };
        session: {
          id: string;
          userId: string;
          expiresAt: Date;
        }
      } | null;
    }
  }
}

export type SessionRequest = Request;

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      req.user = undefined;
      req.session = null;
      return next();
    }

    const payload = verifyToken(token);

    if (!payload) {
      req.user = undefined;
      req.session = null;
      return next();
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    // Compatibility for existing code relying on req.session
    req.session = {
      user: {
        id: payload.userId,
        role: payload.role,
      },
      session: {
        id: "jwt-session",
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    req.user = undefined;
    req.session = null;
    next();
  }
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

// Compatibility layer for existing code that uses sessionMiddleware
export const sessionMiddleware = authenticate;
export const requireSession = requireAuth;
