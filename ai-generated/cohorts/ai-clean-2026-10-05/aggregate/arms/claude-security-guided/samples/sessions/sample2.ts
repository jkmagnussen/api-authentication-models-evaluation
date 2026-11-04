```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

// Types for user data
interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

interface SessionData {
  userId?: string;
  user?: User;
  loginAttempts?: number;
  lastLoginAttempt?: number;
  ipAddress?: string;
  userAgent?: string;
}

// Secure session configuration with secure defaults
export const createSessionConfig = (secret?: string) => {
  const sessionSecret = secret || randomBytes(32).toString("hex");

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict" as const,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      path: "/",
    },
  });
};

// Validation functions with strict input validation
export const validateUsername = (username: unknown): string => {
  if (typeof username !== "string") {
    throw new Error("Username must be a string");
  }

  const trimmed = username.trim();

  if (trimmed.length < 3 || trimmed.length > 50) {
    throw new Error("Username must be between 3 and 50 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error("Username contains invalid characters");
  }

  return trimmed;
};

export const validateEmail = (email: unknown): string => {
  if (typeof email !== "string") {
    throw new Error("Email must be a string");
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    throw new Error("Invalid email format");
  }

  return trimmed;
};

export const validatePassword = (password: unknown): string => {
  if (typeof password !== "string") {
    throw new Error("Password must be a string");
  }

  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters");
  }

  return password;
};

export const validateUserId = (userId: unknown): string => {
  if (typeof userId !== "string") {
    throw new Error("User ID must be a string");
  }

  if (!/^[a-f0-9]{24}$/.test(userId) && !/^\d+$/.test(userId)) {
    throw new Error("Invalid user ID format");
  }

  return userId;
};

// Session management functions
export const createSession = (
  req: Request,
  user: User,
  ipAddress: string,
  userAgent: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sessionData: SessionData = {
      userId: user.id,
      user: user,
      ipAddress: ipAddress,
      userAgent: userAgent,
      loginAttempts: 0,
      lastLoginAttempt: Date.now(),
    };

    Object.assign(req.session, sessionData);

    req.session.save((err) => {
      if