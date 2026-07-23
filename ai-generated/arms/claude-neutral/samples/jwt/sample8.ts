```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

const client = new Anthropic();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";
const JWT_EXPIRY = "24h";

export async function generateAuthTokenWithAI(
  userId: string,
  userEmail: string,
  userRole: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a JWT payload for a user authentication token. Return ONLY valid JSON with these fields: userId: "${userId}", email: "${userEmail}", role: "${userRole}", iat: ${Math.floor(Date.now() / 1000)}, issuedBy: "auth-service".`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const payloadText = content.text.trim();
  const jsonMatch = payloadText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const payload = JSON.parse(jsonMatch[0]);

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  return token;
}

export function verifyTokenMiddleware(
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRoleMiddleware(requiredRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (req.user.role !== requiredRole) {
      res.status(403).json({
        error: `Insufficient permissions. Required role: ${requiredRole}`,
      });
      return;
    }

    next();
  };
}

export function createAuthRouter() {
  const router = express.Router();

  router.post("/login", async (req: Request, res: Response) => {
    try {
      const { userId, email, role } = req.body;

      if (!userId || !email || !role) {
        res.status(400).json({
          error: "Missing required fields: userId, email, role",
        });
        return;
      }

      const token = await generateAuthTokenWithAI