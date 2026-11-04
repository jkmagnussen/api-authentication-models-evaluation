import express, { Request, Response } from 'express';
import session from 'express-session';
import { SessionOptions } from 'express-session';

const app = express();

const sessionConfig: SessionOptions = {
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60000, // 1 minute for demonstration
  }
};

app.use(session(sessionConfig));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome to the session demo. Refresh!');
  }
});

app.get('/reset', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to reset session');
    }
    res.send('Session reset');
  });
});

export { app };