```typescript
import express, { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";

const router = Router();

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: Set<string>;
  allowedScopes: Set<string>;
  stateTimeout: number;
}

const stateStore = new Map<string, { timestamp: number; clientId: string }>();

export const validateOAuthConfiguration = (config: OAuthConfig): boolean => {
  if (!config.clientId || !config.clientSecret) {
    return false;
  }
  if (config.redirectUris.size === 0 || config.allowedScopes.size === 0) {
    return false;
  }
  return true;
};

export const sanitizeRedirectUri = (uri: string): string => {
  try {
    const parsed = new URL(uri);
    if (!parsed.protocol.match(/^https?:$/)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    return "";
  }
};

export const isValidRedirectUri = (
  uri: string,
  allowedUris: Set<string>
): boolean => {
  if (!uri) return false;
  const sanitized = sanitizeRedirectUri(uri);
  return allowedUris.has(sanitized);
};

export const parseRequestedScopes = (scopeParam: string): string[] => {
  if (!scopeParam || typeof scopeParam !== "string") {
    return [];
  }
  return scopeParam
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

export const validateRequestedScopes = (
  requested: string[],
  allowed: Set<string>
): string[] => {
  return requested.filter((scope) => allowed.has(scope));
};

export const generateSecureState = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const storeAuthorizationState = (
  state: string,
  clientId: string,
  expirationMs: number
): void => {
  stateStore.set(state, {
    timestamp: Date.now(),
    clientId: clientId,
  });

  setTimeout(() => {
    stateStore.delete(state);
  }, expirationMs);
};

export const verifyAuthorizationState = (
  state: string,
  clientId: string,
  maxAgeMs: number
): boolean => {
  const entry = stateStore.get(state);
  if (!entry) {
    return false;
  }

  if (Date.now() - entry.timestamp > maxAgeMs) {
    stateStore.delete(state);
    return false;
  }

  if (entry.clientId !== clientId) {
    stateStore.delete(state);
    return false;
  }

  stateStore.delete(state);
  return true;
};

export const createAuthorizationEndpoint = (config: OAuthConfig) => {
  if (!validateOAuthConfiguration(config)) {
    throw new Error("Invalid OAuth configuration");
  }

  const authRouter = Router();

  authRouter.get(
    "/authorize",
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { client_id, redirect_uri, scope, state, response_type } =
          req.query;

        // Validate response_type
        if (response_type !== "code") {
          return res.status(400).json({
            error: "uns