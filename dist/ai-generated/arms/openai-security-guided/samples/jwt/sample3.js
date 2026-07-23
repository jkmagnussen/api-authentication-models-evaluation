"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = authenticateJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secretKey = process.env.JWT_SECRET || '';
const expectedAudience = process.env.JWT_AUDIENCE || '';
const expectedIssuer = process.env.JWT_ISSUER || '';
const tokenExpiration = '1h'; // default expiration
const jwtAlgorithm = 'HS256';
if (!secretKey || !expectedAudience || !expectedIssuer) {
    throw new Error('Missing JWT configuration in environment variables');
}
const verifyJwtOptions = {
    algorithms: [jwtAlgorithm],
    audience: expectedAudience,
    issuer: expectedIssuer,
};
function authenticateJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is missing' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token is missing' });
    }
    jsonwebtoken_1.default.verify(token, secretKey, verifyJwtOptions, (err, decoded) => {
        if (err || !decoded) {
            return res.status(403).json({ error: 'Token verification failed' });
        }
        req.user = decoded;
        next();
    });
}
