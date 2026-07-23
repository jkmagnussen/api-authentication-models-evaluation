import express, { Request, Response, NextFunction, Application } from 'express';
import session from 'express-session';

const app: Application = express();

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isLoggedIn?: boolean;
  }
}

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60000 } // 1 minute
}));

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'uniqueUserId123';
  req.session.isLoggedIn = true;
  res.send('User logged in');
});

app.get('/check-session', (req: Request, res: Response) => {
  if (req.session.isLoggedIn) {
    res.send(`User is logged in. User ID: ${req.session.userId}`);
  } else {
    res.send('No active session');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.send('User logged out');
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

export { app };