"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe('Session Authentication – Login', () => {
    let sessionId;
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: 'user-123',
                email: 'test@example.com',
                password: 'password',
            },
        });
    });
    test('Login creates a session row and sets a cookie', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password' });
        const cookie = res.headers['set-cookie'];
        expect(cookie).toBeDefined();
        sessionId = cookie[0].split(';')[0].split('=')[1];
        const session = await db_1.prisma.session.findUnique({
            where: { id: sessionId },
        });
        expect(session).not.toBeNull();
    });
});
