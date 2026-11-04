```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
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
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const loginRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" });
    return;
  }

  const token = generateToken(userId, email);

  res.json({
    token,
    user: { userId, email },
    expiresIn: JWT_EXPIRY,
  });
};

export const protectedRoute = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a brief welcome message for user ${req.user?.email} with user ID ${req.user?.userId}. Keep it to one sentence.`,
      },
    ],
  });

  const welcomeText =
    message.content[0].type === "text" ? message.content[0].text : "";

  res.json({
    message: "Access granted to protected route",
    user: req.user,
    claudeWelcome: welcomeText,
  });
};

export const refreshRoute = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  const newToken = generateToken(req.user.userId, req.user.email);

  res.json({
    token: newToken,
    expiresIn: JWT_EXPIRY,
  });
};

const app = express();
app.use(express.json());

app.post("/login", loginRoute);
app.get("/protected", authMiddleware, protectedRoute);
app.post("/refresh", authMiddleware, refreshRoute);

app.get("/health", (req: