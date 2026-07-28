"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDeleteMany = safeDeleteMany;
exports.resetDatabase = resetDatabase;
exports.resetAuthState = resetAuthState;
const db_1 = require("../src/db");
const rateLimiter_1 = require("../src/middleware/rateLimiter");
async function safeDeleteMany(model) {
    if (!model?.deleteMany)
        return;
    try {
        await model.deleteMany();
    }
    catch {
        // ignore FK errors during test cleanup
    }
}
async function safeCreateOAuthClient(id, name, secret) {
    const oauthClient = db_1.prisma.oAuthClient;
    if (!oauthClient?.create)
        return;
    try {
        await oauthClient.create({
            data: { id, name, secret },
        });
    }
    catch {
        // ignore if the client already exists during test reset
    }
}
async function resetDatabase() {
    rateLimiter_1.authLimiter.resetKey('127.0.0.1');
    rateLimiter_1.authLimiter.resetKey('::ffff:127.0.0.1');
    await safeDeleteMany(db_1.prisma.oAuthAccessToken);
    await safeDeleteMany(db_1.prisma.oAuthAuthorizationCode);
    await safeDeleteMany(db_1.prisma.passwordResetToken);
    await safeDeleteMany(db_1.prisma.auditLog);
    await safeDeleteMany(db_1.prisma.session);
    await safeDeleteMany(db_1.prisma.oAuthClient);
    await safeDeleteMany(db_1.prisma.user);
    await safeCreateOAuthClient('client-basic', 'Basic Client', 'basic-secret');
    await safeCreateOAuthClient('client-privileged', 'Privileged Client', 'privileged-secret');
    await safeCreateOAuthClient('client-admin', 'Admin Client', 'admin-secret');
    await safeCreateOAuthClient('client-123', 'Legacy Test Client', 'legacy-secret');
}
async function resetAuthState() {
    await resetDatabase();
}
