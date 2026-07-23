import jwt from "jsonwebtoken";
import request from "supertest";
import { loadVariantApp } from "../load-variant-app";

const app = loadVariantApp();
const secret = process.env.JWT_SECRET || "dev-secret";

describe("JWT audience misconfiguration exploit", () => {
  it("accepts token minted for a weak audience value", async () => {
    const token = jwt.sign(
      { userId: "user-123", aud: "anyone", iss: "api-auth-service" },
      secret,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-123");
  });
});
