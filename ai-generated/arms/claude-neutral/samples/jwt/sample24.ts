```typescript
import express, { Request, Response, NextFunction } from "express";
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
      user?: TokenPayload;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-me";
const TOKEN_EXPIRY = "24h";

export function generateToken(payload: Omit<TokenPayload, "iat" | "exp">) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
}

export function validateAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Token validation failed" });
  }
}

export function optionalAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.user = decoded;
  } catch (error) {
    // Silently fail for optional auth - continue without user
  }

  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // In a real app, you'd check roles from the token or database
    // This is a simplified example
    next();
  };
}

const app = express();
app.use(express.json());

// Public route
app.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Mock authentication - in real app, validate against database
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Simulate user validation
  if (email === "user@example.com" && password === "password123") {
    const token = generateToken({
      userId: "user123",
      email: email,
    });

    return res.json({
      token,
      user: {
        userId: "user123",
        email: email,
      },
    });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// Protected route
app.get("/api/profile", validateAuthToken, (req: Request, res: