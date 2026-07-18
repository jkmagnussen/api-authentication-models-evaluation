import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth – Replay Attack", () => {
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

  it("Reusing an authorization code should be rejected", async () => {
    // Generate code
    await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-123"
      });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    // First use → OK
    const firstRes = await request(app)
      .post("/oauth/token")
      .send({ code: stored?.code });

    expect(firstRes.status).toBe(200);

    // Second use → FAIL
    const replayRes = await request(app)
      .post("/oauth/token")
      .send({ code: stored?.code });

    expect(replayRes.status).toBe(400);
    expect(replayRes.body.error).toBe("Invalid authorization code");
  });
});
