import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header is missing' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, SECRET_KEY, (err, user: JwtPayload | undefined) => {
    if (err) {
      res.status(403).json({ error: 'Token is not valid' });
      return;
    }
    
    // Attaches user info to the request object
    req.user = user;
    next();
  });
}

export function generateToken(userData: object): string {
  return jwt.sign(userData, SECRET_KEY, { expiresIn: '1h' });
}