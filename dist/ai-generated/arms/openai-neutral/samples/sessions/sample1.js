"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.sessionChecker = sessionChecker;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, express_session_1.default)({
    secret: 'mySecretKey123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.get('/', (req, res) => {
    if (req.session.views) {
        req.session.views++;
        res.send(`Number of views: ${req.session.views}`);
    }
    else {
        req.session.views = 1;
        res.send('Welcome to the session demo. Refresh page!');
    }
});
function sessionChecker(req, res, next) {
    if (req.session.user && req.session.user.loggedIn) {
        next();
    }
    else {
        res.redirect('/login');
    }
}
app.get('/dashboard', sessionChecker, (req, res) => {
    res.send('Welcome to your dashboard!');
});
app.get('/login', (req, res) => {
    req.session.user = { loggedIn: true };
    res.send('You are now logged in!');
});
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out!');
        }
        res.redirect('/');
    });
});
