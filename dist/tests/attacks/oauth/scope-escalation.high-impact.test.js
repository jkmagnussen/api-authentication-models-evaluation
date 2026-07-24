"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const oauth_service_1 = require("../../../src/oauth/oauth.service");
const setup_1 = require("../../setup");
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
describe('OAuth scope escalation high-impact', () => {
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
    it('rejects multi-scope escalation for basic client', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read write admin',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_scope');
    });
    it('issues token only with requested allowed scope', async () => {
        const authRes = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-privileged',
            scope: 'read write',
        });
        const tokenRes = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: authRes.body.code });
        expect(tokenRes.status).toBe(200);
        const issued = await db_1.prisma.oAuthAccessToken.findUnique({
            where: { accessToken: (0, oauth_service_1.hashOpaqueToken)(tokenRes.body.access_token) },
        });
        expect(issued?.scope).toBe('read write');
    });
});
