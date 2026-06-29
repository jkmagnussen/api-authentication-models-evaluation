import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '../services/authServices';

export async function loginWithSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = user.id;

    return res.json({
      message: 'Session created',
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

export function getSessionProtected(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  return res.json({
    message: 'Protected route accessed',
    userId: req.session.userId
  });
}

export function logoutSession(req: Request, res: Response) {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
}
