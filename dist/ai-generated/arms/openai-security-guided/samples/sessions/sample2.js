"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateSession = exports.regenerateSession = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
const sessionMiddleware = (0, express_session_1.default)({
    secret: crypto_1.default.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});
app.use(sessionMiddleware);
const regenerateSession = (req, res, next) => {
    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).send('Session regeneration failed');
        }
        next();
    });
};
exports.regenerateSession = regenerateSession;
const invalidateSession = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to destroy session');
        }
        res.clearCookie('connect.sid').status(200).send('Session terminated');
    });
};
exports.invalidateSession = invalidateSession;
app.post('/login', (req, res, next) => {
    (0, exports.regenerateSession)(req, res, () => {
        req.session.user = { id: 'user-id', name: 'username' }; // Example user object
        res.status(200).send('Logged in');
    });
});
app.post('/logout', (req, res) => {
    (0, exports.invalidateSession)(req, res);
});
exports.default = app;
