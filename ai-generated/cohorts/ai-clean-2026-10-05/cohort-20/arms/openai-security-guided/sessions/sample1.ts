import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const RedisStore = connectRedis(session);
const redisClient = createClient({ url: process.env.REDIS_URL });

const app = express();

// Secure Headers
app.use(helmet());

// Session Configuration
const sessionOptions: session.SessionOptions = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minutes
    sameSite: 'lax',
  },
};

app.use(session(sessionOptions));

// Input Validation Middleware
const validateInput = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send('Invalid input');
  }
  next();
};

// Example Route
app.post('/login', validateInput, (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Very basic validation, should be replaced by a secure user authentication service
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).send('Invalid username or password format');
  }

  if (username === 'admin' && password === 'password') {
    req.session.user = { username };
    return res.status(200).send('Logged in successfully');
  } else {
    return res.status(401).send('Unauthorized');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid');
    return res.status(200).send('Logged out successfully');
  });
});

export { app, redisClient };