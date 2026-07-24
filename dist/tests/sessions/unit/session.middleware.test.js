"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../../src/db");
const sessions_middleware_1 = require("../../../src/sessions/sessions.middleware");
const bcrypt_1 = __importDefault(require("bcrypt"));
const setup_1 = require("../../setup");
describe('Session Middleware – Unit Tests', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: 'user-123',
                email: 'test@example.com',
                password: await bcrypt_1.default.hash('password', 10),
            },
        });
    });
    test('Rejects missing cookie', async () => {
        const req = { cookies: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        await (0, sessions_middleware_1.requireSession)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'No session cookie' });
        expect(next).not.toHaveBeenCalled();
    });
    test('Rejects invalid session', async () => {
        const req = { cookies: { sessionId: 'invalid' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        await (0, sessions_middleware_1.requireSession)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid session' });
        expect(next).not.toHaveBeenCalled();
    });
    test('Allows valid session', async () => {
        const session = await db_1.prisma.session.create({
            data: {
                id: 'valid-session',
                userId: 'user-123',
                expiresAt: new Date(Date.now() + 10000),
            },
        });
        const req = { cookies: { sessionId: session.id } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        await (0, sessions_middleware_1.requireSession)(req, res, next);
        expect(req.userId).toBe('user-123');
        expect(next).toHaveBeenCalled();
    });
});
