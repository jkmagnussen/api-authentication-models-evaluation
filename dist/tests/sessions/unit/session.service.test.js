"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ⭐ Mock Prisma FIRST — before importing the service
jest.mock('../../../src/db', () => ({
    prisma: {
        session: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}));
const db_1 = require("../../../src/db");
const config_1 = __importDefault(require("../../../src/config"));
const session_service_1 = require("../../../src/sessions/session.service");
describe('Session Service – Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('createSession creates a session with correct fields', async () => {
        const startedAt = Date.now();
        const fakeSession = {
            id: 'session-123',
            userId: 'user-123',
            expiresAt: new Date(Date.now() + 3600000),
        };
        db_1.prisma.session.create.mockResolvedValue(fakeSession);
        const session = await (0, session_service_1.createSession)('user-123');
        expect(db_1.prisma.session.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-123',
                expiresAt: expect.any(Date),
            },
        });
        const createCall = db_1.prisma.session.create.mock.calls[0][0];
        expect(createCall.data.expiresAt.getTime()).toBeGreaterThanOrEqual(startedAt + config_1.default.session.ttlSeconds * 1000);
        expect(session).toEqual(fakeSession);
    });
    test('createSessionWithId applies the configured TTL after replacing the supplied session ID', async () => {
        const startedAt = Date.now();
        db_1.prisma.session.deleteMany.mockResolvedValue({ count: 0 });
        db_1.prisma.session.create.mockResolvedValue({});
        await (0, session_service_1.createSessionWithId)('user-123', 'fixed-session');
        expect(db_1.prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'fixed-session' } });
        const createCall = db_1.prisma.session.create.mock.calls[0][0];
        expect(createCall.data).toMatchObject({ id: 'fixed-session', userId: 'user-123' });
        expect(createCall.data.expiresAt.getTime()).toBeGreaterThanOrEqual(startedAt + config_1.default.session.ttlSeconds * 1000);
    });
    test('findSession returns a session when it exists', async () => {
        const fakeSession = {
            id: 'session-123',
            userId: 'user-123',
            expiresAt: new Date(Date.now() + 3600000),
        };
        db_1.prisma.session.findUnique.mockResolvedValue(fakeSession);
        const found = await (0, session_service_1.findSession)('session-123');
        expect(db_1.prisma.session.findUnique).toHaveBeenCalledWith({
            where: { id: 'session-123' },
        });
        expect(found).toEqual(fakeSession);
    });
    test('deleteSession removes a session', async () => {
        db_1.prisma.session.delete.mockResolvedValue({});
        await (0, session_service_1.deleteSession)('session-123');
        expect(db_1.prisma.session.delete).toHaveBeenCalledWith({
            where: { id: 'session-123' },
        });
    });
});
