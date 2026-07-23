```typescript
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface ClientRegistry {
  [clientId: string]: {
    clientSecret: string;
    redirectUris: string[];
    grantTypes: string[];
  };
}

interface AuthorizationSession {
  clientId: string;
  userId: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

const registeredClients: ClientRegistry = {
  "sample-client-id": {
    clientSecret: "sample-client-secret-key",
    redirectUris: [
      "http://localhost:3001/callback",
      "https://app.example.com/oauth/callback",
    ],
    grantTypes: ["authorization_code", "refresh_token"],
  },
  "web-app-client": {
    clientSecret: "web-app-secret",
    redirectUris: ["http://localhost:5000/auth/callback"],
    grantTypes: ["authorization_code"],
  },
};

const sessionStore = new Map<string, AuthorizationSession>();
const tokenStore = new Map<string, TokenData>();
const authorizationCodes = new Map<string, AuthorizationSession>();

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateClientCredentials(
  clientId: string,
  clientSecret: string
): boolean {
  const client = registeredClients[clientId];
  if (!client) return false;
  return client.clientSecret === clientSecret;
}

export function isValidRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const client = registeredClients[clientId];
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
}

export function parseScopes(scopeString: string): string[] {
  return scopeString ? scopeString.split(" ").filter((s) => s) : [];
}

export function getAuthorizationCode(code: string): AuthorizationSession | null {
  const session = authorizationCodes.get(code);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    authorizationCodes.delete(code);
    return null;
  }
  return session;
}

export function storeAuthorizationCode(
  code: string,
  session: AuthorizationSession
): void {
  authorizationCodes.set(code, session);
}

export function storeAccessToken(
  token: string,
  data: TokenData,
  userId: string
): void {
  tokenStore.set(token, data);
}

export const authorizationEndpoint = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    response_mode,
  } = req.query;

  if (!client_id || !redirect_uri) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: