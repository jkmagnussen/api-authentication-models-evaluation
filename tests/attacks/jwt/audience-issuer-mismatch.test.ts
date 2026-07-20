import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../../src/app";

describe("JWT audience/issuer mismatch", () => {
  const secret = process.env.JWT_SECRET || "dev-secret";

  it("rejects token with wrong audience", async () => {
    const token = jwt.sign(
      { userId: "user-123", aud: "other-audience", iss: "api-auth-service" },
      secret,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("rejects token with wrong issuer", async () => {
    const token = jwt.sign(
      { userId: "user-123", aud: "api-auth-eval", iss: "evil-issuer" },
      secret,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});
