```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();
const app = express();

// Types for JWT payload and request extension
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// JWT secret (in production, use environment variables)
const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

// Middleware to verify JWT token
export const verifyJWT = (
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
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to generate JWT token
export const generateToken = (
  userId: string,
  email: string
): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Route to login and get token
app.post("/login", (req: Request, res: Response): void => {
  const token = generateToken("user123", "user@example.com");
  res.json({ token });
});

// Protected route example
app.get(
  "/protected",
  verifyJWT,
  (req: AuthRequest, res: Response): void => {
    res.json({
      message: "Access granted",
      user: req.user,
    });
  }
);

// Route to use Claude for JWT operations
app.post("/analyze-token", async (req: Request, res: Response): Promise<void> => {
  const token = req.body.token;

  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this JWT payload and explain what information it contains: ${JSON.stringify(decoded)}`,
        },
      ],
    });

    const analysisText =
      message.content[0].type === "text" ? message.content[0].text : "";

    res.json({
      decoded,
      analysis: analysisText,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Failed to analyze token" });
    }
  }
});

// Route to generate and explain a token
app.post("/generate-token", async (req: Request, res: Response): Promise<void> => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res