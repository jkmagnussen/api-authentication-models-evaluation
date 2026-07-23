"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtLogin = jwtLogin;
exports.jwtProtected = jwtProtected;
const user_1 = require("../auth/user");
const password_1 = require("../auth/password");
const account_security_service_1 = require("../auth/account-security.service");
const jwt_service_1 = require("./jwt.service");
const audit_service_1 = require("../security/audit.service");
async function jwtLogin(req, res) {
    const { email, password, mfaCode } = req.body;
    const user = await (0, user_1.findUserByEmail)(email);
    if (!user) {
        await (0, audit_service_1.writeAuditEvent)({ eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent"), metadata: { email } });
        return res.status(400).json({ error: "Invalid credentials" });
    }
    const valid = await (0, password_1.isValidPassword)(password, user.password);
    if (!valid) {
        await (0, audit_service_1.writeAuditEvent)({ userId: user.id, eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent") });
        return res.status(400).json({ error: "Invalid credentials" });
    }
    const mfaValid = await (0, account_security_service_1.validateMfaForUser)(user.id, mfaCode);
    if (!mfaValid) {
        await (0, audit_service_1.writeAuditEvent)({ userId: user.id, eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent"), metadata: { reason: "mfa" } });
        return res.status(401).json({ error: "MFA required or invalid code" });
    }
    const token = (0, jwt_service_1.generateJwt)(user.id);
    await (0, audit_service_1.writeAuditEvent)({ userId: user.id, eventType: "jwt.login", outcome: "success", ipAddress: req.ip, userAgent: req.get("user-agent") });
    return res.status(200).json({ token });
}
async function jwtProtected(req, res) {
    return res.json({
        message: "JWT protected route accessed",
        userId: req.userId
    });
}
