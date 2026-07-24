"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimit_1 = require("./rateLimit");
const oauth_controller_1 = require("./oauth.controller");
const oauth_middleware_1 = require("./oauth.middleware");
const router = (0, express_1.Router)();
// Apply rate limiting to ALL OAuth2 endpoints
router.post('/authorize', rateLimit_1.oauthLimiter, oauth_middleware_1.validateAuthorize, oauth_controller_1.authorize);
router.post('/token', rateLimit_1.oauthLimiter, oauth_middleware_1.validateToken, oauth_controller_1.token);
router.post('/refresh', rateLimit_1.oauthLimiter, oauth_controller_1.refresh);
router.post('/revoke', rateLimit_1.oauthLimiter, oauth_controller_1.revoke);
router.get('/protected', oauth_middleware_1.verifyAccessToken, (req, res) => {
    return res.json({
        message: 'Protected resource accessed',
        user_id: req.userId,
        scope: req.scope,
    });
});
// Introspection endpoint (also rate‑limited)
router.post('/introspect', rateLimit_1.oauthLimiter, oauth_controller_1.introspect);
exports.default = router;
