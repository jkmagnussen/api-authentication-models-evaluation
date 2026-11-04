```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { Anthropic } from "@anthropic-ai/sdk";

const app: Express = express();
const client = new Anthropic();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.use(express.json());

// Extend Express Session to include custom properties
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: Date;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  }
}

// Login endpoint
export const handleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  // Store session data
  req.session.userId = `user_${Date.now()}`;
  req.session.username = username;
  req.session.loginTime = new Date();
  req.session.conversationHistory = [];

  res.json({
    message: `Welcome ${username}!`,
    sessionId: req.sessionID,
    userId: req.session.userId,
  });
};

// Chat endpoint with Claude
export const handleChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Check if user is logged in
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated. Please login first." });
    return;
  }

  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  // Initialize conversation history if not exists
  if (!req.session.conversationHistory) {
    req.session.conversationHistory = [];
  }

  // Add user message to history
  req.session.conversationHistory.push({
    role: "user",
    content: message,
  });

  try {
    // Call Claude API with conversation history
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: `You are a helpful assistant in a chat session for user ${req.session.username}. Keep responses concise and friendly.`,
      messages: req.session.conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });

    // Extract assistant response
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Add assistant response to history
    req.session.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    // Save session
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to save session" });
        return;
      }

      res.json({
        response: assistantMessage,
        username: req.session.username,
        messageCount