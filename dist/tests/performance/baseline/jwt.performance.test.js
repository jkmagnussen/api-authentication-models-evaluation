"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const utils_1 = require("../utils");
describe("JWT – Performance Test", () => {
    const ITERATIONS = 1000;
    let token;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "test@example.com", password: "password" });
        token = res.body.token;
    });
    test(`JWT protected route ${ITERATIONS} requests`, async () => {
        const times = [];
        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await (0, supertest_1.default)(app_1.default)
                .get("/jwt/protected")
                .set("Authorization", `Bearer ${token}`);
            const end = performance.now();
            times.push(end - start);
        }
        const stats = (0, utils_1.calculateStats)(times);
        (0, utils_1.writePerformanceResult)("baseline", "jwt", stats);
    });
});
