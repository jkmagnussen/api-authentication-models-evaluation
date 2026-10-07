"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const pkce_1 = require("../../../src/oauth/pkce");
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe('OAuth – Performance Test', () => {
    const ITERATIONS = 1000;
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    let accessToken;
    let performanceClient;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: { id: userId, email: 'perf-oauth@example.com', password: 'not-used-by-authorize' },
        });
        const { code_verifier, code_challenge } = await (0, pkce_1.createPkcePair)();
        const authorizeRes = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId,
            clientId: 'client-basic',
            scope: 'read',
            code_challenge,
            code_challenge_method: 'S256',
        });
        if (authorizeRes.status !== 200 || typeof authorizeRes.body.code !== 'string') {
            throw new Error(`OAuth authorize setup failed with status ${authorizeRes.status}`);
        }
        const tokenRes = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({
            code: authorizeRes.body.code,
            clientId: 'client-basic',
            code_verifier,
        });
        if (tokenRes.status !== 200 || typeof tokenRes.body.access_token !== 'string') {
            throw new Error(`OAuth token setup failed with status ${tokenRes.status}`);
        }
        accessToken = tokenRes.body.access_token;
        performanceClient = await (0, utils_1.createPerformanceHttpClient)(app_1.default);
    });
    afterAll(async () => {
        if (performanceClient)
            await performanceClient.close();
    });
    test(`OAuth protected resource ${ITERATIONS} requests`, async () => {
        const times = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const status = await performanceClient.get('/oauth/protected', { Authorization: `Bearer ${accessToken}` });
            const end = performance.now();
            times.push(end - start);
            if (status !== 200)
                throw new Error(`Expected OAuth baseline status 200, received ${status}`);
        }
        const stats = (0, utils_1.calculateStats)(times);
        (0, utils_1.writePerformanceResult)('baseline', 'oauth', stats, times);
    });
});
