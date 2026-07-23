```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';

export const setupSessionMiddleware = (app: express.Application) => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
};

export const checkAuthentication = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export const loginHandler = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  if (password === 'demo-password') {
    req.session.authenticated = true;
    req.session.user = { id: 1, name: username };
    req.session.loginTime = new Date().toISOString();

    return res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user,
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
};

export const logoutHandler = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
};

export const sessionInfoHandler = (req: Request, res: Response) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'No active session' });
  }

  res.json({
    user: req.session.user,
    loginTime: req.session.loginTime,
    sessionId: req.sessionID,
  });
};

export const updateSessionDataHandler = (req: Request, res: Response) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { preference, metadata } = req.body;

  if (preference) {
    req.session.preferences = req.session.preferences || {};
    Object.assign(req.session.preferences, preference);
  }

  if (metadata) {
    req.session.customData = req.session.customData || {};
    Object.assign(req.session.customData, metadata);
  }

  res.json({
    success: true,
    message: 'Session data updated',
    session: {
      user: req.session.user,
      preferences: req.session.preferences,
      customData: req.session.customData,
    },
  });
};

export const createServer = () => {
  const app = express();

  app.use(express.json());
  setupSessionMiddleware(app);

  app.post('/auth/login', loginHandler);
  app.post('/auth/logout', logoutHandler);
  app.get('/auth/session', checkAuthentication, sessionInfoHandler);
  app.patch('/auth/session', checkAuthentication, updateSessionDataHandler);

  app.get('/health', (