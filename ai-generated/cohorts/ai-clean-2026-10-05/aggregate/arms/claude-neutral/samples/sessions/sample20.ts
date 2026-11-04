import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        username?: string;
        loginTime?: Date;
        isAuthenticated?: boolean;
      };
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (password !== 'demo-password') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = uuidv4();
  req.session.username = username;
  req.session.loginTime = new Date();
  req.session.isAuthenticated = true;

  res.json({
    message: 'Login successful',
    user: {
      userId: req.session.userId,
      username: req.session.username,
    },
  });
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

export const getSession = (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: {
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
    },
  });
};

export const setupSessionRoutes = (app: express.Express) => {
  app.use(createSessionMiddleware());
  app.use(express.json());

  app.post('/login', login);
  app.post('/logout', logout);
  app.get('/session', requireAuth, getSession);

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return app;
};

const app = express();
setupSessionRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Session management server running on port ${PORT}`);
});

export default app;