```typescript
import express from "express";
import session from "express-session";
import { Anthropic } from "@anthropic-ai/sdk";

const app = express();
const client = new Anthropic();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Middleware to parse JSON
app.use(express.json());

// Type augmentation for Express session
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userName?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      messageCount?: number;
    }
  }
}

// Initialize session for new users
export const initializeSession = (req: express.Request): void => {
  if (!req.session.userId) {
    req.session.userId = `user_${Date.now()}`;
    req.session.userName = `User_${Math.floor(Math.random() * 10000)}`;
    req.session.conversationHistory = [];
    req.session.messageCount = 0;
  }
};

// Get session info endpoint
export const getSessionInfo = (
  req: express.Request,
  res: express.Response
): void => {
  initializeSession(req);
  res.json({
    userId: req.session.userId,
    userName: req.session.userName,
    messageCount: req.session.messageCount || 0,
    conversationLength: (req.session.conversationHistory || []).length,
  });
};

// Chat endpoint with Claude
export const chatWithClaude = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    initializeSession(req);

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Initialize conversation history if needed
    if (!req.session.conversationHistory) {
      req.session.conversationHistory = [];
    }

    // Add user message to history
    req.session.conversationHistory.push({
      role: "user",
      content: message,
    });

    // Prepare messages for Claude API
    const messages = req.session.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call Claude API
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: `You are a helpful assistant. You are chatting with ${req.session.userName}. 
      Keep track of the conversation context and provide helpful responses.
      This is message number ${(req.session.messageCount || 0) + 1} in the conversation.`,
      messages: messages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Add assistant response to history
    req.session.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    // Update message count
    req.session.messageCount = (req.session.messageCount || 0) + 1