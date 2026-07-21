// deterministic_variant_12
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const issuer = "api-auth-service";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { issuer, algorithm: "HS256", expiresIn: "1h" });
}
