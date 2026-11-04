import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

declare module 'express-session' {
    interface SessionData {
        userId?: string;
    }
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sessionOptions: session.SessionOptions = {
    secret: crypto.randomBytes(64).toString('hex'), 
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 // 1 hour
    }
};

app.use(session(sessionOptions));

const validateInput = [
    body('username')
        .isAlphanumeric().withMessage('Username must be alphanumeric')
        .isLength({ min: 4, max: 20 }).withMessage('Username must be between 4 to 20 characters long'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

app.post('/login', validateInput, (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (username === 'testUser' && password === 'testPassword123') {
        req.session.userId = 'uniqueUserId';
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
});

app.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Failed to logout' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

export { app };