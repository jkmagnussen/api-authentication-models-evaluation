import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyOptions, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';
const JWT_ISSUER = 'your-app-issuer';
const JWT_AUDIENCE = 'your-app-audience';
const JWT_ALGORITHM = 'HS256';

const verifyOptions: VerifyOptions = {
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  maxAge: '1h'
};

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).send({ message: 'No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, verifyOptions, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access.' });
    }
    req.user = decoded;
    next();
  });
};