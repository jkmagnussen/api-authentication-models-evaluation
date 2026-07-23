import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

const jwtSecretKey = process.env.JWT_SECRET_KEY || 'default_secret_key';
const expectedAudience = process.env.JWT_AUDIENCE || 'your_audience';
const expectedIssuer = process.env.JWT_ISSUER || 'your_issuer';
const allowedAlgorithms = ['HS256'];

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized: No token provided');
        return;
    }

    const token = authHeader.substring(7, authHeader.length);

    jwt.verify(token, jwtSecretKey, {
        audience: expectedAudience,
        issuer: expectedIssuer,
        algorithms: allowedAlgorithms,
        maxAge: '1h'
    }, (err: VerifyErrors | null, decoded: object | undefined) => {
        if (err) {
            res.status(403).send('Forbidden: Invalid or expired token');
            return;
        }

        req.user = decoded;
        next();
    });
}; 

const app = express();

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
    res.send('You have accessed a protected route.');
});