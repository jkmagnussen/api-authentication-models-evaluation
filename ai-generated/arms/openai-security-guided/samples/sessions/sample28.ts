import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionSecret = crypto.randomBytes(64).toString('hex');
const sessionStore = new session.MemoryStore();

const sessionConfig = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 30 // 30 minutes
    }
};

app.use(session(sessionConfig));

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
    req.session.regenerate((err) => {
        if (err) {
            return next(err);
        }
        res.locals.sessionID = req.sessionID;
        next();
    });
};

export const invalidateSessionOnLogout = (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to destroy session' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
    // Assume user is authenticated successfully
    req.session.userId = 'user-unique-id';
    res.status(200).json({ message: 'Login successful', sessionID: res.locals.sessionID });
});

app.post('/logout', invalidateSessionOnLogout);

export default app;