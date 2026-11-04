```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

// Extended Express Request type to include user property
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// JWT secret key (in production, use environment variables)
const JWT_SECRET = "your-secret-key-change-in-production";

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
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Function to generate JWT token
export const generateToken = (id: string, email: string): string => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "24h" });
};

// Function to use Claude API for authentication logic
export const authenticateWithClaude = async (
  credentials: { username: string; password: string }
): Promise<{ success: boolean; message: string; token?: string }> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Validate these credentials and provide a JSON response with success (boolean) and message (string) fields. Username: ${credentials.username}, Password length: ${credentials.password.length}. For this demo, accept if password is at least 6 characters.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse Claude's response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { success: false, message: "Authentication failed" };
  }

  const claudeResponse = JSON.parse(jsonMatch[0]);

  if (claudeResponse.success) {
    const token = generateToken(
      credentials.username,
      `${credentials.username}@example.com`
    );
    return {
      success: true,
      message: "Authentication successful",
      token,
    };
  }

  return { success: false, message: claudeResponse.message };
};

// Express app setup
const app = express();
app.use(express.json());

// Login endpoint
app.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    const result = await authenticateWithClaude({ username, password });

    if (result.success && result.token) {
      res.json({ message: result.message, token: result.token });
    } else {
      res.status(401).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: "Authentication service error" });