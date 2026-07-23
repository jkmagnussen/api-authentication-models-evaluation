import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'defaultSecretKey';
const jwtIssuer = 'yourIssuer';
const jwtAudience = 'yourAudience';
const jwtAlgorithm: jwt.Algorithm = 'HS256';
const tokenExpiry = '1h';

export function generateToken(payload: object): string {
  return jwt.sign(payload, jwtSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
    algorithm: jwtAlgorithm,
    expiresIn: tokenExpiry,
  });
}

export function jwtAuthenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(
    token,
    jwtSecret,
    { algorithms: [jwtAlgorithm], audience: jwtAudience, issuer: jwtIssuer },
    (err, decoded: JwtPayload | undefined) => {
      if (err) {
        return res.status(401).json({ error: 'Failed to authenticate token' });
      }

      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      req.user = decoded;
      next();
    }
  );
}

export const app = express();

app.use(jwtAuthenticationMiddleware);

app.get('/secure-endpoint', (req: Request, res: Response) => {
  res.json({ message: 'Secure data accessed', user: req.user });
});