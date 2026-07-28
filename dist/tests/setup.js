"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDeleteMany = safeDeleteMany;
exports.resetDatabase = resetDatabase;
exports.resetAuthState = resetAuthState;
const db_1 = require("../src/db");
const rateLimiter_1 = require("../src/middleware/rateLimiter");
function getModel(name) {
    const prismaRecord = db_1.prisma;
    return prismaRecord[name];
}
function isDeleteManyModel(model) {
    if (!model || typeof model !== 'object') {
        return false;
    }
    const candidate = model;
    return typeof candidate.deleteMany === 'function';
}
function isOAuthClientCreateModel(model) {
    if (!model || typeof model !== 'object') {
        return false;
    }
    const candidate = model;
    return typeof candidate.create === 'function';
}
async function safeDeleteMany(model) {
    if (!isDeleteManyModel(model))
        return;
    try {
        await model.deleteMany();
    }
    catch {
        // ignore FK errors during test cleanup
    }
}
async function safeCreateOAuthClient(id, name, secret) {
    const oauthClient = getModel('oAuthClient');
    if (!isOAuthClientCreateModel(oauthClient))
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
    await safeDeleteMany(getModel('oAuthAccessToken'));
    await safeDeleteMany(getModel('oAuthAuthorizationCode'));
    await safeDeleteMany(getModel('passwordResetToken'));
    await safeDeleteMany(getModel('auditLog'));
    await safeDeleteMany(getModel('session'));
    await safeDeleteMany(getModel('oAuthClient'));
    await safeDeleteMany(getModel('user'));
    await safeCreateOAuthClient('client-basic', 'Basic Client', 'basic-secret');
    await safeCreateOAuthClient('client-privileged', 'Privileged Client', 'privileged-secret');
    await safeCreateOAuthClient('client-admin', 'Admin Client', 'admin-secret');
    await safeCreateOAuthClient('client-123', 'Legacy Test Client', 'legacy-secret');
}
async function resetAuthState() {
    await resetDatabase();
}
