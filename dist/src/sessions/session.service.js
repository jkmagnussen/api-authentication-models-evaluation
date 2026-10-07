"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.createSessionWithId = createSessionWithId;
exports.deleteSession = deleteSession;
exports.findSession = findSession;
exports.findUserByEmail = findUserByEmail;
const db_1 = require("../db");
const config_1 = __importDefault(require("../config"));
function getSessionExpiry() {
    // Keep persisted session validity aligned with the configured session lifetime.
    return new Date(Date.now() + config_1.default.session.ttlSeconds * 1000);
}
async function createSession(userId) {
    return db_1.prisma.session.create({
        data: {
            userId,
            expiresAt: getSessionExpiry(),
        },
    });
}
async function createSessionWithId(userId, sessionId) {
    await db_1.prisma.session.deleteMany({ where: { id: sessionId } });
    return db_1.prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt: getSessionExpiry(),
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
