import express from 'express';
import session from 'express-session';

const app = express();
const PORT = 3000;

const sessionOptions: session.SessionOptions = {
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
        secure: false, // Set to true in production with HTTPS
    }
};

app.use(session(sessionOptions));

app.get('/', (req, res) => {
    if (req.session.views) {
        req.session.views++;
        res.send(`Number of views: ${req.session.views}`);
    } else {
        req.session.views = 1;
        res.send("Welcome! Refresh to track the number of views.");
    }
});

app.get('/reset', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.sendStatus(500);
        }
        res.send('Session reset successful.');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export { app, sessionOptions };