```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  userId?: string;
  username?: string;
  loginTimestamp?: number;
  lastActivity?: number;
}

interface UserRecord {
  id: string;
  username: string;
  password: string;
}

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTimestamp?: number;
      lastActivity?: number;
    }
  }
}

const inMemoryUsers: Map<string, UserRecord> = new Map([
  ['user1', { id: 'u1', username: 'alice', password: 'secret123' }],
  ['user2', { id: 'u2', username: 'bob', password: 'pass456' }],
]);

const inMemorySessions: Map<string, SessionData> = new Map();

export function setupSessionMiddleware(app: express.Application): void {
  app.use(
    session({
      secret: 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
}

export function attachActivityTracker(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session && req.session.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
}

export function verifyAuthState(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export function authenticateWithCredentials(
  req: Request,
  res: Response
): void {
  const { username, password } = req.body;

  let foundUser: UserRecord | null = null;
  inMemoryUsers.forEach((user) => {
    if (user.username === username && user.password === password) {
      foundUser = user;
    }
  });

  if (!foundUser) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.session.userId = foundUser.id;
  req.session.username = foundUser.username;
  req.session.loginTimestamp = Date.now();
  req.session.lastActivity = Date.now();

  inMemorySessions.set(foundUser.id, {
    userId: foundUser.id,
    username: foundUser.username,
    loginTimestamp: req.session.loginTimestamp,
    lastActivity: req.session.lastActivity,
  });

  res.json({
    message: 'Authentication successful',
    username: foundUser.username,
  });
}

export function retrieveCurrentSession(req: Request, res: Response): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'No active session' });
    return;
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    loginTimestamp: req.session.loginTimestamp,
    lastActivity: req.session.lastActivity,
    sessionId: req.sessionID,
  });
}

export function terminateSession