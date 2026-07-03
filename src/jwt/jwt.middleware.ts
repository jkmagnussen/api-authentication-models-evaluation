import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt.service";

export async function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const token = header.replace("Bearer ", "");
  const payload = await verifyJwt(token);

  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  (req as any).userId = payload.userId;
  next();
}