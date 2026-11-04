import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

export const app = express();

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60000 } // Secure should be true in production with HTTPS
}));

export function checkSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).send('Unauthorized: No session available');
  }
}

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Dummy validation
  if (username === 'user' && password === 'pass') {
    req.session.userId = username;
    res.send('Login successful');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/dashboard', checkSession, (req: Request, res: Response) => {
  res.send(`Welcome to your dashboard, ${req.session.userId}`);
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Failed to log out');
    } else {
      res.send('Logout successful');
    }
  });
});