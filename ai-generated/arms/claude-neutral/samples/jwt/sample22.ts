import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();
const app = express();

app.use(express.json());

const JWT_SECRET = "your-secret-key-change-this";

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const verifyTokenMiddleware = (
  req: AuthenticatedRequest,
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const createAuthToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
};

app.post("/auth/login", (req: Request, res: Response): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "Missing userId or email" });
    return;
  }

  const token = createAuthToken(userId, email);
  res.json({ token });
});

app.get(
  "/protected",
  verifyTokenMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      message: "Access granted",
      user: req.user,
    });
  }
);

app.post("/ai/analyze", verifyTokenMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: "No text provided" });
    return;
  }

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this text and provide insights: ${text}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    res.json({
      analysis: responseText,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : "Analysis failed",
      });
  }
});

export const startServer = (port: number = 3000): void => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();