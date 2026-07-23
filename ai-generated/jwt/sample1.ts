import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'defaultSecret';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'yourAudience';
const JWT_ISSUER = process.env.JWT_ISSUER || 'yourIssuer';
const JWT_ALGORITHM = 'HS256';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized access: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, {
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    algorithms: [JWT_ALGORITHM]
  }, (err: VerifyErrors | null, decoded: object | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const app = express();
app.use(authenticateJWT);
app.listen(3000, () => console.log('Server running on port 3000'));