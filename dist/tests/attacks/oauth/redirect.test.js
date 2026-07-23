"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
jest.mock("../../../src/db", () => ({
    prisma: {
        session: {
            deleteMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        oAuthClient: {
            findUnique: jest.fn(),
        },
        oAuthAuthorizationCode: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));
describe("OAuth – Redirect URI Manipulation Attack", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        jest.clearAllMocks();
        // Mock user lookup
        db_1.prisma.user.findUnique.mockResolvedValue({
            id: "11111111-1111-1111-1111-111111111111",
        });
        db_1.prisma.oAuthClient.findUnique.mockResolvedValue({
            id: "client-basic",
            name: "Basic Client",
            secret: "basic-secret",
        });
        // Mock authorization code creation
        db_1.prisma.oAuthAuthorizationCode.create.mockResolvedValue({
            code: "redirect-test-code",
            userId: "11111111-1111-1111-1111-111111111111",
            clientId: "client-basic",
            expiresAt: new Date(Date.now() + 60000),
            used: false,
        });
    });
    test("Unregistered redirect URI should be rejected", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: "11111111-1111-1111-1111-111111111111",
            clientId: "client-basic",
            redirectUri: "https://evil.example/callback"
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid redirect URI");
    });
    test("Encoded redirect URI variants should also be rejected", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: "11111111-1111-1111-1111-111111111111",
            clientId: "client-basic",
            redirectUri: "https://example.com/callback%2Fextra"
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid redirect URI");
    });
    test("Redirect URI parameter pollution should be rejected", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: "11111111-1111-1111-1111-111111111111",
            clientId: "client-basic",
            redirectUri: "https://example.com/callback",
            redirect_uri: "https://evil.example/callback"
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid redirect URI");
    });
});
