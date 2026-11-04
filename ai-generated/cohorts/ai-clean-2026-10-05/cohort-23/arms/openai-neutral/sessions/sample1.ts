import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

// Session configuration
const sessionConfig: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  }
};

app.use(session(sessionConfig));

// Middleware to check if session is active
function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

// Sample login route
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'pass') {
    req.session.user = { username };
    res.send('Logged in');
  } else {
    res.status(403).send('Invalid credentials');
  }
});

// Protected route example
app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
  res.send(`Welcome ${req.session.user.username}`);
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.send('Logged out');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;