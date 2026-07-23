import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    views: number;
  }
}

const sessionConfig = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
};

const sessionMiddleware = session(sessionConfig);

const app = express();

app.use(sessionMiddleware);

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`View count for this session: ${req.session.views}`);
});

app.post('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('User logged in');
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('User logged out');
  });
});

export { app, sessionMiddleware };