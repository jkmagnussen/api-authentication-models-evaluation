jest.mock("../../../src/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  createAuthorizationCode: jest.fn(),
}));


import { authorize } from "../../../src/oauth/oauth.controller";
import { prisma } from "../../../src/db";
import { createAuthorizationCode } from "../../../src/oauth/oauth.service";
import { Request, Response } from "express";



function mockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

it("returns code for valid user", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-id" });
  (createAuthorizationCode as jest.Mock).mockResolvedValue("auth-code");

  const req = { body: { userId: "user-id" } } as Request;
  const res = mockResponse();

  await authorize(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ code: "auth-code" });
});



it("returns 400 for non-existent user", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const req = { body: { userId: "user-id" } } as Request;
  const res = mockResponse();

  await authorize(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});