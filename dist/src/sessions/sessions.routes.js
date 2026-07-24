"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const csurf_1 = __importDefault(require("csurf"));
const validateLogin_1 = require("../middleware/validateLogin");
const rateLimiter_1 = require("../middleware/rateLimiter");
const sessions_controller_1 = require("./sessions.controller");
const sessions_middleware_1 = require("./sessions.middleware");
const router = (0, express_1.Router)();
// Cookie-based CSRF protection
const csrfProtection = (0, csurf_1.default)({ cookie: true });
// Login (no CSRF needed)
router.post('/login', rateLimiter_1.authLimiter, validateLogin_1.validateLogin, sessions_controller_1.loginWithSession);
// Protected route (DB-backed session)
router.get('/protected', sessions_middleware_1.requireSession, sessions_controller_1.getSessionProtected);
// Logout (no CSRF needed)
router.post('/logout', sessions_controller_1.logoutSession);
// These final two routes are intended for frontend/browser use.
// Postman does not automatically handle cookies or CSRF tokens,
// so these endpoints are not used during backend API testing.
// CSRF token endpoint (frontend would call this)
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
// CSRF-protected action (requires DB session + valid CSRF token)
router.post('/protected-action', sessions_middleware_1.requireSession, csrfProtection, (_req, res) => {
    res.json({ message: 'Protected action completed' });
});
exports.default = router;
