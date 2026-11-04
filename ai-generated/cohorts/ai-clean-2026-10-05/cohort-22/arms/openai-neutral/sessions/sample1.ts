import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    views: number;
  }
}

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

export const sessionHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome! You have visited this page 1 time.');
  }
  next();
};

app.get('/', sessionHandler);

export const startServer = () => {
  app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
  });
};