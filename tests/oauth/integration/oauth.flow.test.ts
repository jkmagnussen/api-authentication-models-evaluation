import request from "supertest";
import app from "../../../src/app"; // your Express app
import { prisma } from "../../../src/db";
import { 
  createAuthorizationCode, 
  exchangeCodeForToken, 
  validateAccessToken            // ← YOU MUST IMPORT THIS
} from "../../../src/oauth/oauth.service";

// ✔ Use a valid UUID because your middleware requires it
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

// ✔ Add validateAccessToken to your mock, otherwise router crashes
jest.mock("../../../src/oauth/oauth.service", () => ({
  createAuthorizationCode: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  validateAccessToken: jest.fn(),     // ← REQUIRED
}));

describe("OAuth Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /oauth/authorize → returns authorization code for valid user", async () => {
    // ✔ Mock DB to return a user with the valid UUID
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUUID });

    (createAuthorizationCode as jest.Mock).mockResolvedValue("auth-code-xyz");

    const res = await request(app)
      .post("/oauth/authorize")
      .send({ userId: validUUID });   // ← MUST use validUUID

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "auth-code-xyz" });
  });

  it("POST /oauth/token → returns JWT for valid authorization code", async () => {
    (exchangeCodeForToken as jest.Mock).mockResolvedValue({
      token: "jwt-token-abc",
    });

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "auth-code-xyz" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      access_token: "jwt-token-abc",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });

  it("GET /oauth/protected → rejects missing Authorization header", async () => {
    // ✔ validateAccessToken should NOT be called here
    (validateAccessToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/oauth/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing Authorization header" });
  });

  it("GET /oauth/protected → rejects invalid JWT", async () => {
    // ✔ invalid token → validateAccessToken returns null
    (validateAccessToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("GET /oauth/protected → accepts valid JWT", async () => {
    // ✔ valid token → validateAccessToken returns a user
    (validateAccessToken as jest.Mock).mockResolvedValue({ userId: validUUID });

    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Bearer valid.jwt.token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Protected content" });
  });
});
