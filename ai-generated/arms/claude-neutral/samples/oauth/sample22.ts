```typescript
import express, { Router, Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { URL } from "url";

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedScopes: string[];
  stateExpiryMs: number;
}

interface StoredAuthState {
  clientId: string;
  redirectUri: string;
  scope: string[];
  timestamp: number;
}

const stateStore = new Map<string, StoredAuthState>();

export function createOAuthAuthorizationRouter(config: OAuthConfig): Router {
  const router = Router();

  function isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  function validateRedirectUri(
    redirectUri: string,
    clientId: string
  ): boolean {
    if (!isValidUrl(redirectUri)) {
      return false;
    }

    const registeredUris = config.redirectUris.filter(
      (uri) => uri.startsWith(`${clientId}:`)
    );

    return registeredUris.some((registered) => {
      const registeredUri = registered.substring(clientId.length + 1);
      return redirectUri === registeredUri;
    });
  }

  function validateScopes(requestedScopes: string[]): boolean {
    return (
      requestedScopes.length > 0 &&
      requestedScopes.every((scope) => config.allowedScopes.includes(scope))
    );
  }

  function generateSecureState(): string {
    return randomBytes(32).toString("hex");
  }

  function storeAuthState(
    state: string,
    clientId: string,
    redirectUri: string,
    scope: string[]
  ): void {
    stateStore.set(state, {
      clientId,
      redirectUri,
      scope,
      timestamp: Date.now(),
    });
  }

  function cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
      if (now - data.timestamp > config.stateExpiryMs) {
        stateStore.delete(state);
      }
    }
  }

  router.get(
    "/authorize",
    (req: Request, res: Response, next: NextFunction): void => {
      try {
        cleanupExpiredStates();

        const clientId = req.query.client_id as string;
        const redirectUri = req.query.redirect_uri as string;
        const scope = (req.query.scope as string)?.split(" ") || [];
        const responseType = req.query.response_type as string;
        const state = req.query.state as string;

        const errors: string[] = [];

        if (!clientId || clientId !== config.clientId) {
          errors.push("invalid_client");
        }

        if (!redirectUri) {
          errors.push("missing_redirect_uri");
        } else if (!validateRedirectUri(redirectUri, clientId)) {
          errors.push("invalid_redirect_uri");
        }

        if (!scope || scope.length === 0) {
          errors.push("missing_scope");
        } else if (!validateScopes(scope)) {
          errors.push("invalid_scope");
        }

        if (responseType !== "code") {
          errors.push("unsupported_response_type");
        }

        if (!state || typeof state !== "string" || state.