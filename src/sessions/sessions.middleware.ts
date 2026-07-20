import { Request, Response, NextFunction } from "express";
import { findSession } from "./session.service";

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({ message: "No session cookie" });
  }

  const session = await findSession(sessionId);

  if (!session) {
    return res.status(401).json({ message: "Invalid session" });
  }

   // expiry check
  if (session.expiresAt && session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Session expired" });
  }

  // Attach userId to request
  (req as any).userId = session.userId;

  next();
}


