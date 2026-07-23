import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 60000 }
};

app.use(session(sessionConfig));

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    return next(new Error('Session middleware is missing'));
  }
  req.session.id = req.session.id || generateSessionId();
  next();
}

function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9);
}

app.get('/', (req: Request, res: Response) => {
  if (req.session) {
    req.session.views = (req.session.views || 0) + 1;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    res.status(500).send('Session missing');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, sessionConfig };