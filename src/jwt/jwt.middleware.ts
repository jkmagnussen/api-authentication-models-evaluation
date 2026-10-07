import { Request, Response, NextFunction } from 'express';
import { getJwtAudience, getJwtIssuer, verifyJwt } from './jwt.service';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const bearerMatch = header.trim().match(/^Bearer\s+(\S+)$/i);
  if (!bearerMatch) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const token = bearerMatch[1];

  try {
    const decoded = verifyJwt(token);

    if (!decoded?.userId || typeof decoded.userId !== 'string') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const expectedAudience = getJwtAudience();
    const expectedIssuer = getJwtIssuer();

    if (decoded.aud && decoded.aud !== expectedAudience) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (decoded.iss && decoded.iss !== expectedIssuer) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    (req as any).userId = decoded.userId;
    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
}
