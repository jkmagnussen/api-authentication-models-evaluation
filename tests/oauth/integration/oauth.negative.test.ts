import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import {
  createAuthorizationCode,
  exchangeCodeForToken,
  validateAccessToken
} from "../../../src/oauth/oauth.service";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

jest.mock("../../../src/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    authorizationCode: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  createAuthorizationCode: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  validateAccessToken: jest.fn(),
}));

describe("OAuth Negative Path Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // AUTHORIZATION CODE NEGATIVE TESTS
  // ---------------------------

  it("POST /oauth/authorize → rejects missing userId", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "userId is required" });
  });

  it("POST /oauth/authorize → rejects non-string userId", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({ userId: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "userId must be a string" });
  });

  it("POST /oauth/authorize → rejects non-UUID userId", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({ userId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "userId must be a valid UUID" });
  });

  it("POST /oauth/authorize → rejects userId not found in DB", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/oauth/authorize")
      .send({ userId: validUUID });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User does not exist" });
  });

  // ---------------------------
  // TOKEN ENDPOINT NEGATIVE TESTS
  // ---------------------------

  it("POST /oauth/token → rejects missing code", async () => {
    const res = await request(app)
      .post("/oauth/token")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "authorization code is required and must be a string",
    });
  });

  it("POST /oauth/token → rejects non-string code", async () => {
    const res = await request(app)
      .post("/oauth/token")
      .send({ code: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "authorization code is required and must be a string",
    });
  });

  it("POST /oauth/token → rejects invalid authorization code", async () => {
    (exchangeCodeForToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "invalid-code" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid authorization code" });
  });

  // ---------------------------
  // PROTECTED ROUTE NEGATIVE TESTS
  // ---------------------------

  it("GET /oauth/protected → rejects missing Authorization header", async () => {
    const res = await request(app).get("/oauth/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing Authorization header" });
  });

  it("GET /oauth/protected → rejects malformed Authorization header", async () => {
    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Token abc123");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing Authorization header" });
  });

  it("GET /oauth/protected → rejects invalid JWT", async () => {
    (validateAccessToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("GET /oauth/protected → rejects expired JWT", async () => {
    (validateAccessToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer expired.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("GET /oauth/protected → rejects tampered JWT", async () => {
    (validateAccessToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer tampered.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });
});