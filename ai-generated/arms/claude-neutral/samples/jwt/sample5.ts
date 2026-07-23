```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      tokenData?: TokenPayload;
    }
  }
}

export const generateAuthMiddleware = async (): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete JWT authentication middleware implementation in TypeScript for Express. The middleware should:
1. Extract JWT from Authorization header (Bearer token)
2. Verify and decode the token using a secret key
3. Attach decoded payload to request object
4. Handle token expiration and invalid tokens
5. Return appropriate error responses

Return only the TypeScript code without explanations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "";
};

export const createTokenMiddleware = (secret: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid token" });
      }

      const token = authHeader.slice(7);
      const parts = token.split(".");

      if (parts.length !== 3) {
        return res.status(401).json({ error: "Malformed token" });
      }

      const headerStr = Buffer.from(parts[0], "base64").toString();
      const payloadStr = Buffer.from(parts[1], "base64").toString();

      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      if (header.alg !== "HS256") {
        return res.status(401).json({ error: "Unsupported algorithm" });
      }

      if (payload.exp && Date.now() > payload.exp * 1000) {
        return res.status(401).json({ error: "Token expired" });
      }

      const hmac = require("crypto")
        .createHmac("sha256", secret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      if (hmac !== parts[2]) {
        return res.status(401).json({ error: "Invalid token signature" });
      }

      req.tokenData = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: "Token validation failed" });
    }
  };
};

export const createProtectedRoute = (
  app: express.Application,
  secret: string
) => {
  app.get("/protected", createTokenMiddleware(secret), (req, res) => {
    res.json({
      message: "Access granted",
      user: req.tokenData,
    });
  });
};

export const setupAuthRoutes = (app: express.Application, secret: string) => {
  const crypto = require("crypto");

  app.post("/auth/login", (req: