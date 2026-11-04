import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in environment variables');
}

app.use(session({
  name: 'sessionId',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
}));

app.post('/login', [
  body('username').isString().isLength({ min: 1 }).trim().escape(),
  body('password').isString().isLength({ min: 6 }).trim().escape()
], (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { username, password } = req.body;

  // Dummy authentication check
  if (username === 'admin' && password === 'securepassword') {
    req.session.user = { username };
    return res.status(200).send('Login successful');
  }

  res.status(401).send('Invalid credentials');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out');
    }
    res.status(200).send('Logout successful');
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.user) {
    return res.status(200).json({ user: req.session.user });
  }
  res.status(401).send('Unauthorized');
});

const startServer = () => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

export { app, startServer };