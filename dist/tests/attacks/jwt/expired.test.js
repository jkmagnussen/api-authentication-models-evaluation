"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('JWT – Expired Token Attack Test', () => {
    let expiredToken;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: 'user-123',
                email: 'test@example.com',
                password: 'password',
            },
        });
        // Create a valid user first
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({ email: 'test@example.com', password: 'password' });
        const validToken = res.body.token;
        // Decode the valid token to reuse header + payload structure
        const decoded = jsonwebtoken_1.default.decode(validToken, { complete: true }) || {
            payload: {},
            header: { alg: 'HS256' },
        };
        // Create an expired token using the same secret
        expiredToken = jsonwebtoken_1.default.sign({
            ...decoded.payload,
            exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
        }, process.env.JWT_SECRET || 'dev-secret', // match your app's secret
        { algorithm: decoded.header?.alg || 'HS256' });
    });
    test('Expired JWT should be rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/jwt/protected')
            .set('Authorization', `Bearer ${expiredToken}`);
        expect(res.status).toBe(401);
    });
});
