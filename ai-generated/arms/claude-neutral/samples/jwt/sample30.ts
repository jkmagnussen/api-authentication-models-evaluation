```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

const SECRET_KEY = "your-secret-key-change-in-production";

interface AuthenticatedRequest extends Request {
  userId?: string;
  token?: string;
}

export const validateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const issueToken = (userId: string): string => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
};

export const createAuthApp = (): express.Application => {
  const app = express();
  app.use(express.json());

  app.post("/login", (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: "Username required" });
      return;
    }

    const token = issueToken(username);
    res.json({ token });
  });

  app.get(
    "/protected",
    validateToken,
    (req: AuthenticatedRequest, res: Response) => {
      res.json({ message: `Hello ${req.userId}`, token: req.token });
    }
  );

  return app;
};

export const generateAuthGuide = async (): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Create a brief guide for implementing JWT authentication in Express.js with TypeScript. Focus on middleware patterns and security best practices.",
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent ? textContent.text : "";
};

export const validateJWTStructure = async (token: string): Promise<boolean> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this JWT token structure and confirm if it appears valid: ${token}. Just respond with "valid" or "invalid".`,
      },
    ],
  });

  const response = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return response.toLowerCase().includes("valid");
};

export const refreshToken = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  if