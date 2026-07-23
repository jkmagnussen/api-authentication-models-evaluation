```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const app = express();

const redisClient = createClient();
redisClient.connect();

const redisStore = new RedisStore({ client: redisClient });

app.use(express.json());

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

export const validateSessionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

export const createUserSession = (req: Request, res: Response): void => {
  const { userId, email, role } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  req.session.userId = userId;
  req.session.email = email;
  req.session.role = role || 'user';
  req.session.createdAt = new Date();

  res.status(200).json({
    message: 'Session created successfully',
    sessionId: req.sessionID,
  });
};

export const destroyUserSession = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to destroy session' });
      return;
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Session destroyed' });
  });
};

export const retrieveSessionData = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'No active session' });
    return;
  }

  res.status(200).json({
    userId: req.session.userId,
    email: req.session.email,
    role: req.session.role,
    createdAt: req.session.createdAt,
    sessionId: req.sessionID,
  });
};

export const updateSessionAttribute = (req: Request, res: Response): void => {
  const { attributeName, attributeValue } = req.body;

  if (!attributeName) {
    res.status(400).json({ error: 'Attribute name is required' });
    return;
  }

  (req.session as any)[attributeName] = attributeValue;

  res.status(200).json({
    message: `Session attribute '${attributeName}' updated`,
  });
};

export const checkSessionStatus = (req: Request, res: Response): void => {
  const isAuthenticated = !!req.session.userId;

  res.status(200).json({
    authenticated: isAuthenticated,
    sessionId: req.sessionID,
    userId: req.session.userId || null,
  });
};

app.post('/auth/login', createUserSession);
app.get('/auth/logout', destroyUserSession);
app.get('/session/data', validateSessionMiddleware, retriev