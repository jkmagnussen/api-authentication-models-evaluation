import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    views: number;
  }
}

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // secure: true if using HTTPS
}));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome to the session demo. Refresh the page!');
  }
});

export { app };