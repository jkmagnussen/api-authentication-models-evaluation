import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

app.use(helmet());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minutes
  }
}));

function validateSessionId(sessionId: string): boolean {
  return /^[a-zA-Z0-9-_]{32,}$/.test(sessionId);
}

function sessionValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.sessionID;
  if (!validateSessionId(sessionId)) {
    return res.status(400).send('Invalid session ID');
  }
  next();
}

app.use(sessionValidationMiddleware);

app.get('/', (req: Request, res: Response) => {
  if (!req.session.user) {
    req.session.user = { isLoggedIn: false };
  }
  res.send(req.session.user);
});

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Invalid input');
  }
  
  // Assume a function authenticateUser that returns a boolean
  const isAuthenticated = authenticateUser(username, password);
  if (isAuthenticated) {
    req.session.user = { isLoggedIn: true, username };
    res.send('Login successful');
  } else {
    res.status(401).send('Unauthorized');
  }
});

function authenticateUser(username: string, password: string): boolean {
  // Authentication logic here (e.g., check against a database)
  // This is a placeholder for demonstration purposes
  return username === 'admin' && password === 'safePass123';
}

export { app };