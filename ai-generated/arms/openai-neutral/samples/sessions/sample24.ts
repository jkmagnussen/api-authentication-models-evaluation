import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId: string;
    isAuthenticated: boolean;
  }
}

const sessionMiddleware = session({
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true if using https
    maxAge: 60000, // 1 minute
  }
});

app.use(sessionMiddleware);

const loginHandler = (req: Request, res: Response) => {
  const { username } = req.body;
  if (username) {
    req.session.userId = username;
    req.session.isAuthenticated = true;
    res.send(`Logged in as ${username}`);
  } else {
    res.status(400).send('Username is required');
  }
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).send('Not authenticated');
  }
};

const protectedRoute = (req: Request, res: Response) => {
  res.send(`Welcome, user ${req.session.userId}`);
};

app.post('/login', loginHandler);
app.get('/protected', authMiddleware, protectedRoute);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app, sessionMiddleware, loginHandler, authMiddleware, protectedRoute };