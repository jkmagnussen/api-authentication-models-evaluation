```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Type extension for Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Configuration with secure defaults
const JWT_CONFIG = {
  secretKey: process.env.JWT_SECRET_KEY || crypto.randomBytes(32).toString("hex"),
  tokenExpiration: process.env.JWT_EXPIRATION || "1h",
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  algorithm: "HS256" as const,
};

// Validate JWT configuration
function validateJWTConfig(): void {
  if (!JWT_CONFIG.secretKey || JWT_CONFIG.secretKey.length < 32) {
    console.warn("Warning: JWT secret key is too short. Using generated key.");
  }
}

// Input validation utility
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateUserId(userId: string): boolean {
  return typeof userId === "string" && userId.length > 0 && userId.length <= 255;
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 255);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  // Validate payload
  if (!validateUserId(payload.userId)) {
    throw new Error("Invalid userId");
  }
  if (!validateEmail(payload.email)) {
    throw new Error("Invalid email");
  }

  try {
    return jwt.sign(payload, JWT_CONFIG.secretKey, {
      expiresIn: JWT_CONFIG.tokenExpiration,
      algorithm: JWT_CONFIG.algorithm,
    });
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new Error("Failed to generate authentication token");
  }
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  if (!validateUserId(userId)) {
    throw new Error("Invalid userId");
  }

  try {
    return jwt.sign({ userId, type: "refresh" }, JWT_CONFIG.secretKey, {
      expiresIn: JWT_CONFIG.refreshTokenExpiration,
      algorithm: JWT_CONFIG.algorithm,
    });
  } catch (error) {
    console.error("Refresh token generation failed:", error);
    throw new Error("Failed to generate refresh token");
  }
}

// Verify and decode JWT token
export function verifyToken(token: string): JWTPayload {
  // Input validation - fail closed if token is invalid
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format");
  }

  if (token.length > 10000) {
    // JWT tokens should not be excessively long
    throw new Error("Token exceeds maximum length");
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secretKey, {
      algorithms: [JWT_CONFIG.algorithm],
    }) as JWTPayload;

    // Additional validation of decoded payload
    if (!validateUserId(decoded.userId) || !validateEmail(decoded.email)) {
      throw new Error("Invalid token payload");