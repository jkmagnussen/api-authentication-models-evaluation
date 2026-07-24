// TypeScript augmentation for Express and express-session.
// - Adds req.userId for session authentication middleware.
// - Adds PKCE + token fields to SessionData for OAuth2 flows.
// This file must be imported once at startup so TS merges the types globally.


// types/express-session-augment.ts

import "express-session";

// Extend Express Request with userId (used by session auth)
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

// Extend SessionData with fields used by OAuth2 PKCE + tokens
declare module "express-session" {
  interface SessionData {
    email?: string;
    code_verifier?: string;
    access_token?: string;
    refresh_token?: string;
  }
}