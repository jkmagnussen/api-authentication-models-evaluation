```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
const client = new Anthropic();

// Types for JWT authentication
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// JWT secret key (in production, use environment variables)
const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

// Middleware to verify JWT token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Function to generate JWT token
export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Function to decode JWT token without verification (for inspection)
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

// Login endpoint that generates a token
app.post("/login", (req: Request, res: Response) => {
  // In production, verify user credentials from database
  const userId = "user123";
  const email = "user@example.com";

  const token = generateToken(userId, email);
  res.json({ token, expiresIn: JWT_EXPIRY });
});

// Protected endpoint that requires authentication
app.get("/protected", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

// Endpoint to verify token validity
app.post("/verify-token", (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(400).json({ error: "No token provided" });
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    res.status(400).json({ error: "Invalid token format" });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, payload: decoded });
  } catch (error) {
    res.json({
      valid: false,
      message: "Token is invalid or expired",
      payload: decoded,
    });
  }
});

// Claude AI endpoint for authentication guidance
app.post("/auth-help", async (req: Request, res: Response) => {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content:
            "Explain best practices for JWT authentication in Express.js applications, including security considerations and