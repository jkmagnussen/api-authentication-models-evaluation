import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY: Secret = process.env.JWT_SECRET_KEY || 'default_secret';
const ISSUER = process.env.JWT_ISSUER || 'default_issuer';
const AUDIENCE = process.env.JWT_AUDIENCE || 'default_audience';
const ALGORITHM = 'HS256';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, {
        algorithms: [ALGORITHM],
        audience: AUDIENCE,
        issuer: ISSUER
    }, (err: VerifyErrors | null, decoded: object | undefined) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
};

const app = express();

app.use(authenticateJWT);

app.get('/secure-endpoint', (req: Request, res: Response) => {
    res.json({ message: 'Secure endpoint accessed', user: req.user });
});

export default app;