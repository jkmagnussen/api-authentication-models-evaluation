"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;
if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
    throw new Error('Environment variables JWT_SECRET, JWT_ISSUER, or JWT_AUDIENCE not set');
}
const tokenAlgorithms = ['HS256'];
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token missing or malformed' });
    }
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, JWT_SECRET, {
        algorithms: tokenAlgorithms,
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER
    }, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token verification failed' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateJWT = authenticateJWT;
