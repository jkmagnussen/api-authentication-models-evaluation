import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

const app = express();

app.use(helmet());
app.use(express.json());

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionOptions));

const validateInput = [
  body('username').isString().trim().isLength({ min: 4, max: 20 }),
  body('password').isString().isLength({ min: 8 })
];

app.post('/login', validateInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Mock user validation logic
  if (username === 'validUser' && password === 'securePassword123') {
    req.session.userId = username;
    return res.status(200).send('Logged in successfully');
  }

  return res.status(401).send('Invalid credentials');
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.clearCookie('connect.sid');
    return res.status(200).send('Logged out successfully');
  });
});

export { app };