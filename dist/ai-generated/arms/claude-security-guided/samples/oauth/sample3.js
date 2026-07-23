"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`` `typescript
import express, { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { URL } from "url";

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface StoredAuthState {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  timestamp: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const ALLOWED_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "offline_access",
  "read:data",
  "write:data",
]);
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const VALID_RESPONSE_TYPES = new Set(["code", "code id_token", "id_token"]);

// In-memory store for state (use Redis/database in production)
const stateRegistry = new Map<string, StoredAuthState>();

// Mock registered client database
const registeredClients = new Map<
  string,
  {
    secret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>([
  [
    "client_app_123",
    {
      secret: "super_secret_key_456",
      redirectUris: [
        "https://app.example.com/callback",
        "http://localhost:3001/callback",
      ],
      allowedScopes: ["openid", "profile", "email", "read:data"],
    },
  ],
  [
    "desktop_client_789",
    {
      secret: "desktop_secret_key_012",
      redirectUris: ["http://localhost:8080/oauth/callback"],
      allowedScopes: ["offline_access", "read:data", "write:data"],
    },
  ],
]);

export function validateRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;

  try {
    const parsedUri = new URL(redirectUri);

    // Reject if not using HTTPS in production, except for localhost
    const isLocalhost =
      parsedUri.hostname === "localhost" ||
      parsedUri.hostname === "127.0.0.1" ||
      parsedUri.hostname.startsWith("[::1]");

    if (parsedUri.protocol !== "https:" && !isLocalhost) {
      return false;
    }

    return client.redirectUris.some((uri) => {
      const registeredUrl = new URL(uri);
      return (
        parsedUri.origin === registeredUrl.origin &&
        parsedUri.pathname === registeredUrl.pathname
      );
    });
  } catch {
    return false;
  }
}

export function sanitizeScopeRequest(
  requestedScopes: string | undefined
): string[] {
  if (!requestedScopes || typeof requestedScopes !== "string") {
    return [];
  }

  return requestedScopes
    .split(" ")
    .filter(
      (scope) => scope && ALLOWED_SCOPES.has(scope.toLowerCase().trim())
    )
    .map((scope) => scope.toLowerCase().trim());
}

export function validateClientScopes(
  clientId: string,
  requestedScopes: string[]
): boolean {
  const client;
