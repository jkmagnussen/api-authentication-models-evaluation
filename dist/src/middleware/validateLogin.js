"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = validateLogin;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email is required" });
    }
    if (!emailPattern.test(email.trim().toLowerCase())) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    if (typeof password !== "string" || !password.trim()) {
        return res.status(400).json({ error: "Password is required" });
    }
    req.body.email = email.trim().toLowerCase();
    next();
}
