import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

interface SessionData {
  views?: number;
  userId?: string;
}

const app = express();

app.use(session({
  secret: 'myComplexSecret!',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 60000 }
}));

app.get('/', (req: Request & { session: SessionData }, res: Response, next: NextFunction) => {
  if (!req.session.views) {
    req.session.views = 1;
    res.send('Welcome, it is your first visit!');
  } else {
    req.session.views++;
    res.send(`You have visited ${req.session.views} times.`);
  }
});

app.get('/setUser', (req: Request & { session: SessionData }, res: Response) => {
  req.session.userId = 'user123';
  res.send('User ID set!');
});

app.get('/getUser', (req: Request & { session: SessionData }, res: Response) => {
  if (req.session.userId) {
    res.send(`User ID is ${req.session.userId}`);
  } else {
    res.send('No user ID set.');
  }
});

export { app };