import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const application = express();

application.use(
    session({
        secret: 'mySuperSecretString',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            secure: process.env.NODE_ENV === 'production', // Secure cookies in production
        },
    })
);

application.get('/login', (req: Request, res: Response, next: NextFunction) => {
    if (req.session) {
        req.session.user = { id: 1, name: 'John Doe' };
        res.send('User logged in.');
    } else {
        next(new Error('Session not initialized'));
    }
});

application.get('/profile', (req: Request, res: Response) => {
    if (req.session && req.session.user) {
        res.send(`Hello, ${req.session.user.name}`);
    } else {
        res.status(401).send('Unauthorized');
    }
});

application.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).send(err.message);
});

export { application };