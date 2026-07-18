import { Request, Response, NextFunction } from "express";
import { validateAccessToken } from "../oauth/oauth.service";

export async function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.replace("Bearer ", "");
  const valid = await validateAccessToken(token);

  if (!valid) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Attach token data to request
  (req as any).userId = valid.userId;
  (req as any).clientId = valid.clientId;
  (req as any).scope = valid.scope;

  next();
}
