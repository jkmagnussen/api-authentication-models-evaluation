import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecretKey';
const JWT_ISSUER = process.env.JWT_ISSUER || 'yourIssuer';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'yourAudience';
const JWT_ALGORITHM: jwt.Algorithm = 'RS256'; 
const JWT_EXPIRATION = '1h';

export const createJwtToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRATION,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export const validateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM], issuer: JWT_ISSUER, audience: JWT_AUDIENCE }, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.user = decoded;
    next();
  });
};

export const authRouter = express.Router();

authRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'user' && password === 'password') {
    const token = createJwtToken({ sub: username });
    return res.json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});