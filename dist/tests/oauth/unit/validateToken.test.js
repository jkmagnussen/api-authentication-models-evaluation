"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_middleware_1 = require("../../../src/oauth/oauth.middleware");
function mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
describe('validateToken middleware', () => {
    it('returns 400 if code is missing', () => {
        const req = { body: {} };
        const res = mockResponse();
        const next = jest.fn();
        (0, oauth_middleware_1.validateToken)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'authorization code is required and must be a string',
        });
        expect(next).not.toHaveBeenCalled();
    });
    it('calls next() if code is present', () => {
        const req = { body: { code: 'abc123' } };
        const res = mockResponse();
        const next = jest.fn();
        (0, oauth_middleware_1.validateToken)(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
