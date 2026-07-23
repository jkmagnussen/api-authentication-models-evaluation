"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const validUUID = "123e4567-e89b-12d3-a456-426614174000";
describe("Brute-force and rate-limit bypass", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: "test@example.com",
                password: "password",
            },
        });
    });
    it("throttles repeated failed logins from the same source", async () => {
        const statuses = [];
        for (let i = 0; i < 6; i += 1) {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/jwt/login")
                .send({ email: "test@example.com", password: "wrong-password" });
            statuses.push(res.status);
        }
        expect(statuses.some((status) => status === 429)).toBe(true);
    });
    it("does not allow bypass by spoofing X-Forwarded-For", async () => {
        const statuses = [];
        for (let i = 0; i < 6; i += 1) {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/jwt/login")
                .set("X-Forwarded-For", `10.0.0.${i + 1}`)
                .send({ email: "test@example.com", password: "wrong-password" });
            statuses.push(res.status);
        }
        expect(statuses.some((status) => status === 429)).toBe(true);
    });
});
