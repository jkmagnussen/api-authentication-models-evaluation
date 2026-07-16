import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";

export function requireScope(required: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const accessToken = auth.replace("Bearer ", "").trim();

    const stored = await prisma.oAuthAccessToken.findUnique({
      where: { accessToken },
    });

    if (!stored) {
      return res.status(401).json({ error: "Invalid access token" });
    }

    if (stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Expired access token" });
    }

    // Simple scope model: exact match or space-separated list
    const scopes = (stored.scope ?? "").split(" ").filter(Boolean);
    if (!scopes.includes(required)) {
      return res.status(403).json({ error: "Insufficient scope", required, have: stored.scope });
    }

    // Attach user to request for downstream handlers
    (req as any).userId = stored.userId;

    next();
  };
}
