import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(crypto.randomBytes);

const app = express();

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

app.use(session(sessionConfig));

export async function renewSession(req: Request): Promise<void> {
  const newSecret = (await randomBytesAsync(64)).toString('hex');
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.secret = newSecret;
  });
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
}

app.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await renewSession(req);
    req.session.userId = req.body.userId;
    res.status(200).json({ message: 'Session created' });
  } catch (error) {
    next(error);
  }
});

app.post('/logout', logout);