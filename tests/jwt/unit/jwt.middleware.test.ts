import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { jwtAuth } from "../../../src/jwt/jwt.middleware";

describe("JWT Middleware – Unit Tests", () => {

  process.env.JWT_SECRET = "test-secret";

  const SECRET = process.env.JWT_SECRET!;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockNext = () => jest.fn();

  test("Allows request with valid JWT", () => {
    const token = jwt.sign({ userId: "user-123" }, SECRET, { expiresIn: "1h" });

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as Request;

    const res = mockResponse();
    const next = mockNext();

    jwtAuth(req, res, next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalled();
  });

  test("Rejects request with missing Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockResponse();
    const next = mockNext();

    jwtAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  test("Rejects request with invalid JWT", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid.token.here"
      }
    } as Request;

    const res = mockResponse();
    const next = mockNext();

    jwtAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  test("Rejects request with expired JWT", () => {
    const expiredToken = jwt.sign(
      { userId: "user-123" },
      SECRET,
      { expiresIn: -10 } // expired 10 seconds ago
    );

    const req = {
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    } as Request;

    const res = mockResponse();
    const next = mockNext();

    jwtAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
    expect(next).not.toHaveBeenCalled();
  });
});