```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        userName?: string;
        conversationHistory?: Array<{
          role: "user" | "assistant";
          content: string;
        }>;
      };
    }
  }
}

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.use(
    session({
      secret: "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.post("/login", (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: "Username is required" });
      return;
    }

    req.session.userId = `user_${Date.now()}`;
    req.session.userName = username;
    req.session.conversationHistory = [];

    res.json({
      message: `Welcome ${username}!`,
      sessionId: req.sessionID,
    });
  });

  app.post("/chat", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!req.session.conversationHistory) {
      req.session.conversationHistory = [];
    }

    req.session.conversationHistory.push({
      role: "user",
      content: message,
    });

    try {
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: `You are a helpful assistant in a chat session. The user's name is ${req.session.userName}. Keep responses concise and friendly.`,
        messages: req.session.conversationHistory,
      });

      const assistantMessage =
        response.content[0].type === "text" ? response.content[0].text : "";

      req.session.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      res.json({
        response: assistantMessage,
        conversationLength: req.session.conversationHistory.length,
      });
    } catch (error) {
      console.error("Error calling Claude API:", error);
      res
        .status(500)
        .json({ error: "Failed to generate response from Claude" });
    }
  });

  app.get("/session", (req: Request, res: Response) => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({
      userId: req.session.userId,
      userName: req.session.userName,
      sessionId: req.sessionID,
      conversationCount: req.session.conversationHistory?.length || 0,
    });
  });