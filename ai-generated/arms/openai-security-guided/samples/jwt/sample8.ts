import { Request, Response, NextFunction } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY as string;
const ISSUER = 'your-issuer';
const AUDIENCE = 'your-audience';
const TOKEN_ALGORITHMS: Algorithm[] = ['HS256'];
const TOKEN_EXPIRATION = '1h';

export function generateToken(payload: object): string {
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: TOKEN_ALGORITHMS[0],
    expiresIn: TOKEN_EXPIRATION,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function jwtAuthenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access token is missing or invalid');
  }

  jwt.verify(token, SECRET_KEY, { algorithms: TOKEN_ALGORITHMS, issuer: ISSUER, audience: AUDIENCE }, (err, decoded) => {
    if (err) {
      return res.status(403).send('Access token is invalid or expired');
    }
    req.user = decoded;
    next();
  });
}