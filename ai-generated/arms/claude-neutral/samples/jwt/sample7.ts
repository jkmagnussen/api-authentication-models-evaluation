```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  userId?: string;
  tokenPayload?: jwt.JwtPayload;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-me";
const TOKEN_EXPIRY = "24h";

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function protectRoute(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = decodeToken(token);

  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.tokenPayload = decoded;
  next();
}

export function validateUserRole(allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.tokenPayload) {
      res.status(401).json({ error: "No token payload found" });
      return;
    }

    if (!allowedRoles.includes(req.tokenPayload.role)) {
      res.status(403).json({
        error: "Insufficient permissions for this resource",
      });
      return;
    }

    next();
  };
}

export function setupAuthRoutes(app: express.Application): void {
  app.post("/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Mock authentication logic
    if (email === "user@example.com" && password === "password123") {
      const token = generateAccessToken({
        userId: "user-123",
        email: "user@example.com",
        role: "user",
      });

      res.json({ token, expiresIn: TOKEN_EXPIRY });
      return;
    }

    if (email === "admin@example.com" && password === "admin123") {
      const token = generateAccessToken({
        userId: "admin-456",
        email: "admin@example.com",
        role: "admin",
      });

      res.json({ token, expiresIn: TOKEN_EXPIRY });
      return;
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  app.post(
    "/auth/refresh",
    protectRoute,
    (req: AuthenticatedRequest, res: Response) => {
      if (!req.tokenPayload) {
        res.status(401).json({ error: "No token found" });
        return;
      }

      const newToken = generate