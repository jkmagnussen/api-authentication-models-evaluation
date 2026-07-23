"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`` `typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

interface StoredAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  expires_at: number;
  user_id: string;
}

const authorizationCodes = new Map<string, StoredAuthCode>();
const registeredClients = new Map<string, { secret: string; redirectUris: string[] }>();

// Register some test clients
registeredClients.set('test_client_1', {
  secret: 'client_secret_123',
  redirectUris: ['http://localhost:3001/callback', 'http://localhost:3001/auth/callback'],
});

registeredClients.set('test_client_2', {
  secret: 'client_secret_456',
  redirectUris: ['http://localhost:3002/oauth/callback', 'http://localhost:3002/login/callback'],
});

export const validateAuthRequest = (query: Record<string, string | string[]>): AuthorizationRequest | null => {
  const client_id = Array.isArray(query.client_id) ? query.client_id[0] : query.client_id;
  const redirect_uri = Array.isArray(query.redirect_uri) ? query.redirect_uri[0] : query.redirect_uri;
  const response_type = Array.isArray(query.response_type) ? query.response_type[0] : query.response_type;
  const scope = Array.isArray(query.scope) ? query.scope[0] : query.scope;
  const state = Array.isArray(query.state) ? query.state[0] : query.state;
  const nonce = Array.isArray(query.nonce) ? query.nonce[0] : (query.nonce as string | undefined);

  if (!client_id || !redirect_uri || !response_type || !state) {
    return null;
  }

  return {
    client_id,
    redirect_uri,
    response_type,
    scope: scope || '',
    state,
    nonce,
  };
};

export const validateClient = (client_id: string, redirect_uri: string): boolean => {
  const client = registeredClients.get(client_id);
  if (!client) {
    return false;
  }
  return client.redirectUris.includes(redirect_uri);
};

export const generateAuthorizationCode = (
  client_id: string,
  redirect_uri: string,
  scope: string,
  user_id: string,
): string => {
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    code,
    client_id,
    redirect_uri,
    scope,
    expires_at: expiresAt,
    user_id,
  });

  return code;
};

export const exchangeAuthorizationCode = (code: string, client_id: string): StoredAuthCode | null => {
  const authCode = authorizationCodes.get(code);

  if (!authCode) {
    return null;
  }

  if (authCode.expires_at < Date.now()) {
    authorizationCodes.delete(code);;
