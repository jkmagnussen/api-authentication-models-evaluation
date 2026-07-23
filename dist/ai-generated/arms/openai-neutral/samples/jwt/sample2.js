"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthMiddleware = jwtAuthMiddleware;
exports.generateToken = generateToken;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = 'your_super_secret_key';
function jwtAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return;
    }
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Token verification failed' });
        }
        else {
            req.user = decoded;
            next();
        }
    });
}
function generateToken(payload, expiresIn = '1h') {
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY, { expiresIn });
}
const app = (0, express_1.default)();
app.use(jwtAuthMiddleware);
app.get('/protected', (req, res) => {
    if (req.user) {
        res.status(200).json({ message: 'Protected content', user: req.user });
    }
    else {
        res.status(401).json({ error: 'Unauthorized access' });
    }
});
exports.default = app;
