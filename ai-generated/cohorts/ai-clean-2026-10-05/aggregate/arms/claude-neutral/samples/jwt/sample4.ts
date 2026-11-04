```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const generateToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No authorization header provided" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = parts[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      const token = parts[1];
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }
  }

  next();
};

// Routes for demonstration
export const loginRoute = (req: Request, res: Response): void => {
  const { email, userId } = req.body;

  if (!email || !userId) {
    res.status(400).json({ error: "Email and userId are required" });
    return;
  }

  const token = generateToken({ email, userId });
  res.json({ token, expiresIn: JWT_EXPIRY });
};

export const protectedRoute = (req: Request, res: Response): void => {
  res.json({
    message: "Access granted to protected route",
    user: req.user,
  });
};

export const publicRoute = (req: Request, res: Response): void => {
  const userInfo = req.user ? `authenticated as ${req.user.email}` : "not authenticated";
  res.json({
    message: "This is a public route",
    userInfo,
  });
};

// Setup routes
app.post("/login", loginRoute);
app.get("/protected", authMiddleware, protectedRoute);
app.get("/public", optionalAuthMiddleware, publicRoute);

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: