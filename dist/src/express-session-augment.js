"use strict";
// TypeScript augmentation for Express and express-session.
// - Adds req.userId for session authentication middleware.
// - Adds PKCE + token fields to SessionData for OAuth2 flows.
// This file must be imported once at startup so TS merges the types globally.
Object.defineProperty(exports, "__esModule", { value: true });
// types/express-session-augment.ts
require("express-session");
