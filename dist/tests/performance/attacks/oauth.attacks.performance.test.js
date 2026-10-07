"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe('OAuth – Attack Performance Test', () => {
    const ITERATIONS = 1000;
    // Intentionally invalid / replayed authorization code
    const invalidCode = 'REPLAYED_OR_INVALID_CODE';
    let performanceClient;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        performanceClient = await (0, utils_1.createPerformanceHttpClient)(app_1.default);
    });
    afterAll(async () => {
        if (performanceClient)
            await performanceClient.close();
    });
    test(`OAuth protected resource under invalid-token attack (${ITERATIONS} requests)`, async () => {
        const times = [];
        let errors = 0;
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const status = await performanceClient.get('/oauth/protected', { Authorization: `Bearer ${invalidCode}` });
            const end = performance.now();
            times.push(end - start);
            if (status !== 401)
                throw new Error(`Expected OAuth attack status 401, received ${status}`);
            errors++;
        }
        const stats = (0, utils_1.calculateStats)(times);
        const attackStats = {
            ...stats,
            errorRate: errors / ITERATIONS,
        };
        (0, utils_1.writePerformanceResult)('attacks', 'oauth', attackStats, times);
    });
});
