import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { RequestHandler } from 'express-serve-static-core';

const JWT_SECRET: Secret = process.env.JWT_SECRET!;
const JWT_ISSUER = 'YourIssuer';
const JWT_AUDIENCE = 'YourAudience';
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

export const jwtSignOptions: SignOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  algorithm: JWT_ALGORITHM,
  expiresIn: '1h'
};

const jwtVerifyOptions: VerifyOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  algorithms: [JWT_ALGORITHM]
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, jwtSignOptions);
};

export const authenticateJWT: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  jwt.verify(token, JWT_SECRET, jwtVerifyOptions, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }

    // Attach user data or token info to request object
    req.user = decoded;
    next();
  });
};

const app = express();

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
  res.send('You have access to this protected route!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});