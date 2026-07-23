import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

app.use(session({
  secret: 'myUniqueSecret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

const storeSessionData = (req: Request, key: string, value: any): void => {
  if (req.session) {
    req.session[key] = value;
  }
};

const retrieveSessionData = (req: Request, key: string): any => {
  return req.session ? req.session[key] : null;
};

const removeSessionData = (req: Request, key: string): void => {
  if (req.session) {
    delete req.session[key];
  }
};

app.get('/login', (req: Request, res: Response) => {
  storeSessionData(req, 'user', { id: 1, name: 'John Doe' });
  res.send('User logged in and session data stored.');
});

app.get('/profile', (req: Request, res: Response) => {
  const user = retrieveSessionData(req, 'user');
  user ? res.json(user) : res.status(404).send('User not found in session.');
});

app.get('/logout', (req: Request, res: Response) => {
  removeSessionData(req, 'user');
  res.send('User logged out and session data cleared.');
});

export { app, storeSessionData, retrieveSessionData, removeSessionData };