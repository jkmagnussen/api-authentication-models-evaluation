"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const validUUID = "123e4567-e89b-12d3-a456-426614174000";
describe("OAuth – State Parameter Attack", () => {
    beforeEach(async () => {
        await db_1.prisma.session.deleteMany();
        await db_1.prisma.oAuthAccessToken.deleteMany(); // FIXED
        await db_1.prisma.oAuthAuthorizationCode.deleteMany(); // FIXED
        await db_1.prisma.user.deleteMany(); // FIXED
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: "test@example.com",
                password: "hashed-password",
            },
        });
    });
    it("State parameter is ignored (not supported)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            state: "malicious"
        });
        expect(res.status).toBe(200);
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        expect(res.body.code).toBe(stored?.code);
    });
});
