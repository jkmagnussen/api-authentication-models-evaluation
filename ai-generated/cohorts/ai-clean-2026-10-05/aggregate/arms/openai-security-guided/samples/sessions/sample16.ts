import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

// Validator middleware that checks session ID format
const validateSessionID = (req: Request, res: Response, next: NextFunction) => {
  const sessionIdFormat = /^[a-zA-Z0-9_-]{32}$/;
  if (req.sessionID && sessionIdFormat.test(req.sessionID)) {
    return next();
  }
  res.status(400).send('Invalid session ID format.');
};

// Random, secure, secret key for sessions
const sessionSecret = crypto.randomBytes(64).toString('hex');

app.use(session({
  name: 'sessionId',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minutes
    sameSite: 'strict'
  }
}));

// Use session ID validation middleware
app.use(validateSessionID);

app.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  
  if (!username || typeof username !== 'string') {
    return res.status(400).send('Invalid input');
  }

  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).send('Failed to regenerate session');
    }
    req.session.userId = username;
    res.send('Logged in');
  });
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to destroy session');
    }
    res.send('Logged out');
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }

  res.send(`Welcome, ${req.session.userId}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});