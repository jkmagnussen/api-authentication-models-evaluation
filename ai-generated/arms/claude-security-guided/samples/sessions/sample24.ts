```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app: Express = express();

// Strict validation for session configuration
interface SessionConfig {
  cookieSecret: string;
  sessionSecret: string;
  cookieDomain?: string;
  maxAge: number;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
}

export function initializeSecureSessionManagement(
  config: SessionConfig
): (req: Request, res: Response, next: NextFunction) => void {
  if (!config.cookieSecret || config.cookieSecret.length < 32) {
    throw new Error('Cookie secret must be at least 32 characters long');
  }
  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    throw new Error('Session secret must be at least 32 characters long');
  }
  if (config.secure && config.sameSite === 'none' && !config.secure) {
    throw new Error('SameSite=none requires secure cookies');
  }

  return session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: config.secure,
      httpOnly: true,
      sameSite: config.sameSite,
      maxAge: config.maxAge,
      domain: config.cookieDomain,
      path: '/',
      signed: true
    },
    genid: () => crypto.randomBytes(32).toString('hex'),
    rolling: true
  });
}

export async function performSessionRegeneration(
  req: Request
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const oldSessionId = req.sessionID;

    req.session.regenerate((err) => {
      if (err) {
        resolve({
          success: false,
          error: `Session regeneration failed: ${err.message}`
        });
        return;
      }

      // Verify new session ID differs from old
      if (req.sessionID === oldSessionId) {
        resolve({
          success: false,
          error: 'Session ID did not change after regeneration'
        });
        return;
      }

      // Preserve essential user data through regeneration
      req.session.regeneratedAt = Date.now();
      req.session.save((err) => {
        if (err) {
          resolve({
            success: false,
            error: `Session save failed: ${err.message}`
          });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}

export async function invalidateSessionOnLogout(
  req: Request,
  res: Response
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!req.session) {
      resolve({
        success: false,
        error: 'No session found to invalidate'
      });
      return;
    }

    const sessionId = req.sessionID;

    // Clear all session data explicitly
    req.session.destroy((err) => {
      if (err) {
        resolve({
          success: false,
          error: `Session destruction failed: ${err.message}`
        });
        return;
      }

      // Clear session cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'l