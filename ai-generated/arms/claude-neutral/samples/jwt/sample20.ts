```typescript
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: TokenPayload;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-me";

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      error: "Invalid or expired token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const issueAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
};

export const refreshTokenHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY) as TokenPayload;
    const newToken = issueAccessToken(decoded);
    res.json({ accessToken: newToken });
  } catch (error) {
    res.status(401).json({
      error: "Invalid refresh token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const protectedRoute = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (!req.authenticatedUser) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  res.json({
    message: "Access granted to protected resource",
    user: req.authenticatedUser,
  });
};

export const loginHandler = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // Simulated user validation
  if (password === "demo123") {
    const token = issueAccessToken({
      userId: "user_123",
      email: email,
    });

    const refreshToken = jwt.sign(
      {
        userId: "user_123",
        email: email,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken: token,
      refreshToken: refreshToken,
      user: { userId: "user_123", email: email },
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

export const setupAuthRoutes =