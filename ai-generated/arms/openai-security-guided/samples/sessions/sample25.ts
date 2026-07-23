import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';

const app = express();

const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionConfig));

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session.userId) {
    return next();
  }
  res.status(401).send('Unauthorized');
}

export function login(req: Request, res: Response): void {
  const { userId } = req.body;
  if (typeof userId === 'string' && userId.trim() !== '') {
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).send('Server Error');
      }
      req.session.userId = userId;
      res.send('Login successful');
    });
  } else {
    res.status(400).send('Invalid user ID');
  }
}

export function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.send('Logout successful');
  });
}

app.post('/login', login);
app.post('/logout', ensureAuthenticated, logout);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});