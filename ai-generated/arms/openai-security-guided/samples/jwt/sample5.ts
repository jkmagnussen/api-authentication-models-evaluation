import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload, VerifyOptions } from 'jsonwebtoken';

const jwtSecret: Secret = process.env.JWT_SECRET || 'your-secure-secret';
const jwtIssuer = 'your-issuer';
const jwtAudience = 'your-audience';
const jwtAlgorithm: jwt.Algorithm = 'HS256';

const jwtValidationOptions: VerifyOptions = {
  algorithms: [jwtAlgorithm],
  issuer: jwtIssuer,
  audience: jwtAudience,
  maxAge: '1h'
};

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecret, jwtValidationOptions, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token' });
    }
    
    req.user = decoded;
    next();
  });
}