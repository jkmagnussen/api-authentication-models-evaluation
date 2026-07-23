import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

const secretKey = 'your-secure-secret-key'; // Use environment variable in production
const validIssuer = 'your-trusted-issuer';
const validAudience = 'your-trusted-audience';
const tokenAlgorithms: jwt.Algorithm[] = ['HS256'];

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        secretKey,
        { algorithms: tokenAlgorithms, issuer: validIssuer, audience: validAudience },
        (err: VerifyErrors, decodedToken: object | undefined) => {
            if (err) {
                return res.status(401).json({ error: 'Failed to authenticate token' });
            }

            req.user = decodedToken;
            next();
        }
    );
}

const app = express();

app.use(jwtAuthMiddleware);

app.get('/secure-route', (req, res) => {
    res.send('This is a secure route');
});

export { app };