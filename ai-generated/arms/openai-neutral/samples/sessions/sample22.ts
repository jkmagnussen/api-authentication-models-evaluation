```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

redisClient.connect().catch(console.error);

export const configureSessionManagement = (): session.SessionOptions => {
  const redisStore = new RedisStore({ client: redisClient });

  return {
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'your-secure-random-secret-min-32-chars',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    genid: (): string => {
      return `sid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    },
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    },
  };
};

export const validateSessionUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'Unauthorized: No valid session' });
    return;
  }

  if (typeof req.session.userId !== 'string') {
    res.status(401).json({ error: 'Invalid session data' });
    return;
  }

  next();
};

export const regenerateSessionToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session) {
    res.status(500).json({ error: 'Session not available' });
    return;
  }

  const previousUserId = req.session.userId;
  const previousLoginTime = req.session.loginTime;

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to regenerate session' });
      return;
    }

    req.session.userId = previousUserId;
    req.session.loginTime = previousLoginTime;
    req.session.regeneratedAt = Date.now();

    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: 'Failed to save session' });
        return;
      }
      next();
    });
  });
};

export const handleSecureLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Missing credentials' });
    return;
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid credential format' });
    return;
  }

  if (!req.session) {
    res.status(500).json({ error: 'Session not available' });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status