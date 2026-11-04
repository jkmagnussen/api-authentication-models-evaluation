import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

const app = express();

// Session configuration
const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60000 // Session expires after 1 minute
  }
};

// Initialize session middleware
app.use(session(sessionOptions));

// Middleware to check session
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.isLoggedIn) {
    return next();
  }
  res.status(401).send('Unauthorized');
}

// Login route
app.post('/login', (req: Request, res: Response) => {
  // Simulate login logic here
  req.session.isLoggedIn = true;
  req.session.user = { id: 1, username: 'user' };
  res.send('Logged in');
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('Logged out');
  });
});

// Protected route
app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
  res.send(`Hello ${req.session.user?.username}`);
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
export const startServer = () => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};