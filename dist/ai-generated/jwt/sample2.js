"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenHandler = exports.protectedRouteHandler = exports.loginHandler = exports.verifyJwtToken = exports.generateAccessToken = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const generateAccessToken = (userId, email) => {
    const payload = {
        userId,
        email,
    };
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};
exports.generateAccessToken = generateAccessToken;
const verifyJwtToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: "Token has expired" });
        }
        else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({ error: "Invalid token" });
        }
        else {
            res.status(500).json({ error: "Token verification failed" });
        }
    }
};
exports.verifyJwtToken = verifyJwtToken;
const loginHandler = (req, res) => {
    const { userId, email } = req.body;
    if (!userId || !email) {
        res.status(400).json({ error: "userId and email are required" });
        return;
    }
    const token = (0, exports.generateAccessToken)(userId, email);
    res.json({ token, expiresIn: "1h" });
};
exports.loginHandler = loginHandler;
const protectedRouteHandler = (req, res) => {
    res.json({
        message: "Access granted to protected resource",
        user: req.user,
    });
};
exports.protectedRouteHandler = protectedRouteHandler;
const refreshTokenHandler = (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
    }
    const newToken = (0, exports.generateAccessToken)(req.user.userId, req.user.email);
    res.json({ token: newToken, expiresIn: "1h" });
};
exports.refreshTokenHandler = refreshTokenHandler;
app.post("/login", exports.loginHandler);
app.post("/refresh", exports.verifyJwtToken, exports.refreshTokenHandler);
app.get("/protected", exports.verifyJwtToken, exports.protectedRouteHandler);
app.get("/profile", exports.verifyJwtToken, (req, res) => {
    res.json({ profile: `Profile for user ${req.user?.email}` });
});
app.post("/logout", (req, res) => {
    res.json({ message: "Successfully logged out" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
