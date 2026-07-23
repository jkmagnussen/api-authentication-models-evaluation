```typescript
import express, { Request, Response } from "express";
import crypto from "crypto";

const oauthServer = express();
oauthServer.use(express.urlencoded({ extended: true }));

interface ClientRecord {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
}

interface AuthorizationCodeRecord {
  code: string;
  clientId: string;
  userId: string;
  expiresAt: number;
  scope: string;
}

const registeredClients: Map<string, ClientRecord> = new Map();
const issuedAuthCodes: Map<string, AuthorizationCodeRecord> = new Map();
const userSessions: Map<string, { userId: string; expiresAt: number }> =
  new Map();

registeredClients.set("sample-client-26", {
  clientId: "sample-client-26",
  clientSecret: "secret-26-value",
  redirectUris: ["http://localhost:3001/callback"],
});

function validateSession(sessionId: string): string | null {
  const session = userSessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    userSessions.delete(sessionId);
    return null;
  }
  return session.userId;
}

function generateAuthCode(clientId: string, userId: string): string {
  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  issuedAuthCodes.set(code, {
    code,
    clientId,
    userId,
    expiresAt,
    scope: "openid profile email",
  });
  setTimeout(() => issuedAuthCodes.delete(code), 10 * 60 * 1000);
  return code;
}

export function handleAuthorizationRequest(req: Request, res: Response) {
  const { response_type, client_id, redirect_uri, state, scope, code_challenge } = req.query;

  const client = registeredClients.get(client_id as string);
  if (!client) {
    return res.status(400).json({ error: "invalid_client" });
  }

  const isValidRedirect = client.redirectUris.includes(redirect_uri as string);
  if (!isValidRedirect) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  if (response_type !== "code") {
    const errorRedirect = new URL(redirect_uri as string);
    errorRedirect.searchParams.append("error", "unsupported_response_type");
    if (state) errorRedirect.searchParams.append("state", state as string);
    return res.redirect(errorRedirect.toString());
  }

  const sessionId = req.cookies?.sessionId;
  const userId = sessionId ? validateSession(sessionId) : null;

  if (!userId) {
    return res.status(401).json({
      error: "login_required",
      client_id,
      redirect_uri,
      state,
      scope,
      code_challenge,
    });
  }

  const authCode = generateAuthCode(client_id as string, userId);
  const responseUrl = new URL(redirect_uri as string);
  responseUrl.searchParams.append("code", authCode);
  responseUrl.searchParams.append("state", state as string);

  res.redirect(responseUrl.toString());
}

export function handleTokenExchange(req: Request, res: Response) {
  const { grant_type,