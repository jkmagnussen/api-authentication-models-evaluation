import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

app.use(express.json());

declare module 'express-session' {
  interface SessionData {
    userId: string;
    views: number;
  }
}

const sessionOptions: session.SessionOptions = {
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000, // 1 minute
    secure: false // Use true if using HTTPS
  }
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome! Refresh to start counting your views.');
  }
});

app.post('/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    req.session.userId = userId;
    res.send(`User ${userId} logged in.`);
  } else {
    res.status(400).send('Invalid user ID.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to destroy session');
    }
    res.send('Logged out successfully');
  });
});

app.get('/protected', (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
}, (req: Request, res: Response) => {
  res.send(`Welcome, user ${req.session.userId}`);
});

export { app, sessionOptions };