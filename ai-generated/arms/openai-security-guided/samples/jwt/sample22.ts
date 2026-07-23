import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;

if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
  throw new Error('Missing environment variables for JWT configuration');
}

const issuer = JWT_ISSUER;
const audience = JWT_AUDIENCE;
const algorithms: jwt.Algorithm[] = ['HS256'];

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    issuer,
    audience,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);

    jwt.verify(token, JWT_SECRET as string, { issuer, audience, algorithms }, (err, decoded: JwtPayload | undefined) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }
      (req as any).user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authentication token is missing or invalid' });
  }
}

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => authenticateJWT(req, res, next));

app.get('/secure-endpoint', (req: Request, res: Response) => {
  res.send('You have accessed a secure endpoint!');
});

export default app;