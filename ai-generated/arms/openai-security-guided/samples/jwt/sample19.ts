import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const allowedAudience = 'yourAudience';
const expectedIssuer = 'yourIssuer';
const jwtSecret = process.env.JWT_SECRET || 'yourSecretKey';
const tokenAlgorithms: jwt.Algorithm[] = ['HS256'];

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access token is missing or invalid' });
    return;
  }
  
  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecret, { algorithms: tokenAlgorithms, audience: allowedAudience, issuer: expectedIssuer }, (err: VerifyErrors | null, decodedToken: JwtPayload | undefined) => {
    if (err) {
      res.status(403).json({ message: 'Token verification failed' });
      return;
    }

    if (decodedToken) {
      req.user = decodedToken;
      next();
    }
  });
}