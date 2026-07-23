import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
}

const secretKey = process.env.JWT_SECRET || 'defaultSecret';
const validAudience = 'yourAppAudience';
const validIssuer = 'yourAppIssuer';

export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, secretKey, {
      algorithms: ['HS256'],
      audience: validAudience,
      issuer: validIssuer
    }) as JwtPayload;

    req.user = { id: decodedToken.sub };
    next();
  } catch (error) {
    const err = error as VerifyErrors;
    res.status(401).json({ message: `Token verification failed: ${err.message}` });
  }
}