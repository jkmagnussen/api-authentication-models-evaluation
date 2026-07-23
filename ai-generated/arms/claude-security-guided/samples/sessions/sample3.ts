```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

export interface SecureSessionConfig {
  secret: string;
  name?: string;
  maxAge?: number;
  secureCookie?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export const createSecureSessionMiddleware = (config: SecureSessionConfig) => {
  const validatedConfig = validateSessionConfig(config);

  return session({
    secret: validatedConfig.secret,
    name: validatedConfig.name,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: validatedConfig.secureCookie,
      httpOnly: validatedConfig.httpOnly,
      sameSite: validatedConfig.sameSite,
      maxAge: validatedConfig.maxAge,
      path: '/',
    },
  });
};

const validateSessionConfig = (config: SecureSessionConfig): Required<SecureSessionConfig> => {
  if (!config.secret || config.secret.length < 32) {
    throw new Error('Session secret must be at least 32 characters');
  }

  return {
    secret: config.secret,
    name: config.name || 'auth.sid',
    maxAge: config.maxAge || 1800000,
    secureCookie: config.secureCookie !== false,
    httpOnly: config.httpOnly !== false,
    sameSite: config.sameSite || 'lax',
  };
};

export const regenerateSession = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(new Error(`Session regeneration failed: ${err.message}`));
      } else {
        resolve();
      }
    });
  });
};

export const terminateSession = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        reject(new Error(`Session termination failed: ${err.message}`));
      } else {
        res.clearCookie('auth.sid', { path: '/' });
        resolve();
      }
    });
  });
};

export const enrollSessionData = (
  req: Request,
  userId: string,
  metadata?: Record<string, unknown>
): void => {
  if (!req.session) {
    throw new Error('Session not initialized');
  }

  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  req.session.userId = userId;
  req.session.loginTime = timestamp;
  req.session.nonce = nonce;
  if (metadata) {
    req.session.metadata = metadata;
  }
};

export const verifySessionIntegrity = (req: Request): boolean => {
  if (!req.session) {
    return false;
  }

  const requiredFields = ['userId', 'loginTime', 'nonce'];
  return requiredFields.every((field) => field in req.session);
};

export const isSessionExpired = (req: Request, maxDuration: number): boolean => {
  if (!req.session || !req.session.loginTime) {
    return true;
  }

  const currentTime = Date.now();
  const elapsed = currentTime - (req.session.loginTime as