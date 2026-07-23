import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const RedisStore = connectRedis(session);
const redisClient = new Redis(process.env.REDIS_URL || '');

export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60, // 1 hour
  }
});

const app = express();
app.use(sessionMiddleware);

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    req.session.userId = req.user?.id; // Assuming req.user is populated
    next();
  });
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.status(200).send('Logged out successfully');
  });
};

app.post('/login', (req: Request, res: Response, next: NextFunction) => {
  // authenticateUser logic here
  regenerateSession(req, res, next);
});

app.post('/logout', logoutUser);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});