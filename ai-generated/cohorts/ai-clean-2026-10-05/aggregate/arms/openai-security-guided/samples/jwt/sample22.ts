import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secure-secret-key';

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: 'Authorization header missing' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Token missing' });
        return;
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Invalid token' });
            return;
        }

        req.user = user;
        next();
    });
}

export function generateToken(user: { id: string, username: string }): string {
    return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
        expiresIn: '1h',
        algorithm: 'HS256'
    });
}

export const validateTokenInput = (token: string): boolean => {
    const tokenPattern = /^[A-Za-z0-9-_.]+$/;
    return tokenPattern.test(token);
};