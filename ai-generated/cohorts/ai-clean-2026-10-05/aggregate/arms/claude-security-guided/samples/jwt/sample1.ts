```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Secure defaults
const DEFAULT_TOKEN_EXPIRY = "1h";
const DEFAULT_ALGORITHM = "HS256";
const MAX_TOKEN_LENGTH = 1000;
const MIN_SECRET_LENGTH = 32;

// Custom error types for better error handling
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Generate a secure secret key
export const generateSecretKey = (): string => {
  return crypto.randomBytes(MIN_SECRET_LENGTH).toString("hex");
};

// Validate and sanitize JWT secret
const validateSecretKey = (secret: string): string => {
  if (!secret || typeof secret !== "string") {
    throw new ValidationError("Secret key must be a non-empty string");
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new ValidationError(
      `Secret key must be at least ${MIN_SECRET_LENGTH} characters long`
    );
  }
  return secret;
};

// Validate JWT token format
const validateTokenFormat = (token: string): string => {
  if (!token || typeof token !== "string") {
    throw new ValidationError("Token must be a non-empty string");
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new ValidationError(`Token exceeds maximum length of ${MAX_TOKEN_LENGTH}`);
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new ValidationError("Invalid token format");
  }
  return token;
};

// Validate payload object
const validatePayload = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Payload must be a non-null object");
  }
  const obj = payload as Record<string, unknown>;
  // Ensure no dangerous fields
  if (obj.iat || obj.exp || obj.nbf) {
    throw new ValidationError(
      "Payload cannot contain reserved claims (iat, exp, nbf)"
    );
  }
  return obj;
};

// Create JWT token with validation
export const createToken = (
  payload: Record<string, unknown>,
  secretKey: string,
  expiresIn: string = DEFAULT_TOKEN_EXPIRY
): string => {
  try {
    const validatedSecret = validateSecretKey(secretKey);
    const validatedPayload = validatePayload(payload);

    const token = jwt.sign(validatedPayload, validatedSecret, {
      expiresIn,
      algorithm: DEFAULT_ALGORITHM,
    });

    return token;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new AuthenticationError(`Failed to create token: ${String(error)}`);
  }
};

// Verify JWT token with strict validation
export const verifyToken = (
  token: string,
  secretKey: string
): Record<string, unknown> => {
  try {
    const validatedToken = validateTokenFormat(token);
    const validatedSecret = validateSecretKey(secretKey);

    const decoded = jwt.verify(validatedToken, validatedSecret, {
      algorithms: [DEFAULT_ALGORITHM],
    });

    if (!decoded || typeof decoded !== "object") {