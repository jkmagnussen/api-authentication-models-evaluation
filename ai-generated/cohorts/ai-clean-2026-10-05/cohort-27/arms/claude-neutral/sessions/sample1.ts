```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionData?: Record<string, unknown>;
    }
  }
}

const app = express();

// In-memory store for demonstration (use a proper store like connect-mongo in production)
const sessionStore = new Map<string, Record<string, unknown>>();

export const configureSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized - please login first' });
    return;
  }
  req.userId = req.session.userId as string;
  next();
};

export const initializeRoutes = (app: express.Application): void => {
  app.use(express.json());
  configureSessionMiddleware(app);

  // Login route
  app.post('/login', (req: Request, res: Response): void => {
    const userId = uuidv4();
    req.session.userId = userId;
    req.session.loginTime = new Date().toISOString();
    req.session.userData = {
      email: 'user@example.com',
      role: 'user',
    };

    sessionStore.set(req.sessionID, {
      userId,
      loginTime: req.session.loginTime,
      userData: req.session.userData,
    });

    res.json({
      message: 'Login successful',
      userId,
      sessionId: req.sessionID,
    });
  });

  // Get session info route
  app.get('/session-info', requireAuth, (req: Request, res: Response): void => {
    const sessionInfo = {
      userId: req.session.userId,
      loginTime: req.session.loginTime,
      userData: req.session.userData,
      sessionId: req.sessionID,
      cookie: req.session.cookie,
    };

    res.json(sessionInfo);
  });

  // Update session data route
  app.post(
    '/session-update',
    requireAuth,
    (req: Request, res: Response): void => {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        res.status(400).json({ error: 'Missing key or value' });
        return;
      }

      if (!req.session.userData) {
        req.session.userData = {};
      }

      (req.session.userData as Record<string, unknown>)[key] = value;

      const storeData = sessionStore.get(req.sessionID);
      if (storeData && storeData.userData) {
        (storeData.userData as Record<string, unknown>)[key] = value;
      }

      res.json({
        message: 'Session updated successfully',
        updatedData: req.session.userData,
      });
    }
  );

  // Logout route
  app