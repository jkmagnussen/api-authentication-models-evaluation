import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors, JwtPayload } from 'jsonwebtoken';

const publicKey = process.env.JWT_PUBLIC_KEY || 'your-secure-public-key';
const jwtIssuer = 'your-app-issuer';
const jwtAudience = 'your-app-audience';

const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    publicKey,
    {
      algorithms: ['RS256'],
      issuer: jwtIssuer,
      audience: jwtAudience,
    },
    (err: VerifyErrors | null, decoded: JwtPayload | undefined) => {
      if (err) {
        res.status(403).json({ message: 'Token verification failed', error: err.message });
        return;
      }

      req.user = decoded;
      next();
    }
  );
};

export { authenticateJWT };