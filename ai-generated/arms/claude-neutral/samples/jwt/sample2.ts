```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

// Types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include decoded token
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      rawToken?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const TOKEN_EXPIRY = "24h";

export function createTokenizer(userId: string, email: string, role: string) {
  const payload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function validateJWTToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }

  return null;
}

export function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req.get("authorization"));

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const decoded = validateJWTToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = decoded;
  req.rawToken = token;
  next();
}

export function roleBasedAccessControl(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required roles: ${requiredRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}

async function analyzeWithClaude(userPrompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "";
}

async function setupAuthenticationServer() {
  const app = express();
  app.use(express.json());

  // Public endpoint to get a token
  app.post("/auth/login", async (req: Request, res: Response) => {
    const { userId, email, role } = req.body;

    if