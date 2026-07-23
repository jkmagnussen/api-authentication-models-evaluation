import express, { Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';

const app = express();

const sessConfig: SessionOptions = {
  secret: 'secureSecretKey123',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
};

app.use(session(sessConfig));

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  res.send(`Page views: ${req.session.views}`);
});

app.post('/login', (req: Request, res: Response) => {
  req.session.user = { id: 1, username: 'exampleUser' };
  res.send('User logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.send('User logged out');
  });
});

export { app };