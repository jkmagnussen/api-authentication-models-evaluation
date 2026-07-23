"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_controller_1 = require("../../../src/oauth/oauth.controller");
const db_1 = require("../../../src/db");
const oauthService = __importStar(require("../../../src/oauth/oauth.service"));
// Mock ONLY the Prisma + service calls used by the controller
jest.mock("../../../src/db", () => ({
    prisma: {
        oAuthAuthorizationCode: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        oAuthClient: {
            findUnique: jest.fn(),
        },
    },
}));
jest.mock("../../../src/oauth/oauth.service", () => ({
    __esModule: true,
    exchangeCodeForToken: jest.fn(),
}));
describe("token controller", () => {
    it("returns access token for valid code", async () => {
        // Mock lookup of authorization code
        db_1.prisma.oAuthAuthorizationCode.findUnique.mockResolvedValue({
            code: "auth-code",
            userId: "user-123",
            clientId: "client-basic",
            expiresAt: new Date(Date.now() + 60000),
            used: false,
        });
        // Mock marking the code as used
        db_1.prisma.oAuthAuthorizationCode.update.mockResolvedValue({
            code: "auth-code",
            used: true,
        });
        // Mock OAuth client lookup
        db_1.prisma.oAuthClient.findUnique.mockResolvedValue({
            id: "client-basic",
            name: "Test Client",
            secret: "test-secret",
        });
        // Mock token generation
        oauthService.exchangeCodeForToken.mockResolvedValue({
            accessToken: "jwt-token",
            refreshToken: "refresh-token",
            scope: "read",
        });
        const basicAuth = Buffer.from("client-basic:test-secret").toString("base64");
        const req = {
            body: { code: "auth-code" },
            headers: { authorization: `Basic ${basicAuth}` }, // ⭐ FIXED
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        await (0, oauth_controller_1.token)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            access_token: "jwt-token",
            refresh_token: "refresh-token",
            token_type: "Bearer",
            expires_in: 3600,
        });
    });
});
