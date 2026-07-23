"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = verifyJwt;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_jwt_1 = require("express-jwt");
const jwtSecret = process.env.JWT_SECRET || 'defaultSecret';
const jwtIssuer = 'your-issuer';
const jwtAudience = 'your-audience';
const jwtAlgorithms = ['HS256'];
const authenticateJWT = (0, express_jwt_1.expressjwt)({
    secret: jwtSecret,
    audience: jwtAudience,
    issuer: jwtIssuer,
    algorithms: jwtAlgorithms,
    getToken: (req) => {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        }
        return null;
    }
});
function verifyJwt(req, res, next) {
    authenticateJWT(req, res, (err) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized access' });
        }
        next();
    });
}
function generateToken(payload, expiresIn = '1h') {
    return jsonwebtoken_1.default.sign(payload, jwtSecret, {
        issuer: jwtIssuer,
        audience: jwtAudience,
        algorithm: jwtAlgorithms[0],
        expiresIn,
    });
}
