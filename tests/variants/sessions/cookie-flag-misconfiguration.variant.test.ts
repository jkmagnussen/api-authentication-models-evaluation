import request from "supertest";
import { loadVariantApp } from "../load-variant-app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

const app = loadVariantApp();

describe("Session cookie flag misconfiguration exploit", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        password: "password",
      },
    });
  });

  it("issues a session cookie without HttpOnly", async () => {
    const loginRes = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    expect(loginRes.status).toBe(200);

    const cookieHeader = loginRes.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : "";

    expect(sessionCookie).not.toContain("HttpOnly");
  });
});
