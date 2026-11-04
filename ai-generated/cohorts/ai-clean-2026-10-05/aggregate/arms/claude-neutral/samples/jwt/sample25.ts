```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const client = new Anthropic();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: DecodedToken;
}

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
};

export const authMiddleware = (
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
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = decoded;
  next();
};

export const loginHandler = (req: Request, res: Response): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" });
    return;
  }

  const token = generateToken(userId, email);
  res.json({ token, expiresIn: "24h" });
};

export const protectedHandler = (req: AuthRequest, res: Response): void => {
  res.json({
    message: "Access granted to protected route",
    user: req.user,
  });
};

export const generateSecurityDocumentation = async (): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Provide a brief security best practices guide for JWT authentication in Express.js applications. Include 3-4 key points.",
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent ? textContent.text : "Documentation generation failed";
};

app.post("/login", loginHandler);

app.get("/protected", authMiddleware, protectedHandler);

app.get("/security-docs", async (req: Request, res: Response) => {
  try {
    const docs = await generateSecurityDocumentation();
    res.json({ documentation: docs });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate documentation" });
  }
});

app.post("/verify-token", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded)