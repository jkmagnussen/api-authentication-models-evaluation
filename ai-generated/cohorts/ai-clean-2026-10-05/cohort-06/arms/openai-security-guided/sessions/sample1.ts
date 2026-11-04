import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import Joi from 'joi';

const app = express();

// Validate environment variables
const envSchema = Joi.object({
  SESSION_SECRET: Joi.string().min(32).required(),
  NODE_ENV: Joi.string().valid('development', 'production').required(),
}).unknown();
const { error, value: env } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment variable validation error: ${error.message}`);
}

app.use(express.json());

// Session configuration
const sessionConfig = {
  name: 'sessionId',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'lax',
  },
  genid: () => crypto.randomBytes(16).toString('hex'),
};

app.use(session(sessionConfig));

// Middleware for input validation
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    next();
  };
};

// Example login route with input validation
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
});

app.post('/login', validateBody(loginSchema), (req: Request, res: Response) => {
  const { username } = req.body;
  req.session.user = { username };
  res.status(200).send({ message: 'Login successful' });
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ error: 'Failed to log out' });
    }
    res.clearCookie('sessionId');
    res.status(200).send({ message: 'Logout successful' });
  });
});

// Example authenticated route
app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  res.status(200).send({ message: `Welcome ${req.session.user.username}` });
});

export { app, sessionConfig, validateBody };