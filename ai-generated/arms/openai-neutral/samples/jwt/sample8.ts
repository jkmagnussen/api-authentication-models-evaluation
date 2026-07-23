```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const client = new Anthropic();

interface JWTConfig {
  secret: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxExpirySeconds: number;
}

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const conversationHistory: ConversationMessage[] = [];

async function validateWithClaude(tokenInfo: string): Promise<boolean> {
  conversationHistory.push({
    role: "user",
    content: `Analyze this JWT token information and determine if it appears secure: ${tokenInfo}. 
    Consider: valid exp claim, audience match, issuer match, algorithm safety. 
    Respond with only 'VALID' or 'INVALID'.`,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 50,
    system:
      "You are a JWT security validator. Analyze token claims and respond with only VALID or INVALID.",
    messages: conversationHistory,
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({
    role: "assistant",
    content: responseText,
  });

  return responseText.includes("VALID");
}

export function createJWTMiddleware(config: JWTConfig) {
  // Validate configuration
  if (!config.secret || config.secret.length < 32) {
    throw new Error("JWT secret must be at least 32 characters long");
  }

  if (!config.expectedAudience || !config.expectedIssuer) {
    throw new Error("Expected audience and issuer must be specified");
  }

  if (config.allowedAlgorithms.length === 0) {
    throw new Error("At least one algorithm must be allowed");
  }

  if (config.maxExpirySeconds < 60) {
    throw new Error("Max expiry must be at least 60 seconds");
  }

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.substring(7);

    try {
      // Decode without verification to inspect headers
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        res.status(401).json({ error: "Invalid token format" });
        return;
      }

      // Validate algorithm before verification
      const tokenAlgorithm = decoded.header.alg;
      if (!config.allowedAlgorithms.includes(tokenAlgorithm)) {
        res.status(401).json({
          error: `Algorithm ${tokenAlgorithm} not allowed`,
        });
        return;
      }

      // Verify with strict options
      const verified = jwt.verify(token, config.secret, {
        algorithms: config.allowedAlgorithms as jwt.VerifyOptions["algorithms"],
        audience