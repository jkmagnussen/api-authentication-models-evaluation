import express, { Request, Response, NextFunction } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
const tokenIssuer = 'myAppIssuer';
const tokenAudience = 'myAppAudience';
const tokenAlgorithm: Algorithm = 'HS256';

interface JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized');
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, { algorithms: [tokenAlgorithm], issuer: tokenIssuer, audience: tokenAudience }, (err, payload: JwtPayload | undefined) => {
    if (err || !payload) {
      res.status(403).send('Forbidden');
      return;
    }

    req.user = {
      id: payload.sub,
      aud: payload.aud,
      iss: payload.iss,
    };
    
    next();
  });
};

export const signJWT = (userId: string): string => {
  const payload = {
    sub: userId,
    aud: tokenAudience,
    iss: tokenIssuer,
  };

  const options = {
    algorithm: tokenAlgorithm,
    expiresIn: '1h',
  };

  return jwt.sign(payload, secretKey, options);
};