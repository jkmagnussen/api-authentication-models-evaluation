import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Secure session configuration
const sessionOptions: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
  }
};

// Middleware
app.use(helmet());
app.use(express.json());
app.use(session(sessionOptions));

// Validator middleware
const loginValidator = [
  body('username').isString().isLength({ min: 4, max: 20 }).trim(),
  body('password').isString().isLength({ min: 8 }).matches(/\d/).matches(/[A-Z]/)
];

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
};

// Routes
app.post('/login', loginValidator, (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Simulated user validation
  if (username === 'secureUser' && password === 'SecurePass123') {
    req.session.regenerate(err => {
      if (err) return res.status(500).send('Session error');
      req.session.user = { username };
      return res.status(200).send('Logged in');
    });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Session error');
    res.status(200).send('Logged out');
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { app };