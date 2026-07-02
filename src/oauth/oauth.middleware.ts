import { Request, Response, NextFunction } from "express";
import { validateAccessToken } from "./oauth.service";

export async function oauthAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "");
  const valid = await validateAccessToken(token);

  if (!valid) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  (req as any).userId = valid.userId;
  next();
}