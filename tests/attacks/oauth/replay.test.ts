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

    await prisma.oAuthClient.createMany({
      data: [
        { id: "client-123", secret: "secret-123", name: "Client 123" },
        { id: "client-456", secret: "secret-456", name: "Client 456" },
      ],
      skipDuplicates: true,
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

  it("The token exchange must bind the code to the issuing client", async () => {
    await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-123",
      });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    const res = await request(app)
      .post("/oauth/token")
      .set("Authorization", "Basic Y2xpZW50LTQ1NjpzZWNyZXQtNDU2")
      .send({ code: stored?.code });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_client");
  });

  it("Concurrent token exchanges should only succeed once per authorization code", async () => {
    await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-123",
      });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    const results = await Promise.all([
      request(app).post("/oauth/token").send({ code: stored?.code }),
      request(app).post("/oauth/token").send({ code: stored?.code }),
      request(app).post("/oauth/token").send({ code: stored?.code }),
    ]);

    const successCount = results.filter((res) => res.status === 200).length;
    const failureCount = results.filter((res) => res.status === 400).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(2);
  });
});
