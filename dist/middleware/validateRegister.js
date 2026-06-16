"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = validateRegister;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateRegister(req, res, next) {
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
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    req.body.email = email.trim().toLowerCase();
    next();
}
