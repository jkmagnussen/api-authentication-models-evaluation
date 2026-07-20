import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../../src/app";

describe("JWT claim abuse", () => {
  const secret = process.env.JWT_SECRET || "dev-secret";

  it("rejects token with nbf set in the future", async () => {
    const token = jwt.sign(
      {
        userId: "user-123",
        nbf: Math.floor(Date.now() / 1000) + 3600,
      },
      secret,
      { expiresIn: "2h" }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("rejects token without userId claim", async () => {
    const token = jwt.sign(
      {
        aud: "api-auth-eval",
        iss: "api-auth-service",
      },
      secret,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
