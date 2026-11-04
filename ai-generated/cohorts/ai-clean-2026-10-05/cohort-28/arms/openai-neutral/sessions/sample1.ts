import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();

// Session configuration
const sessionConfig = {
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
};

app.use(session(sessionConfig));

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.session.user) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

// Login route
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Dummy authentication logic
  if (username === 'user' && password === 'pass') {
    req.session.user = { name: username };
    res.send('Login successful');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Protected route
app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
  res.send(`Welcome to your dashboard, ${req.session.user.name}`);
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('Logout successful');
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };