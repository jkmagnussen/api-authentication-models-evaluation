```typescript
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    userId: string;
  }
>();

const accessTokens = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
>();

const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Pre-register a test client
registeredClients.set("test-client", {
  clientSecret: "test-secret-key",
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/oauth/callback",
  ],
  name: "Test Application",
});

export const validateClientCredentials = (
  clientId: string,
  clientSecret: string
): boolean => {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.clientSecret === clientSecret;
};

export const generateAuthorizationCode = (
  clientId: string,
  redirectUri: string,
  scope: string,
  userId: string
): string => {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    clientId,
    redirectUri,
    scope,
    expiresAt,
    userId,
  });

  return code;
};

export const validateAuthorizationCode = (
  code: string,
  clientId: string,
  redirectUri: string
): boolean => {
  const codeData = authorizationCodes.get(code);
  if (!codeData) return false;

  if (codeData.expiresAt < Date.now()) {
    authorizationCodes.delete(code);
    return false;
  }

  if (codeData.clientId !== clientId || codeData.redirectUri !== redirectUri) {
    return false;
  }

  return true;
};

export const consumeAuthorizationCode = (
  code: string
): {
  clientId: string;
  userId: string;
  scope: string;
} | null => {
  const codeData = authorizationCodes.get(code);
  if (!codeData) return null;

  authorizationCodes.delete(code);
  return {
    clientId: codeData.clientId,
    userId: codeData.userId,
    scope: codeData.scope,
  };
};

export const generateAccessToken = (
  clientId: string,
  userId: string,
  scope: string
): string => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  accessTokens.set(token, {
    clientId,
    userId,
    scope,
    expiresAt,
  });

  return token;
};

export const validateAccessToken = (
  token: string
): {
  clientId: string;