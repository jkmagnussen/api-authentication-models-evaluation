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
async function resetDatabase() {
    rateLimiter_1.authLimiter.resetKey("127.0.0.1");
    rateLimiter_1.authLimiter.resetKey("::ffff:127.0.0.1");
    await safeDeleteMany(db_1.prisma.oAuthAccessToken);
    await safeDeleteMany(db_1.prisma.oAuthAuthorizationCode);
    await safeDeleteMany(db_1.prisma.passwordResetToken);
    await safeDeleteMany(db_1.prisma.auditLog);
    await safeDeleteMany(db_1.prisma.session);
    await safeDeleteMany(db_1.prisma.oAuthClient);
    await safeDeleteMany(db_1.prisma.user);
    const oauthClient = db_1.prisma.oAuthClient;
    if (oauthClient?.create) {
        // Recreate clients used in tests.
        await oauthClient.create({
            data: {
                id: "client-basic",
                name: "Basic Client",
                secret: "basic-secret",
            },
        });
        await oauthClient.create({
            data: {
                id: "client-privileged",
                name: "Privileged Client",
                secret: "privileged-secret",
            },
        });
        await oauthClient.create({
            data: {
                id: "client-admin",
                name: "Admin Client",
                secret: "admin-secret",
            },
        });
        // Legacy client used by older tests.
        await oauthClient.create({
            data: {
                id: "client-123",
                name: "Legacy Test Client",
                secret: "legacy-secret",
            },
        });
    }
}
async function resetAuthState() {
    await resetDatabase();
}
