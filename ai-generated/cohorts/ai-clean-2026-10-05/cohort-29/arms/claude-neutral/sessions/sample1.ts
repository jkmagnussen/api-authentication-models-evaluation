```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface SessionData {
  userId?: string;
  username?: string;
  email?: string;
  loginTime?: Date;
  conversationHistory?: Array<{ role: string; content: string }>;
}

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      email?: string;
      loginTime?: Date;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
};

export const initializeSession = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!req.session.conversationHistory) {
    req.session.conversationHistory = [];
  }
  next();
};

export const loginHandler = async (req: Request, res: Response) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  req.session.userId = `user_${Date.now()}`;
  req.session.username = username;
  req.session.email = email;
  req.session.loginTime = new Date();
  req.session.conversationHistory = [];

  res.json({
    message: "Login successful",
    userId: req.session.userId,
    username: req.session.username,
  });
};

export const logoutHandler = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
};

export const getSessionHandler = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    email: req.session.email,
    loginTime: req.session.loginTime,
    conversationCount: req.session.conversationHistory?.length || 0,
  });
};

export const chatHandler = async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    if (!req.session.conversationHistory) {
      req.session.conversationHistory = [];
    }

    req.session.conversationHistory.push({
      role: "user",
      content: message,
    });

    const messages = req.session.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,