import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId: string;
    isAuthenticated: boolean;
  }
}

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true if using HTTPS
    maxAge: 60000 // Session expiration in milliseconds
  }
}));

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.post('/login', (req: Request, res: Response) => {
  // Dummy authentication logic
  const userId = req.body.userId;
  if (userId) {
    req.session.userId = userId;
    req.session.isAuthenticated = true;
    res.send('Logged in');
  } else {
    res.status(400).send('Login failed');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.send('Logged out');
  });
});

app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  res.send(`Welcome, user ${req.session.userId}`);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});