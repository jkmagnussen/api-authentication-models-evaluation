"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe('JWT – Performance Test', () => {
    const ITERATIONS = 1000;
    let token;
    let performanceClient;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: { id: 'user-123', email: 'test@example.com', password: 'password' },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({ email: 'test@example.com', password: 'password' });
        if (res.status !== 200 || typeof res.body.token !== 'string') {
            throw new Error(`JWT login setup failed with status ${res.status}`);
        }
        token = res.body.token;
        performanceClient = await (0, utils_1.createPerformanceHttpClient)(app_1.default);
    });
    afterAll(async () => {
        if (performanceClient)
            await performanceClient.close();
    });
    test(`JWT protected route ${ITERATIONS} requests`, async () => {
        const times = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const status = await performanceClient.get('/jwt/protected', { Authorization: `Bearer ${token}` });
            const end = performance.now();
            times.push(end - start);
            if (status !== 200)
                throw new Error(`Expected JWT baseline status 200, received ${status}`);
        }
        const stats = (0, utils_1.calculateStats)(times);
        (0, utils_1.writePerformanceResult)('baseline', 'jwt', stats, times);
    });
});
