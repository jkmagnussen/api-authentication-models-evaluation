"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe("OAuth – Performance Test", () => {
    const ITERATIONS = 1000;
    let authCode;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        // Step 1: Get an authorization code
        const authorizeRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            client_id: "clientA",
            redirect_uri: "http://localhost/callback",
            email: "test@example.com",
            password: "password"
        });
        authCode = authorizeRes.body.code;
    });
    test(`OAuth token exchange ${ITERATIONS} requests`, async () => {
        const times = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await (0, supertest_1.default)(app_1.default)
                .post("/oauth/token")
                .send({
                code: authCode,
                client_id: "clientA",
                redirect_uri: "http://localhost/callback"
            });
            const end = performance.now();
            times.push(end - start);
        }
        const stats = (0, utils_1.calculateStats)(times);
        (0, utils_1.writePerformanceResult)("baseline", "oauth", stats);
    });
});
