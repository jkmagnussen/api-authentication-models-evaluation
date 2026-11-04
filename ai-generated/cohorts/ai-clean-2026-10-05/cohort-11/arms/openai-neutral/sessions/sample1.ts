import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();

app.use(express.json());

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
  },
};

app.use(session(sessionOptions));

app.post('/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  
  if (userId) {
    req.session.userId = userId;
    res.send('Logged in successfully.');
  } else {
    res.status(400).send('User ID is required.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Failed to logout.');
    } else {
      res.send('Logged out successfully.');
    }
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.userId) {
    res.send(`Welcome user ${req.session.userId}`);
  } else {
    res.status(401).send('Please login first.');
  }
});

export { app };