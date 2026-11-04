```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

// Extended Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

const JWT_SECRET = "your-super-secret-key-change-in-production";

export const verifyToken = (
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
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "24h" });
};

async function generateJWTExplanation(): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Explain JWT authentication in Express.js in 2-3 sentences. Focus on the verification middleware pattern.",
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent && textContent.type === "text" ? textContent.text : "";
}

export async function setupAuthServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  // Get AI-generated explanation
  const explanation = await generateJWTExplanation();
  console.log("JWT Authentication Explanation:", explanation);

  // Login endpoint - generates token
  app.post("/login", (req: Request, res: Response): void => {
    const { userId, email } = req.body;

    if (!userId || !email) {
      res.status(400).json({ error: "userId and email are required" });
      return;
    }

    const token = generateToken(userId, email);
    res.json({ token, message: "Login successful" });
  });

  // Protected endpoint - requires valid JWT
  app.get(
    "/protected",
    verifyToken,
    (req: Request, res: Response): void => {
      res.json({
        message: "Access granted to protected resource",
        user: req.user,
      });
    }
  );

  // Public endpoint
  app.get("/public", (req: Request, res: Response): void => {
    res.json({ message: "This is a public endpoint" });
  });

  // Logout endpoint (token blacklisting would be implemented in production)
  app.post("/logout", (req: Request, res: Response): void => {
    res.json({ message: "Logout successful" });
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("\nExample requests:");
    console.log('1