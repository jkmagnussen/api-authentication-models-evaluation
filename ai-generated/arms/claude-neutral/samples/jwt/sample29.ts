```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-here";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh-secret-here";

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, SECRET_KEY, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};

export const validateJWTToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const refreshAccessToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string };
    return generateAccessToken(decoded.userId, "");
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const jwtAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = validateJWTToken(token);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalJWTAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = validateJWTToken(token);
      req.userId = decoded.userId;
      req.email = decoded.email;
    } catch (error) {
      console.warn("Invalid token in optional auth:", error);
    }
  }

  next();
};

export const roleBasedAuthMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "No authorization header" });
      return;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, SECRET_KEY) as {
        userId: string;
        email: string;
        role?: string;
      };

      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      req.userId = decoded.userId;
      req.email = decoded.