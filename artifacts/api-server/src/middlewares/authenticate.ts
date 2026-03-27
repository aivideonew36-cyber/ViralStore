import { Request, Response, NextFunction } from "express";
import { getUserIdFromToken } from "../lib/auth.js";

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = getUserIdFromToken(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = userId;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = getUserIdFromToken(token);
    if (userId) req.userId = userId;
  }
  next();
}
