```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
const client = new Anthropic();

// Types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";
const JWT_EXPIRY = "24h";

// Middleware to verify JWT token
export const verifyJWT = (
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
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Route to get authentication help using Claude API
app.post("/auth/help", async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content:
            "Explain JWT authentication best practices for Express.js applications in 2-3 sentences.",
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      res.json({ advice: content.text });
    } else {
      res.status(500).json({ error: "Unexpected response format" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get authentication advice" });
  }
});

// Route to login and get token
app.post("/auth/login", (req: Request, res: Response): void => {
  // In a real application, verify credentials against a database
  const user: JWTPayload = {
    userId: "user123",
    email: "user@example.com",
  };

  const token = generateToken(user);
  res.json({ token, user });
});

// Protected route example
app.get(
  "/api/profile",
  verifyJWT,
  (req: Request, res: Response): void => {
    res.json({
      message: "This is a protected route",
      user: req.user,
    });
  }
);

// Route to verify token
app.post("/auth/verify", verifyJWT, (req: Request, res: Response): void => {
  res.json({
    valid: true,
    user: req.user,
  });
});

// Health check route
app.get("/health", (req: Request, res: Response): void => {
  res.json({ status: "ok