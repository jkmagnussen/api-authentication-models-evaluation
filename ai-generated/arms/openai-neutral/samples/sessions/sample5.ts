import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKeyHere',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: false // set true in production
  },
  genid: (req: Request): string => {
    return uuidv4(); // use UUIDs for session IDs
  }
};

app.use(session(sessionOptions));

export const createSession = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
    console.log('New session created:', req.session.userId);
  }
  next();
};

export const getSessionInfo = (req: Request, res: Response): void => {
  if (req.session.userId) {
    res.status(200).json({ sessionId: req.session.userId });
  } else {
    res.status(404).json({ message: 'No session found' });
  }
};

export const destroySession = (req: Request, res: Response): void => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ message: 'Failed to destroy session' });
    } else {
      res.status(200).json({ message: 'Session destroyed successfully' });
    }
  });
};

app.use(createSession);

app.get('/session', getSessionInfo);

app.delete('/session', destroySession);

export default app;