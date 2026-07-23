```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

interface SessionOptions {
  maxAge?: number;
  resave?: boolean;
  saveUninitialized?: boolean;
}

interface AuthenticatedRequest extends Request {
  session: session.Session & {
    userId?: string;
    email?: string;
  };
}

export function setupSecureSessionManagement(sessionOptions?: SessionOptions) {
  const defaultOptions: SessionOptions = {
    maxAge: 30 * 60 * 1000,
    resave: false,
    saveUninitialized: false,
    ...sessionOptions,
  };

  app.use(
    session({
      secret: crypto.randomBytes(32).toString('hex'),
      resave: defaultOptions.resave,
      saveUninitialized: defaultOptions.saveUninitialized,
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: defaultOptions.maxAge,
      },
      name: 'auth_session_id',
    })
  );

  return app;
}

export async function performSessionRenewal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  return new Promise((resolve, reject) => {
    const originalUserId = req.session.userId;
    const originalEmail = req.session.email;

    req.session.regenerate((err) => {
      if (err) {
        return reject(err);
      }

      req.session.userId = originalUserId;
      req.session.email = originalEmail;

      req.session.save((saveErr) => {
        if (saveErr) {
          return reject(saveErr);
        }
        resolve();
      });
    });
  });
}

export async function invalidateSessionOnLogout(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(err);
      }

      res.clearCookie('auth_session_id', {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      });

      resolve();
    });
  });
}

export function validateSessionIntegrity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Session invalid or expired' });
  }

  if (!req.session.email) {
    return res.status(401).json({ error: 'Session data corrupted' });
  }

  next();
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  userId: string,
  email: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        return reject(err);
      }

      req.session.userId = userId;
      req.session.email = email;

      req.session.save((saveErr) => {
        if (saveErr) {
          return reject(saveErr);
        }
        resolve();
      });
    });
  });
}

// Routes
app.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = 'user_123