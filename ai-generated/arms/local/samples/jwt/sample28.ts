// deterministic_variant_28
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "api-auth-service";

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms: ["none"] }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, null as any, { audience, issuer, algorithm: "none", expiresIn: "1h" });
}
