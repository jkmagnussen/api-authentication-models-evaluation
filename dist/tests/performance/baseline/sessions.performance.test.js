"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
const db_1 = require("../../../src/db"); // adjust if your DB import differs
describe('Sessions – Performance Test', () => {
    const ITERATIONS = 1000;
    let sessionCookie;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        // Seed user directly (bypasses CSRF, cookies, middleware)
        await db_1.prisma.user.create({
            data: {
                email: 'test@example.com',
                password: 'password', // or hashed if your login expects hashing
            },
        });
        // Login to obtain a valid session cookie
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password' });
        const cookies = res.headers['set-cookie'];
        if (!cookies || cookies.length === 0) {
            throw new Error('No session cookie returned from /sessions/login');
        }
        sessionCookie = cookies[0];
    });
    test(`Session protected route ${ITERATIONS} requests`, async () => {
        const times = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await (0, supertest_1.default)(app_1.default).get('/sessions/protected').set('Cookie', sessionCookie);
            const end = performance.now();
            times.push(end - start);
        }
        const stats = (0, utils_1.calculateStats)(times);
        (0, utils_1.writePerformanceResult)('baseline', 'sessions', stats);
    });
});
