"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionApp = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
exports.sessionApp = app;
const sessionConfig = {
    secret: 'mySuperSecretValue456!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 15, // 15 minutes
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    }
};
app.use((0, express_session_1.default)(sessionConfig));
app.get('/', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
    }
    else {
        req.session.views++;
    }
    res.send(`Page views: ${req.session.views}`);
});
