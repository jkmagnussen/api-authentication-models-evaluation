```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Types for session management
interface UserSession {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  loginTime: number;
  lastActivityTime: number;
  ipAddress: string;
  userAgent: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Configuration constants with secure defaults
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  MAX_AGE: 30 * 60 * 1000, // 30 minutes in milliseconds
  SECURE: process.env.NODE_ENV === "production",
  HTTP_ONLY: true,
  SAME_SITE: "strict" as const,
  REGENERATE_INTERVAL: 15 * 60 * 1000, // 15 minutes
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// Input validation functions
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
  } else if (email.length > 254) {
    errors.push("Email exceeds maximum length");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email format is invalid");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || typeof username !== "string") {
    errors.push("Username is required and must be a string");
  } else if (username.length < 3 || username.length > 32) {
    errors.push("Username must be between 3 and 32 characters");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  } else if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  } else if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letters");
  } else if (!/[0-9]/.test(password)) {
    errors.push("Password must contain numbers");
  } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain special characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSessionData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Session data must be a non-null object