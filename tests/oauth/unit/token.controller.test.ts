import { Request, Response } from "express";
import { token } from "../../../src/oauth/oauth.controller";

jest.mock("../../../src/oauth/oauth.service", () => ({
  exchangeCodeForToken: jest.fn(),
}));

import { exchangeCodeForToken } from "../../../src/oauth/oauth.service";

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("token controller", () => {
  it("returns 400 if code is missing", async () => {
    const req = { body: {} } as Request;
    const res = mockResponse();

    await token(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing code" });
  });

  it("returns 400 if code is invalid", async () => {
    (exchangeCodeForToken as jest.Mock).mockResolvedValue(null);

    const req = { body: { code: "invalid" } } as Request;
    const res = mockResponse();

    await token(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid authorization code" });
  });

  it("returns access token for valid code", async () => {
    (exchangeCodeForToken as jest.Mock).mockResolvedValue({
      token: "jwt-token",
    });

    const req = { body: { code: "valid-code" } } as Request;
    const res = mockResponse();

    await token(req, res);

    expect(res.json).toHaveBeenCalledWith({
      access_token: "jwt-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
});
