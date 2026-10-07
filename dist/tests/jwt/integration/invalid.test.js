"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
describe('JWT Authentication – Invalid Tokens', () => {
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
    test('Missing JWT returns 401', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/jwt/protected');
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('No token provided');
    });
    test('Invalid JWT returns 401', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/jwt/protected')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid token');
    });
    test('Rejects a token using an unconfigured algorithm and missing audience/issuer claims', async () => {
        const previousAlgorithm = process.env.JWT_ALGORITHM;
        const previousSecret = process.env.JWT_SECRET;
        process.env.JWT_ALGORITHM = 'RS256';
        process.env.JWT_SECRET = 'synthetic-audit-only-secret';
        // The HS256 header is deliberate; token input must not choose the verifier's algorithm.
        const token = jsonwebtoken_1.default.sign({ userId: 'user-123' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
        try {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/jwt/protected')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(401);
        }
        finally {
            if (previousAlgorithm === undefined)
                delete process.env.JWT_ALGORITHM;
            else
                process.env.JWT_ALGORITHM = previousAlgorithm;
            if (previousSecret === undefined)
                delete process.env.JWT_SECRET;
            else
                process.env.JWT_SECRET = previousSecret;
        }
    });
});
