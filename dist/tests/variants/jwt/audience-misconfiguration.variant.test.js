"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supertest_1 = __importDefault(require("supertest"));
const load_variant_app_1 = require("../load-variant-app");
const app = (0, load_variant_app_1.loadVariantApp)();
const secret = process.env.JWT_SECRET || 'dev-secret';
describe('JWT audience misconfiguration exploit', () => {
    it('accepts token minted for a weak audience value', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'user-123', aud: 'anyone', iss: 'api-auth-service' }, secret, {
            expiresIn: '1h',
        });
        const res = await (0, supertest_1.default)(app).get('/jwt/protected').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.userId).toBe('user-123');
    });
});
