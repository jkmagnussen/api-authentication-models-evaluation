import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

app.use(express.json());

const sessionHandler = session({
  secret: 'mySecretKey123!',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use(sessionHandler);

export const getSessionInfo = (req: Request, res: Response) => {
  if (req.session?.userId) {
    res.status(200).json({ message: 'Session active', userId: req.session.userId });
  } else {
    res.status(200).json({ message: 'No active session' });
  }
};

export const setSessionInfo = (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    req.session.userId = userId;
    res.status(200).json({ message: 'Session initialized', userId });
  } else {
    res.status(400).json({ error: 'UserId is required' });
  }
};

export const clearSession = (req: Request, res: Response) => {
  req.session.destroy((err: Error) => {
    if (err) {
      res.status(500).json({ error: 'Failed to destroy session' });
    } else {
      res.status(200).json({ message: 'Session cleared' });
    }
  });
};

app.get('/session', getSessionInfo);
app.post('/session', setSessionInfo);
app.delete('/session', clearSession);

export default app;