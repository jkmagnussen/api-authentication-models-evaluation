import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET_KEY, JWT_ISSUER, JWT_AUDIENCE } = process.env;

if (!JWT_SECRET_KEY || !JWT_ISSUER || !JWT_AUDIENCE) {
  throw new Error('Missing JWT configurations in environment variables');
}

interface JwtRequest extends Request {
  user?: string | JwtPayload;
}

const authenticateJwt = (req: JwtRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  jwt.verify(token, JWT_SECRET_KEY, { 
    algorithms: ['HS256'], 
    issuer: JWT_ISSUER, 
    audience: JWT_AUDIENCE 
  }, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token.');
    }
    req.user = decoded;
    next();
  });
};

export { authenticateJwt };