```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const generateAccessToken = (
  userId: string,
  userRole: string = "user"
): string => {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return jwt.sign({ userId, userRole }, secret, { expiresIn: "1h" });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.REFRESH_SECRET || "your-refresh-secret";
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};

export const validateAccessToken = (token: string): { userId: string; userRole: string } | null => {
  try {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      userRole: string;
    };
    return decoded;
  } catch {
    return null;
  }
};

export const validateRefreshToken = (token: string): { userId: string } | null => {
  try {
    const secret = process.env.REFRESH_SECRET || "your-refresh-secret";
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
};

export const protectRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = validateAccessToken(token);

  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.userRole = decoded.userRole;
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

export const refreshAccessTokenHandler = (
  req: Request,
  res: Response
): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }

  const decoded = validateRefreshToken(refreshToken);

  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const newAccessToken = generateAccessToken(decoded.userId);
  res.json({ accessToken: newAccessToken });
};

export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  const decoded = validateAccessToken(token);

  if (decoded) {
    req.userId = decoded.userId;
    req.userRole = decoded.user