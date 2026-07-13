import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";

describe("JWT – Replay Attack Test", () => {
  let token: string;

  beforeAll(async () => {
    await resetDatabase();

    // Login → get valid JWT
    const res = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    token = res.body.token;
  });

  test("Reusing the same JWT should still succeed until expiry", async () => {
    // First use — should succeed
    const firstRes = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(firstRes.status).toBe(200);

    // Replay the exact same token — should also succeed
    const replayRes = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(replayRes.status).toBe(200);
  });

  test("Expired JWT should fail", async () => {
    // Manually craft an invalid/expired token
    const expiredToken = `${token}EXPIRED`;

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
