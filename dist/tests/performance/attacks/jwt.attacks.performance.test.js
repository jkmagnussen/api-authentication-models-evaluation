"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe('JWT – Attack Performance Test', () => {
    const ITERATIONS = 1000;
    // Use an intentionally invalid / expired / forged token
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.ATTACKTOKEN';
    let performanceClient;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        performanceClient = await (0, utils_1.createPerformanceHttpClient)(app_1.default);
    });
    afterAll(async () => {
        if (performanceClient)
            await performanceClient.close();
    });
    test(`JWT protected route under replay/invalid-token attack (${ITERATIONS} requests)`, async () => {
        const times = [];
        let errors = 0;
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const status = await performanceClient.get('/jwt/protected', { Authorization: `Bearer ${invalidToken}` });
            const end = performance.now();
            times.push(end - start);
            if (status !== 401)
                throw new Error(`Expected JWT attack status 401, received ${status}`);
            errors++;
        }
        const stats = (0, utils_1.calculateStats)(times);
        // Add error rate to the stats object
        const attackStats = {
            ...stats,
            errorRate: errors / ITERATIONS,
        };
        (0, utils_1.writePerformanceResult)('attacks', 'jwt', attackStats, times);
    });
});
