import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

describe("JWT Authentication – Invalid Tokens", () => {

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

  test("Missing JWT returns 401", async () => {
    const res = await request(app).get("/jwt/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });

  test("Invalid JWT returns 401", async () => {
    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});
