import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';

const RedisStore = connectRedis(session);

const redisClient = new Redis({
  host: 'localhost',
  port: 6379
});

export const app = express();

export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: 'superSecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
});

app.use(sessionMiddleware);

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.post('/login', (req: Request, res: Response) => {
  req.session.userId = req.body.userId;
  res.send('Logged in');
});

app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.send('Logged out');
  });
});