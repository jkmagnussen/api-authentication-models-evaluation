"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe("Sessions – Attack Performance Test", () => {
    const ITERATIONS = 1000;
    // Intentionally invalid / expired / forged session cookie
    const invalidSessionCookie = "session=INVALID_ATTACK_COOKIE";
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
    });
    test(`Session protected route under expired/stolen cookie replay attack (${ITERATIONS} requests)`, async () => {
        const times = [];
        let errors = 0;
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/sessions/protected")
                .set("Cookie", invalidSessionCookie);
            const end = performance.now();
            times.push(end - start);
            if (res.status !== 200)
                errors++;
        }
        const stats = (0, utils_1.calculateStats)(times);
        const attackStats = {
            ...stats,
            errorRate: errors / ITERATIONS,
        };
        (0, utils_1.writePerformanceResult)("attacks", "sessions", attackStats);
    });
});
