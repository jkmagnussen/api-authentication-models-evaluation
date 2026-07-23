"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroySessionOnLogout = exports.regenerateSession = void 0;
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
        sameSite: 'strict',
        maxAge: 1000 * 60 * 15,
    }
};
app.use((0, express_session_1.default)(sessionConfig));
const regenerateSession = (req, res, next) => {
    req.session.regenerate((err) => {
        if (err) {
            return next(err);
        }
        req.session.isAuthenticated = true;
        next();
    });
};
exports.regenerateSession = regenerateSession;
const destroySessionOnLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.sendStatus(200);
    });
};
exports.destroySessionOnLogout = destroySessionOnLogout;
app.post('/login', (req, res, next) => {
    // Assume user authentication logic passes here
    (0, exports.regenerateSession)(req, res, next);
});
app.post('/logout', (req, res, next) => {
    (0, exports.destroySessionOnLogout)(req, res, next);
});
exports.default = app;
