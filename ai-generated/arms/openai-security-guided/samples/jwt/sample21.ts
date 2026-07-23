import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';
const JWT_ISSUER = 'your-issuer';
const JWT_AUDIENCE = 'your-audience';
const JWT_ALGORITHM = 'HS256';

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid' });
    }

    jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
    }, (err, decoded: JwtPayload | undefined) => {
        if (err) {
            return res.status(403).json({ message: 'Token verification failed' });
        }

        req.user = decoded;
        next();
    });
}

export function generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: '1h'
    });
}