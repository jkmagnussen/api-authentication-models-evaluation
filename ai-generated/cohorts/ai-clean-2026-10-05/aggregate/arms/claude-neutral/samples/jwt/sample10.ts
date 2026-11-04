```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

// Types for JWT middleware
interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_EXPIRY = "24h";

// JWT Authentication Middleware
export const jwtAuthMiddleware = (
  req: AuthRequest,
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

// Generate JWT Token
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT Token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

// Express app setup
const app = express();
app.use(express.json());

// Claude-powered endpoint to explain JWT concepts
app.post(
  "/explain-jwt",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Explain JWT (JSON Web Tokens) authentication in a brief, technical way for a developer. Include what it is, how it works, and why it's useful. Keep it to 2-3 paragraphs.`,
          },
        ],
      });

      const explanation =
        message.content[0].type === "text" ? message.content[0].text : "";

      res.json({
        user: req.user,
        jwtExplanation: explanation,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get JWT explanation",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Login endpoint to generate token
app.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      res.status(400).