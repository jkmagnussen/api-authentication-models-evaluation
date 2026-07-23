import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey: string = process.env.JWT_SECRET_KEY || 'your-secure-secret';
const tokenIssuer: string = 'your-app-issuer';
const tokenAudience: string = 'your-app-audience';
const jwtAlgorithm: jwt.Algorithm = 'HS256';
const tokenExpiry: string = '1h';

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, secretKey, {
        algorithm: jwtAlgorithm,
        expiresIn: tokenExpiry,
        audience: tokenAudience,
        issuer: tokenIssuer,
    });
};

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader: string | undefined = req.headers['authorization'];
    const token: string | undefined = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid' });
    }

    jwt.verify(token, secretKey, { algorithms: [jwtAlgorithm], audience: tokenAudience, issuer: tokenIssuer }, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token verification failed' });
        }
        req.user = user;
        next();
    });
};

const app = express();
app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const userPayload = { username };
    const token = generateToken(userPayload);
    res.json({ token });
});

app.get('/protected', verifyToken, (req: Request, res: Response) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

export default app;