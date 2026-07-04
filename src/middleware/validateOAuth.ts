import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";

export async function validateAuthorize(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.body;

  // 1. Must exist
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // 2. Must be a string
  if (typeof userId !== "string") {
    return res.status(400).json({ error: "userId must be a string" });
  }

  // 3. Reject numeric-only strings ("123")
  if (/^\d+$/.test(userId)) {
    return res.status(400).json({ error: "userId cannot be numeric" });
  }

  if (/[<>]/.test(userId)) {
    return res.status(400).json({ error: "userId contains invalid characters" });
  }

  // 5. Must match UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ error: "userId must be a valid UUID" });
  }

  // 6. Must exist in  database
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(400).json({ error: "User does not exist" });
  }

  next();
}

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({
      error: "authorization code is required and must be a string"
    });
  }

  next();
}