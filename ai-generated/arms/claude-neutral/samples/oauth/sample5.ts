```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  timestamp: number;
}

const authorizationStorage = new Map<string, StoredAuthRequest>();
const consentStorage = new Map<string, string>();

export async function validateClientIdentity(
  clientId: string
): Promise<boolean> {
  const allowedClients = [
    "mobile-app-001",
    "web-service-002",
    "desktop-client-003",
  ];
  return allowedClients.includes(clientId);
}

export async function validateRedirectUri(
  clientId: string,
  uri: string
): Promise<boolean> {
  const clientRedirects: Record<string, string[]> = {
    "mobile-app-001": ["https://mobile.example.com/callback"],
    "web-service-002": ["https://web.example.com/auth/callback"],
    "desktop-client-003": ["http://localhost:3001/callback"],
  };
  const allowedUris = clientRedirects[clientId] || [];
  return allowedUris.includes(uri);
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function buildAuthorizationForm(
  authCode: string,
  clientName: string,
  requestedScopes: string[]
): Promise<string> {
  const scopeDescriptions: Record<string, string> = {
    "read:profile": "Access your profile information",
    "read:email": "Access your email address",
    "write:data": "Write data on your behalf",
    "read:history": "Access your browsing history",
  };

  const scopeList = requestedScopes
    .map((scope) => scopeDescriptions[scope] || scope)
    .join("<br/>");

  return `
    <html>
    <head>
      <title>OAuth2 Authorization</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 500px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
        .app-name { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .scopes { background: #f0f0f0; padding: 10px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .approve { background: #4CAF50; color: white; }
        .deny { background: #f44336; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="app-name">${clientName}</div>
        <p>is requesting permission to:</p>
        <div class="scopes">${scopeList}</div>
        <form method="POST" action="/