import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId: string;
    views: number;
  }
}

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('You are logged in.');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.send('You are logged out.');
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.userId) {
    res.send(`Welcome to your profile, user ID: ${req.session.userId}`);
  } else {
    res.status(401).send('Please log in to view your profile.');
  }
});

export { app };