import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";   // ⭐ Use global reset

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth Integration Flow", () => {

  beforeEach(async () => {
    jest.clearAllMocks();

    // ⭐ Global DB reset (correct FK order + OAuth client recreated)
    await resetDatabase();

    // ⭐ Recreate base user (resetDatabase should NOT create users)
    await prisma.user.create({
      data: {
        id: validUUID,
        email: "test@example.com",
        password: "hashed-password",
      },
    });
  });

  // -----------------------------------------------------
  // AUTHORIZE → RETURNS CODE
  // -----------------------------------------------------
  it("POST /oauth/authorize → returns authorization code for valid user", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-123"
      });

    expect(res.status).toBe(200);

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    expect(res.body).toEqual({
      code: stored?.code,
      state: stored?.state ?? null,
    });
  });

  // -----------------------------------------------------
  // TOKEN → RETURNS JWT
  // -----------------------------------------------------
  it("POST /oauth/token → returns JWT for valid authorization code", async () => {
    // Step 1: generate code
    await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-123"
      });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    // Step 2: exchange code
    const res = await request(app)
      .post("/oauth/token")
      .send({ code: stored?.code });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("token_type", "Bearer");
    expect(res.body).toHaveProperty("expires_in");
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → MISSING HEADER
  // -----------------------------------------------------
  it("GET /oauth/protected → rejects missing Authorization header", async () => {
    const res = await request(app).get("/oauth/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing Authorization header" });
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → INVALID JWT
  // -----------------------------------------------------
  it("GET /oauth/protected → rejects invalid JWT", async () => {
    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → VALID JWT
  // -----------------------------------------------------
  it("GET /oauth/protected → accepts valid JWT", async () => {
    jest
      .spyOn(require("../../../src/oauth/oauth.service"), "validateAccessToken")
      .mockResolvedValue({ userId: validUUID });

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer valid.jwt.token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Protected resource accessed",
      userId: validUUID,
    });
  });

});
