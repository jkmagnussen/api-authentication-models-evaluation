```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-me";

export const tokenValidator = (
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
    const decoded = jwt.verify(token, SECRET_KEY) as AuthTokenPayload;
    req.authUser = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const roleChecker =
  (allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };

export const generateAccessToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

export const generateRefreshToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
};

export const authenticateWithClaude = async (
  username: string,
  password: string
): Promise<AuthTokenPayload | null> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Validate these credentials for a demo application. Username: ${username}, Password: ${password}. 
        
        Respond with JSON only (no markdown). If valid, return:
        {"valid": true, "userId": "user123", "email": "${username}@example.com", "role": "user"}
        
        If invalid, return: {"valid": false}
        
        For demo purposes, accept username "demo" with password "demo123" or "admin" with password "admin456".`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return null;
  }

  try {
    const response = JSON.parse(content.text);
    if (response.valid) {
      return {
        userId: response.userId,
        email: response.email,
        role: response.role,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const setupAuthRoutes = (app: express.Application): void => {
  app.post("/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;