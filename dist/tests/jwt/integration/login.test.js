"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe('JWT Authentication – Login', () => {
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
    test('Login returns a valid JWT', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({ email: 'test@example.com', password: 'password' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        const decoded = jsonwebtoken_1.default.decode(res.body.token);
        expect(decoded.userId).toBe('user-123');
    });
});
