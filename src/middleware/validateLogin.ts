import { Request, Response, NextFunction } from 'express';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!emailPattern.test(email.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Password is required' });
  }

  req.body.email = email.trim().toLowerCase();

  next();
}
