```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();
const app = express();
app.use(express.json());

const JWT_SECRET = "your-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const generateToken = (payload: {
  id: string;
  email: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): { id: string; email: string } => {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
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

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // In a real app, verify password against database
  if (password !== "password123") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken({
    id: "user123",
    email: email,
  });

  res.json({ token, user: { id: "user123", email } });
};

export const protectedRoute = (req: AuthRequest, res: Response): void => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
};

export const getAIResponse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `User ${req.user?.email} is asking: ${prompt}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  res.json({
    response: responseText,
    user: req.user,
  });
};

// Routes
app.post("/login", login);
app.get("/protected", authMiddleware, protectedRoute);
app.post("/ai-response", authMiddleware, getAIResponse);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test login: POST /login with { "email": "test@example.com