```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

// Secure session configuration with secure defaults
const createSessionConfig = () => {
  // Generate a cryptographically secure secret key (in production, use environment variable)
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

  return {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false, // Fail closed: don't create session until explicitly set
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent client-side JS from accessing the session cookie
      sameSite: "strict" as const, // CSRF protection
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  };
};

// Input validation utilities with strict validation rules
const validateEmail = (email: string): boolean => {
  if (typeof email !== "string" || !email) {
    return false;
  }
  // Strict email validation pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validateUsername = (username: string): boolean => {
  if (typeof username !== "string" || !username) {
    return false;
  }
  // Alphanumeric and underscore only, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password: string): boolean => {
  if (typeof password !== "string" || !password) {
    return false;
  }
  // Minimum 8 characters, must contain uppercase, lowercase, number, and special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize user input to prevent XSS
const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

// Session middleware that validates session data
export const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Validate session exists and has required properties if authenticated
  if (req.session && req.session.userId) {
    // Validate userId is a string (fail closed if invalid)
    if (typeof req.session.userId !== "string" || req.session.userId.length === 0) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        return res.status(401).json({ error: "Invalid session" });
      });
      return;
    }

    // Validate email if present
    if (req.session.email && !validateEmail(req.session.email)) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error