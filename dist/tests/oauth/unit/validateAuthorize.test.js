"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_middleware_1 = require("../../../src/oauth/oauth.middleware");
const db_1 = require("../../../src/db");
// Mock ONLY the Prisma calls used by the middleware
jest.mock("../../../src/db", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));
function mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
describe("validateAuthorize", () => {
    it("rejects missing userId", async () => {
        const req = { body: {} };
        const res = mockResponse();
        const next = jest.fn();
        await (0, oauth_middleware_1.validateAuthorize)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
    it("rejects numeric userId", async () => {
        const req = { body: { userId: "123" } };
        const res = mockResponse();
        const next = jest.fn();
        await (0, oauth_middleware_1.validateAuthorize)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
    it("rejects invalid UUID format", async () => {
        const req = { body: { userId: "abc" } };
        const res = mockResponse();
        const next = jest.fn();
        await (0, oauth_middleware_1.validateAuthorize)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
    it("rejects non-existent user", async () => {
        db_1.prisma.user.findUnique.mockResolvedValue(null);
        const req = { body: { userId: "b255a7cd-37a8-4784-98e1-dae9ffdc15ec" } };
        const res = mockResponse();
        const next = jest.fn();
        await (0, oauth_middleware_1.validateAuthorize)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
    it("accepts valid user", async () => {
        db_1.prisma.user.findUnique.mockResolvedValue({
            id: "b255a7cd-37a8-4784-98e1-dae9ffdc15ec",
        });
        const req = { body: { userId: "b255a7cd-37a8-4784-98e1-dae9ffdc15ec" } };
        const res = mockResponse();
        const next = jest.fn();
        await (0, oauth_middleware_1.validateAuthorize)(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
