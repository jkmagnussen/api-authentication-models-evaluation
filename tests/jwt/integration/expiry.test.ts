process.env.JWT_SECRET = "test-secret";

import request from "supertest";
import app from "../../../src/app";
import jwt from "jsonwebtoken";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";


describe("JWT Authentication – Expiry", () => {

  


  beforeEach(async () => {
    await resetDatabase();
    await prisma.user.create({
  data: {
    id: "user-123",
    email: "test@example.com",
    password: "password"
  }
});
  });

  test("Expired JWT returns 401", async () => {
    
    process.env.JWT_SECRET = "dev-secret";

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
