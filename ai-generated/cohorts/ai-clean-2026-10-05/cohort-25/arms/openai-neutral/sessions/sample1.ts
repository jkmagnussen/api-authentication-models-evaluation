import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();
const SESSION_SECRET = 'your_secret_key';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60000 }
}));

export const login = (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.body;
  if (username) {
    req.session.user = { name: username };
    res.send(`User ${username} logged in`);
  } else {
    res.status(400).send('Username is required');
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out');
    }
    res.send('Logged out');
  });
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    res.send(`Welcome ${req.session.user.name}`);
  } else {
    res.status(401).send('Not authenticated');
  }
};

app.post('/login', express.json(), login);
app.post('/logout', logout);
app.get('/protected', isAuthenticated);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});