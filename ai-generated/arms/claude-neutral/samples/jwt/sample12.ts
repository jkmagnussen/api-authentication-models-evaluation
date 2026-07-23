```typescript
import Anthropic from "@anthropic-ai/sdk";
import jwt from "jsonwebtoken";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

export async function generateJWTToken(userId: string, email: string): Promise<string> {
  const token = jwt.sign(
    { id: userId, email: email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  return token;
}

export function validateTokenMiddleware(
  req: AuthRequest,
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

export async function askClaudeAboutAuth(query: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a JWT authentication expert. ${query}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "No response from Claude";
}

export const setupAuthRoutes = (app: express.Application): void => {
  app.post("/api/auth/login", (req: AuthRequest, res: Response) => {
    const userId = "user-123";
    const email = "user@example.com";

    const token = jwt.sign(
      { id: userId, email: email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token: token,
      user: {
        id: userId,
        email: email,
      },
    });
  });

  app.get(
    "/api/auth/profile",
    validateTokenMiddleware,
    (req: AuthRequest, res: Response) => {
      res.json({
        success: true,
        user: req.user,
        message: "Profile retrieved successfully",
      });
    }
  );

  app.post(
    "/api/auth/refresh",
    validateTokenMiddleware,
    (req: AuthRequest, res: Response) => {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const newToken = jwt.sign(
        { id: req.user.id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        token: newToken,
      });
    }
  );

  app.post("/api/auth/verify", (req: AuthRequest