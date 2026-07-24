"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const load_variant_app_1 = require("../load-variant-app");
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
const app = (0, load_variant_app_1.loadVariantApp)();
describe('OAuth redirect misconfiguration exploit', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: '11111111-1111-1111-1111-111111111111',
                email: 'test@example.com',
                password: 'hashed-password',
            },
        });
    });
    it('accepts evil redirect URI that baseline rejects', async () => {
        const res = await (0, supertest_1.default)(app).post('/oauth/authorize').send({
            userId: '11111111-1111-1111-1111-111111111111',
            clientId: 'client-basic',
            scope: 'read',
            redirectUri: 'http://evil.com',
        });
        expect(res.status).toBe(200);
        expect(res.body.code).toBeDefined();
    });
});
