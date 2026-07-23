import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

const sessionConfig: SessionOptions = {
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  genid: () => uuidv4(),
};

app.use(session(sessionConfig));

const sessionLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Session ID: ${req.sessionID}`);
  console.log(`Session Data: ${JSON.stringify(req.session)}`);
  next();
};

app.use(sessionLogger);

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Welcome! You've visited this page ${req.session.views} times.`);
});

app.post('/session-reset', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error resetting session');
    }
    res.send('Session reset successful');
  });
});

export { app, sessionConfig };