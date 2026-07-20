import request from "supertest";
import app from "../../../src/app";

describe("Authorization header ambiguity", () => {
  it("rejects malformed Bearer header with no token", async () => {
    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", "Bearer");

    expect(res.status).toBe(401);
  });

  it("rejects Bearer header with extra token segments", async () => {
    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", "Bearer token-one token-two");

    expect(res.status).toBe(401);
  });

  it("rejects non-bearer authorization type", async () => {
    const res = await request(app)
      .get("/oauth/protected")
      .set("Authorization", "Basic Y2xpZW50OmZha2U=");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing Authorization header");
  });
});
