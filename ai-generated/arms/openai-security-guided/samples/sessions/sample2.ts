import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

app.use(session(sessionConfig));

const regenerateSession = (req: Request, callback: (err?: any) => void) => {
  req.session.regenerate(callback);
};

const login = (req: Request, res: Response, next: NextFunction) => {
  regenerateSession(req, (err) => {
    if (err) return next(err);
    req.session.userId = req.body.userId;
    res.status(200).send('Logged in');
  });
};

const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Error in session destruction');
    } else {
      res.clearCookie('connect.sid');
      res.status(200).send('Logged out');
    }
  });
};

app.post('/login', express.json(), login);
app.post('/logout', logout);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));