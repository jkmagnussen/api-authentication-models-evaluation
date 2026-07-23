import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'defaultSecret';
const expectedAudience = 'yourAudience';
const expectedIssuer = 'yourIssuer';
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];
const tokenLifetime = '1h';

export function generateToken(payload: object): string {
  return jwt.sign(payload, secretKey, {
    algorithm: jwtAlgorithms[0],
    expiresIn: tokenLifetime,
    audience: expectedAudience,
    issuer: expectedIssuer,
  });
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7, authHeader.length);
    jwt.verify(token, secretKey, {
      algorithms: jwtAlgorithms,
      audience: expectedAudience,
      issuer: expectedIssuer,
    }, (err: VerifyErrors | null, decoded: JwtPayload | undefined) => {
      if (err) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'Token not provided' });
  }
}