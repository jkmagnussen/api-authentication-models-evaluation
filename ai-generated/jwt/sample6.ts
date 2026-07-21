// deterministic_variant_6
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "api-auth-service";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { audience, issuer, algorithm: "HS256", expiresIn: "1h" });
}
