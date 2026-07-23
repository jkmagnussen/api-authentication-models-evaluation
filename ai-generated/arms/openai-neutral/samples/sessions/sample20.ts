import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const sessionOptions: session.SessionOptions = {
    secret: 'mySuperSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60000 
    }
};

const app = express();

// Apply session middleware
app.use(session(sessionOptions));

// Skipped adding middleware or routes for brevity

export const getSessionData = (req: Request): any => {
    return req.session;
};

export const setSessionData = (req: Request, key: string, value: any): void => {
    if (req.session) {
        req.session[key] = value;
    }
};

export const clearSessionData = (req: Request): void => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Failed to destroy session:', err);
            }
        });
    }
};

app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
        return next(new Error('Session not initialized'));
    }
    next();
});

app.get('/set', (req: Request, res: Response) => {
    setSessionData(req, 'username', 'JohnDoe');
    res.send('Session data set');
});

app.get('/get', (req: Request, res: Response) => {
    const username = getSessionData(req)?.username;
    res.send(`Session data: ${username}`);
});

app.get('/clear', (req: Request, res: Response) => {
    clearSessionData(req);
    res.send('Session cleared');
});

export default app;