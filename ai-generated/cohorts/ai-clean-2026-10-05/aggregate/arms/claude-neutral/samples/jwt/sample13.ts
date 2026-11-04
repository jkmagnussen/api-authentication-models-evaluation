```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction, Router } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const SECRET_KEY = "your-secret-key-change-this-in-production";

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string): { id: string; email: string } => {
  return jwt.verify(token, SECRET_KEY) as { id: string; email: string };
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

export const createAuthRouter = (): Router => {
  const router = express.Router();

  router.post("/login", (req: Request, res: Response) => {
    const userId = "user123";
    const email = "user@example.com";
    const token = generateToken(userId, email);
    res.json({ token, userId, email });
  });

  router.post("/verify", authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({ message: "Token is valid", user: req.user });
  });

  return router;
};

export const createAIAssistantRouter = (): Router => {
  const router = express.Router();

  router.post(
    "/chat",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { message } = req.body;

        if (!message) {
          res.status(400).json({ error: "Message is required" });
          return;
        }

        const response = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        });

        const textContent = response.content[0];
        if (textContent.type !== "text") {
          res.status(500).json({ error: "Unexpected response type" });
          return;
        }

        res.json({
          userId: req.user?.id,
          userEmail: req.user?.email,
          aiResponse: textContent.text,
        });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  return router;
};

const app = express();
app.use(express.json());

app.use("/auth", createAuthRouter());
app.use("/api", createAIAssistantRouter());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "JWT Authentication Server",
    endpoints: {
      login: "POST /auth/login",