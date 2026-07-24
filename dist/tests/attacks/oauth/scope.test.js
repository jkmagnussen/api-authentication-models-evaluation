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
describe('OAuth – Scope Escalation / Privilege Confusion', () => {
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
    // ------------------------------------------------------------
    // BASIC CLIENT TESTS
    // ------------------------------------------------------------
    it("Basic client: requesting allowed scope 'read' should succeed", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
        });
        expect(res.status).toBe(200);
        expect(res.body.code).toBeDefined();
    });
    it("Basic client: requesting forbidden scope 'write' should fail", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'write',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_scope');
    });
    // ------------------------------------------------------------
    // PRIVILEGED CLIENT TESTS
    // ------------------------------------------------------------
    it("Privileged client: requesting allowed scope 'write' should succeed", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-privileged',
            scope: 'write',
        });
        expect(res.status).toBe(200);
        expect(res.body.code).toBeDefined();
    });
    it("Privileged client: requesting forbidden scope 'admin' should fail", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-privileged',
            scope: 'admin',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_scope');
    });
    // ------------------------------------------------------------
    // ADMIN CLIENT TESTS
    // ------------------------------------------------------------
    it("Admin client: requesting full scope 'read write admin' should succeed", async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-admin',
            scope: 'read write admin',
        });
        expect(res.status).toBe(200);
        expect(res.body.code).toBeDefined();
    });
    it('Admin client: requesting invalid scope should fail', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-admin',
            scope: 'delete-everything',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_scope');
    });
});
