import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
app.use(helmet());

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
}));

const validateUserInput = [
  body('username').isString().trim().isLength({ min: 3, max: 50 }),
  body('password').isString().isLength({ min: 8, max: 100 })
];

app.post('/login', validateUserInput, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  if (username === 'exampleUser' && password === 'securePassword123') {
    req.session.user = { username };
    return res.status(200).send('Login successful');
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    return next();
  }
  res.status(401).send('Unauthorized');
}

app.get('/dashboard', ensureAuthenticated, (req: Request, res: Response) => {
  res.status(200).send(`Welcome, ${req.session.user?.username}`);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

export { app, ensureAuthenticated };