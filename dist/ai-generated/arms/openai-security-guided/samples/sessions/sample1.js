"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateSession = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
const sessionConfig = {
    secret: crypto_1.default.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 15, // 15 minutes
    }
};
app.use((0, express_session_1.default)(sessionConfig));
const regenerateSession = (req, res, next) => {
    req.session.regenerate((err) => {
        if (err) {
            return next(err);
        }
        next();
    });
};
exports.regenerateSession = regenerateSession;
app.post('/login', (req, res, next) => {
    // Assuming user authentication is done here
    (0, exports.regenerateSession)(req, res, () => {
        req.session.userId = req.body.userId;
        res.status(200).send('Login successful');
    });
});
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        res.clearCookie('connect.sid');
        res.status(200).send('Logged out');
    });
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
exports.default = app;
