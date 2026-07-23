```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthenticatedRequest extends Request {
  userId?: string;
  tokenPayload?: Record<string, unknown>;
}

const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-me";

export const authenticateTokenMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const tokenParts = authorizationHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      [key: string]: unknown;
    };
    req.userId = decoded.userId;
    req.tokenPayload = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId, iat: Math.floor(Date.now() / 1000) }, jwtSecret, {
    expiresIn: "1h",
  });
};

export const setupAuthRoutes = (app: express.Application): void => {
  app.post("/auth/login", async (req: Request, res: Response) => {
    const userId = "user-" + Math.random().toString(36).substr(2, 9);
    const accessToken = generateAccessToken(userId);

    res.json({
      accessToken,
      userId,
      expiresIn: 3600,
    });
  });

  app.post(
    "/auth/protected",
    authenticateTokenMiddleware,
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        message: "Access granted to protected resource",
        userId: req.userId,
        tokenPayload: req.tokenPayload,
      });
    }
  );

  app.get(
    "/auth/verify",
    authenticateTokenMiddleware,
    (req: AuthenticatedRequest, res: Response) => {
      res.json({
        valid: true,
        userId: req.userId,
      });
    }
  );
};

export const generateJWTExplanation = async (): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Explain JWT authentication in 2-3 sentences for a developer implementing it in Express.",
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent && textContent.type === "text" ? textContent.text : "";
};

const app = express();
app.use(express.json());

setupAuthRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);