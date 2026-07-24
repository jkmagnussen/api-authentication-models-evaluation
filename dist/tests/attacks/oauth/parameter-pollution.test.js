"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
describe('Parameter pollution / duplicate-parameter attacks', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: 'test@example.com',
                password: 'hashed-password',
            },
        });
    });
    it('rejects polluted userId array on authorize', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/oauth/authorize')
            .send({
            userId: [validUUID, '11111111-1111-1111-1111-111111111111'],
            clientId: 'client-basic',
            scope: 'read',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('userId must be a string');
    });
    it('rejects polluted authorization code array on token', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/oauth/token')
            .send({
            code: ['code-a', 'code-b'],
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('authorization code is required and must be a string');
    });
});
