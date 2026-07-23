"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.createSessionWithId = createSessionWithId;
exports.deleteSession = deleteSession;
exports.findSession = findSession;
exports.findUserByEmail = findUserByEmail;
const db_1 = require("../db");
async function createSession(userId) {
    return db_1.prisma.session.create({
        data: {
            userId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        },
    });
}
async function createSessionWithId(userId, sessionId) {
    await db_1.prisma.session.deleteMany({ where: { id: sessionId } });
    return db_1.prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
    });
}
async function deleteSession(sessionId) {
    return db_1.prisma.session.delete({
        where: { id: sessionId },
    });
}
async function findSession(sessionId) {
    return db_1.prisma.session.findUnique({
        where: { id: sessionId },
    });
}
// ⭐ Add this back — sessions login needs it
async function findUserByEmail(email) {
    return db_1.prisma.user.findUnique({
        where: { email },
    });
}
