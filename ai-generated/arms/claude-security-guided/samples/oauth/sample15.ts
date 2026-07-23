```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();

// Configuration
const ALLOWED_SCOPES = new Set(['read:profile', 'write:data', 'delete:account']);
const ALLOWED_REDIRECT_DOMAINS = ['localhost:3000', 'localhost:3001', 'app.example.com'];
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const stateStore = new Map<string, { timestamp: number; client_id: string }>();

// Validation functions
function validateRedirectUri(redirectUri: string, clientId: string): boolean {
  if (!redirectUri) return false;
  
  try {
    const url = new URL(redirectUri);
    
    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return false;
    }
    
    // Check against whitelist
    const host = url.hostname === 'localhost' ? `${url.hostname}:${url.port}` : url.hostname;
    if (!ALLOWED_REDIRECT_DOMAINS.includes(host)) {
      return false;
    }
    
    // Only path segments, no query or fragments allowed
    if (url.search || url.hash) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function validateScopes(requestedScopes: string): { valid: boolean; scopes: string[] } {
  if (!requestedScopes || typeof requestedScopes !== 'string') {
    return { valid: false, scopes: [] };
  }
  
  const scopes = requestedScopes.split(' ').filter(s => s.length > 0);
  
  // Validate each scope
  const validScopes = scopes.filter(scope => ALLOWED_SCOPES.has(scope));
  
  // All requested scopes must be valid
  if (validScopes.length !== scopes.length) {
    return { valid: false, scopes: [] };
  }
  
  return { valid: true, scopes: validScopes };
}

function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

function validateStateParameter(state: string, clientId: string): boolean {
  if (!state || typeof state !== 'string') return false;
  
  const stateData = stateStore.get(state);
  if (!stateData) return false;
  
  // Check expiry
  if (Date.now() - stateData.timestamp > STATE_EXPIRY_MS) {
    stateStore.delete(state);
    return false;
  }
  
  // Verify client_id matches
  if (stateData.client_id !== clientId) {
    return false;
  }
  
  return true;
}

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > STATE_EXPIRY_MS) {
      stateStore.delete(state);
    }
  }
}

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// OAuth2 Authorization Endpoint
export async function handleAuthorizationRequest(req: Request, res: Response): Promise<void> {
  // Clean up expired states
  cleanupExpiredStates();
  
  // Extract and validate