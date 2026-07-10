import request from "supertest";
import app from "../../../src/app";
import jwt from "jsonwebtoken";
import { resetDatabase } from "../../setup";

describe("JWT Authentication – Login", () => {

  beforeEach(async () => {
    await resetDatabase();
  });

  test("Login returns a valid JWT", async () => {
    const res = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = jwt.decode(res.body.token) as any;
    expect(decoded.userId).toBe("user-123");
  });
});