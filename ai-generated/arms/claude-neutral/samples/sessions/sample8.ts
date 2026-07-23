```typescript
import express, { Request, Response, NextFunction } from 'express';
import session, { Session, SessionData } from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import crypto from 'crypto';

interface AuthenticatedSession extends Session {
  userId?: string;
  username?: string;
  createdAt?: number;
  previousSessionId?: string;
}

// Redis client initialization with error handling
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.connect().catch((err) => {
  console.error('Redis connection failed:', err);
  process.exit(1);
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

const redisStore = new RedisStore({ client: redisClient });

export const configureSessionManagement = (app: express.Application): void => {
  app.use(
    session({
      store: redisStore,
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      name: '__Secure-sessionId',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict' as const,
        maxAge: 30 * 60 * 1000, // 30 minutes
        domain: process.env.SESSION_DOMAIN,
        path: '/',
      },
      genid: (req: Request): string => {
        // Generate cryptographically secure session ID
        return crypto.randomBytes(32).toString('hex');
      },
    })
  );
};

export const initiateLogin = (
  req: Request,
  userId: string,
  username: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentSessionId = req.sessionID;
    
    // Store previous session ID for tracking
    req.session.previousSessionId = currentSessionId;
    
    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        reject(new Error('Session regeneration failed'));
        return;
      }

      // Set authenticated user data
      (req.session as AuthenticatedSession).userId = userId;
      (req.session as AuthenticatedSession).username = username;
      (req.session as AuthenticatedSession).createdAt = Date.now();

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          reject(new Error('Session save failed'));
          return;
        }

        // Invalidate old session from store
        redisClient.del(`sess:${currentSessionId}`).catch((err) => {
          console.error('Failed to invalidate previous session:', err);
        });

        resolve();
      });
    });
  });
};

export const performLogout = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sessionId = req.sessionID;
    const userId = (req.session as AuthenticatedSession).userId;

    // Clear session data
    req.session.destroy((err) => {
      if (err) {
        reject(new Error('Session destruction failed'));
        return;
      }

      // Clear the session cookie
      res