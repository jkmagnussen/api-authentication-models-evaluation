"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateLogin_1 = require("../middleware/validateLogin");
const rateLimiter_1 = require("../middleware/rateLimiter");
const account_security_service_1 = require("./account-security.service");
const router = (0, express_1.Router)();
router.post("/password-reset/request", rateLimiter_1.authLimiter, async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }
    const token = await (0, account_security_service_1.requestPasswordReset)(email, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
    return res.status(202).json({
        message: "If the account exists, a password reset has been initiated.",
        reset_token: token ?? undefined,
    });
});
router.post("/password-reset/confirm", rateLimiter_1.authLimiter, async (req, res) => {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (!token || !newPassword) {
        return res.status(400).json({ error: "token and newPassword are required" });
    }
    const success = await (0, account_security_service_1.confirmPasswordReset)(token, newPassword, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
    if (!success) {
        return res.status(400).json({ error: "Invalid or expired password reset token" });
    }
    return res.json({ message: "Password updated" });
});
router.post("/mfa/enroll", rateLimiter_1.authLimiter, validateLogin_1.validateLogin, async (req, res) => {
    const enrollment = await (0, account_security_service_1.startMfaEnrollment)(req.body.email, req.body.password, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
    if (!enrollment) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.json(enrollment);
});
router.post("/mfa/verify", rateLimiter_1.authLimiter, async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const code = typeof req.body.code === "string" ? req.body.code : "";
    if (!email || !code) {
        return res.status(400).json({ error: "email and code are required" });
    }
    const success = await (0, account_security_service_1.verifyMfaEnrollment)(email, code, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
    if (!success) {
        return res.status(400).json({ error: "Invalid MFA code" });
    }
    return res.json({ message: "MFA enabled" });
});
exports.default = router;
