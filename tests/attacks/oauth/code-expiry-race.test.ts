import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth authorization-code expiry boundary and race", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUUID,
        email: "test@example.com",
        password: "hashed-password",
      },
    });
  });

  it("rejects a code that is already expired at exchange time", async () => {
    await prisma.oAuthAuthorizationCode.create({
      data: {
        code: "expired-now-code",
        userId: validUUID,
        clientId: "client-basic",
        scope: "read",
        expiresAt: new Date(Date.now() - 1),
        used: false,
      },
    });

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "expired-now-code" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid authorization code");
  });

  it("allows at most one successful exchange under concurrent race", async () => {
    const authRes = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        scope: "read",
      });

    const code = authRes.body.code as string;

    const results = await Promise.all([
      request(app).post("/oauth/token").send({ code }),
      request(app).post("/oauth/token").send({ code }),
      request(app).post("/oauth/token").send({ code }),
      request(app).post("/oauth/token").send({ code }),
      request(app).post("/oauth/token").send({ code }),
    ]);

    const successCount = results.filter((res) => res.status === 200).length;
    const failureCount = results.filter((res) => res.status === 400).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(4);
  });
});
