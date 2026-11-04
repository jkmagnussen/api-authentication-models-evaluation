import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
app.use(helmet());

const sessionOptions: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionOptions));

// Middleware to validate session
function validateSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized: Invalid session');
  }
  next();
}

// Route to login
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).send('Bad Request: Invalid input');
  }
  // Simulate user authentication
  if (username === 'admin' && password === 'secret') {
    req.session.userId = 'admin';
    return res.status(200).send('Logged in');
  }
  res.status(401).send('Unauthorized: Invalid credentials');
});

// Route to logout
app.post('/logout', validateSession, (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Internal Server Error: Failed to log out');
    }
    res.status(200).send('Logged out');
  });
});

// Protected route
app.get('/dashboard', validateSession, (req: Request, res: Response) => {
  res.status(200).send(`Welcome ${req.session.userId}`);
});

export { app };