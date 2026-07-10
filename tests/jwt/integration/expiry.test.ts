process.env.JWT_SECRET = "test-secret";

import request from "supertest";
import app from "../../../src/app";
import jwt from "jsonwebtoken";
import { resetDatabase } from "../../setup";

describe("JWT Authentication – Expiry", () => {

  beforeEach(async () => {
    await resetDatabase();
  });

  test("Expired JWT returns 401", async () => {
    const expiredToken = jwt.sign(
      { userId: "user-123" },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token expired");
  });
});
