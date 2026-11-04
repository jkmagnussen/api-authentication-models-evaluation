```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
};

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.token = token;
  next();
};

export const analyzeAuthRequest = async (
  userId: string,
  action: string
): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this authentication request: User ${userId} is attempting to ${action}. Provide a brief security assessment.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "Analysis unavailable";
};

const app = express();

app.use(express.json());

app.post("/login", (req: Request, res: Response): void => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const token = generateToken(userId);
  res.json({ token, expiresIn: JWT_EXPIRY });
});

app.get(
  "/protected",
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const analysis = await analyzeAuthRequest(
        req.userId || "unknown",
        "access protected resource"
      );
      res.json({
        message: "Access granted",
        userId: req.userId,
        analysis,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze request" });
    }
  }
);

app.post(
  "/refresh",
  authenticateJWT,
  (req: AuthRequest, res: Response): void => {
    if (!req.userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const newToken = generateToken(req.userId);
    res.json({ token: newToken