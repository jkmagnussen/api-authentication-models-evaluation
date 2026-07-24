"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithSession = loginWithSession;
exports.logoutSession = logoutSession;
exports.getSessionProtected = getSessionProtected;
const user_1 = require("../auth/user");
const password_1 = require("../auth/password");
const session_service_1 = require("./session.service");
const session_service_2 = require("./session.service");
const variant_overrides_1 = require("../variant-overrides");
const config_1 = __importDefault(require("../config"));
const account_security_service_1 = require("../auth/account-security.service");
const audit_service_1 = require("../security/audit.service");
async function loginWithSession(req, res, next) {
    try {
        const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
        const regenerateOnLogin = variantOverrides.sessions?.regenerateOnLogin ?? true;
        const sessionCookieOverride = variantOverrides.sessions?.cookie;
        const { email, password, mfaCode } = req.body;
        const user = await (0, user_1.findUserByEmail)(email);
        if (!user) {
            await (0, audit_service_1.writeAuditEvent)({
                eventType: 'session.login',
                outcome: 'failure',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: { email },
            });
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const match = await (0, password_1.isValidPassword)(password, user.password);
        if (!match) {
            await (0, audit_service_1.writeAuditEvent)({
                userId: user.id,
                eventType: 'session.login',
                outcome: 'failure',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const mfaValid = await (0, account_security_service_1.validateMfaForUser)(user.id, mfaCode);
        if (!mfaValid) {
            await (0, audit_service_1.writeAuditEvent)({
                userId: user.id,
                eventType: 'session.login',
                outcome: 'failure',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: { reason: 'mfa' },
            });
            return res.status(401).json({ message: 'MFA required or invalid code' });
        }
        const existingSessionId = req.cookies?.sessionId;
        if (existingSessionId && regenerateOnLogin) {
            await (0, session_service_2.deleteSession)(existingSessionId).catch(() => undefined);
        }
        const session = existingSessionId && !regenerateOnLogin
            ? await (0, session_service_2.createSessionWithId)(user.id, existingSessionId)
            : await (0, session_service_1.createSession)(user.id);
        res.cookie('sessionId', session.id, {
            httpOnly: sessionCookieOverride?.httpOnly ?? config_1.default.cookie.httpOnly,
            secure: sessionCookieOverride?.secure ?? config_1.default.cookie.secure,
            sameSite: sessionCookieOverride?.sameSite ?? config_1.default.cookie.sameSite,
            domain: config_1.default.cookie.domain,
            maxAge: config_1.default.cookie.maxAgeMs,
        });
        await (0, audit_service_1.writeAuditEvent)({
            userId: user.id,
            eventType: 'session.login',
            outcome: 'success',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return res.status(200).json({
            message: 'Session created',
            user: { id: user.id, email: user.email },
        });
    }
    catch (err) {
        next(err);
    }
}
async function logoutSession(req, res) {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    const invalidateSessionOnLogout = variantOverrides.sessions?.invalidateSessionOnLogout ?? true;
    const sessionId = req.cookies.sessionId;
    if (sessionId && invalidateSessionOnLogout) {
        await (0, session_service_2.deleteSession)(sessionId); // delete from DB
    }
    res.clearCookie('sessionId', {
        httpOnly: config_1.default.cookie.httpOnly,
        secure: config_1.default.cookie.secure,
        sameSite: config_1.default.cookie.sameSite,
        domain: config_1.default.cookie.domain,
    }); // remove cookie
    await (0, audit_service_1.writeAuditEvent)({
        eventType: 'session.logout',
        outcome: 'success',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
    });
    return res.json({ message: 'Logged out' });
}
function getSessionProtected(req, res) {
    return res.json({
        message: 'Protected route accessed',
        userId: req.userId, // set by requireSession middleware
    });
}
