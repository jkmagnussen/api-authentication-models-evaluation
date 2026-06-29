const session = require('express-session');

export const sessionMiddleware = session({
  name: 'sid',
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true in production with HTTPS
    maxAge: 1000 * 60 * 60, // 1 hour
  }
});