import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    views: number;
  }
}

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60000
  }
};

app.use(session(sessionOptions));

const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  next();
};

app.use(sessionMiddleware);

app.get('/', (req: Request, res: Response) => {
  res.send(`You have viewed this page ${req.session.views} times.`);
});

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('Logged in!');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out.');
    }
    res.send('Logged out!');
  });
});

export { app, sessionMiddleware };