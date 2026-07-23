import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import redis from 'redis';

const RedisStore = connectRedis(session);
const redisClient = redis.createClient();

const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: 'superSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000,
    secure: process.env.NODE_ENV === 'production'
  }
};

const app = express();

app.use(session(sessionConfig));

export const checkSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('Logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('Logged out');
  });
});

app.get('/dashboard', checkSession, (req: Request, res: Response) => {
  res.send('Welcome to the dashboard');
});

export const server = app;