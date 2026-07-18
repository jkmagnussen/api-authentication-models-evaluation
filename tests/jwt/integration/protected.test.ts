import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

describe("JWT Authentication – Protected Route", () => {

  let token: string;

  beforeEach(async () => {
    await resetDatabase();

    // ⭐ Create user AFTER resetDatabase
    await prisma.user.create({
      data: {
        id: "user-123",
        email: "test@example.com",
        password: "password"
      }
    });

    // ⭐ Login to get a valid JWT
    const login = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    token = login.body.token;
  });

  test("Protected route returns 200 for valid JWT", async () => {
    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-123");
  });
});
