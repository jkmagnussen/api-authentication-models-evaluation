import express from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15  // 15 minutes
  }
};

app.use(session(sessionConfig));

export function regenerateSession(req: express.Request, callback: (err?: any) => void): void {
  req.session.regenerate((err: any) => {
    callback(err);
  });
}

export function destroySession(req: express.Request, callback: (err?: any) => void): void {
  req.session.destroy((err: any) => {
    if (!err) {
      res.clearCookie('connect.sid');
    }
    callback(err);
  });
}

export const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized access' });
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (validateCredentials(username, password)) {
    regenerateSession(req, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Session error' });
      }
      req.session.userId = username;
      res.status(200).json({ message: 'Login successful' });
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/logout', isAuthenticated, (req, res) => {
  destroySession(req, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Session error' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

function validateCredentials(username: string, password: string): boolean {
  // Replace with actual credential validation logic
  return username === 'user' && password === 'pass';
}