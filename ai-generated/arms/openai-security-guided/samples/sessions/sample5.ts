import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import helmet from 'helmet';

// Session configuration
const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

// Middleware to regenerate session
function regenerateSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    return next(new Error('Session not initialized'));
  }
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}

// Middleware to log out and invalidate session
function logoutHandler(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    return next(new Error('Session not initialized'));
  }
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.status(200).send('Logout successful');
  });
}

// Express app setup
const app = express();
app.use(helmet());
app.use(session(sessionConfig));

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // handle user login logic
  res.send('User logged in');
});

app.post('/logout', logoutHandler);

export { app, sessionConfig, regenerateSession, logoutHandler };