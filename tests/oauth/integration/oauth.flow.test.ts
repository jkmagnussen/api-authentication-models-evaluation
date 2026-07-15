import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth Integration Flow", () => {

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset DB
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.oAuthAuthorizationCode.deleteMany();

    // Base user
    await prisma.user.create({
      data: {
        id: validUUID,
        email: "test@example.com",
        password: "hashed-password",
      },
    });
  });

  it("POST /oauth/authorize → returns authorization code for valid user", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        client_id: "client-123",
        redirect_uri: "https://example.com/callback",
      });

    expect(res.status).toBe(200);

    // Read actual generated code from DB
    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    expect(res.body).toEqual({
      code: stored?.code,
    });
  });

  it("POST /oauth/token → returns JWT for valid authorization code", async () => {
    // Step 1: Generate authorization code
    await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        client_id: "client-123",
        redirect_uri: "https://example.com/callback",
      });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    // Step 2: Exchange code for token
    const res = await request(app)
      .post("/oauth/token")
      .send({ code: stored?.code });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("token_type", "Bearer");
    expect(res.body).toHaveProperty("expires_in", 3600);
  });

  it("GET /oauth/protected → rejects missing Authorization header", async () => {
    const res = await request(app).get("/oauth/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing Authorization header" });
  });

  it("GET /oauth/protected → rejects invalid JWT", async () => {
    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("GET /oauth/protected → accepts valid JWT", async () => {
    jest
      .spyOn(require("../../../src/oauth/oauth.service"), "validateAccessToken")
      .mockResolvedValue({ userId: validUUID });

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer valid.jwt.token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Protected content" });
  });

});
