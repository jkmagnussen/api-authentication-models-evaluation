"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const jwt_keys_1 = require("../../../src/jwt/jwt.keys");
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
        const decodedRaw = jsonwebtoken_1.default.decode(validToken, { complete: true });
        const decoded = decodedRaw && typeof decodedRaw === 'object' && 'payload' in decodedRaw
            ? decodedRaw
            : {
                payload: {},
                header: { alg: 'HS256' },
            };
        const tokenAlgorithm = typeof decoded.header?.alg === 'string' ? decoded.header.alg : undefined;
        const payloadObject = typeof decoded.payload === 'object' && decoded.payload !== null ? decoded.payload : {};
        const { algorithm, signingKey, keyId } = (0, jwt_keys_1.getJwtSignContext)(tokenAlgorithm);
        const signOptions = { algorithm };
        if (keyId) {
            signOptions.keyid = keyId;
        }
        expiredToken = jsonwebtoken_1.default.sign({
            ...payloadObject,
            exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
        }, signingKey, signOptions);
    });
    test('Expired JWT should be rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/jwt/protected')
            .set('Authorization', `Bearer ${expiredToken}`);
        expect(res.status).toBe(401);
    });
});
