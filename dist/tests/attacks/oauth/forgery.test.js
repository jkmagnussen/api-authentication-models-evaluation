"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
describe('OAuth – Token Forgery Attack', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
    });
    test('Forged access token should be rejected', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer forged-token');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid or expired token');
    });
});
