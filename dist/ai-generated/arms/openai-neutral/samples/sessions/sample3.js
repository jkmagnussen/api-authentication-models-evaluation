"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionData = getSessionData;
exports.setSessionData = setSessionData;
exports.clearSession = clearSession;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
const sessionConfig = {
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
};
app.use((0, express_session_1.default)(sessionConfig));
function getSessionData(req, res) {
    if (req.session && req.session.userID) {
        res.json({ userID: req.session.userID, msg: 'Session Data Retrieved' });
    }
    else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
function setSessionData(req, res) {
    if (req.body.userID) {
        req.session.userID = req.body.userID;
        res.json({ msg: 'Session Data Stored', userID: req.session.userID });
    }
    else {
        res.status(400).json({ error: 'userID required' });
    }
}
function clearSession(req, res) {
    req.session.destroy(err => {
        if (err) {
            res.status(500).json({ error: 'Failed to destroy session' });
        }
        else {
            res.json({ msg: 'Session Cleared' });
        }
    });
}
app.post('/login', setSessionData);
app.get('/profile', getSessionData);
app.post('/logout', clearSession);
exports.default = app;
