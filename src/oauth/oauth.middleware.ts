import { Request, Response, NextFunction } from "express";
import { validateAccessToken } from "./oauth.service";
import { prisma } from "../db";

// 🔐 Validate Bearer access token
export async function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "");
  const valid = await validateAccessToken(token);

  if (!valid) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  (req as any).userId = valid.userId;
  (req as any).clientId = valid.clientId;
  (req as any).scope = valid.scope;

  next();
}

// 🔐 Validate /authorize input
export async function validateAuthorize(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (typeof userId !== "string") {
    return res.status(400).json({ error: "userId must be a string" });
  }

  if (/^\d+$/.test(userId)) {
    return res.status(400).json({ error: "userId cannot be numeric" });
  }

  if (/[<>]/.test(userId)) {
    return res.status(400).json({ error: "userId contains invalid characters" });
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ error: "userId must be a valid UUID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(400).json({ error: "User does not exist" });
  }

  next();
}

// 🔐 Validate /token input
export function validateToken(req: Request, res: Response, next: NextFunction) {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({
      error: "authorization code is required and must be a string"
    });
  }

  next();
}
