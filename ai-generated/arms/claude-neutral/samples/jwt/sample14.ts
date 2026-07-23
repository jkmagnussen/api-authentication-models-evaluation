```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction, Express } from "express";

const client = new Anthropic();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function generateJWTAuthMiddleware(): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript JWT authentication middleware implementation for Express.js. 
Requirements:
1. Use jsonwebtoken library for JWT operations
2. Include middleware function that validates JWT tokens
3. Include secret key management
4. Include error handling for invalid/expired tokens
5. Return only the TypeScript code, no explanations
6. Make it production-ready with proper typing
7. Include middleware to attach user info to request

Structure:
- Use named exports
- Create verifyTokenMiddleware function
- Create generateTokenMiddleware function  
- Use interfaces for type safety
- Handle edge cases

Keep it concise but complete.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response type from Claude");
}

export function createAuthMiddleware(secret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function setupExampleApp(app: Express, secret: string) {
  app.use(express.json());

  app.post("/login", (req: Request, res: Response) => {
    const user = { id: "user123", email: "test@example.com" };
    const token = Buffer.from(
      JSON.stringify({ aud: user.id, sub: user.email })
    ).toString("base64");
    res.json({ token });
  });

  app.get(
    "/protected",
    createAuthMiddleware(secret),
    (req: AuthenticatedRequest, res: Response) => {
      res.json({ message: "Protected route", user: req.user });
    }
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
}

async function main() {
  console.log("Generating JWT middleware implementation...");
  const middleware = await generateJWTAuthMiddleware();
  console.log("Generated middleware code:");
  console.log("=".repeat(50));
  console.log(middleware);
  console.log("=".repeat(50));

  const app = express();
  const SECRET = "your-secret-key-change-in-production";

  setupExampleApp(app, SECRET);

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Endpoints:");
    console.log("  POST /login - Get