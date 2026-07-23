import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

const app = express();

export const sessionConfig = session({
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 60000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use(sessionConfig);

export const logSessionInfo = (req: Request, res: Response, next: NextFunction) => {
  if (req.session) {
    console.log('Session ID:', req.session.id);
    console.log('Session Data:', req.session);
  }
  next();
};

app.use(logSessionInfo);

export const setSessionValue = (req: Request, res: Response) => {
  req.session!.views = (req.session!.views || 0) + 1;
  res.send(`You have visited this page ${req.session!.views} times`);
};

app.get('/view-count', setSessionValue);

export const logOutUser = (req: Request, res: Response) => {
  req.session!.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to destroy session');
    }
    res.redirect('/');
  });
};

app.get('/logout', logOutUser);

export const initServer = (port: number) => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};