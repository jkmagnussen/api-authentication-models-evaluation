import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth refresh-token rotation race", () => {
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

  it("allows only one successful refresh across 10 concurrent attempts", async () => {
    const authRes = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        scope: "read",
      });

    const tokenRes = await request(app)
      .post("/oauth/token")
      .send({ code: authRes.body.code });

    const originalRefreshToken = tokenRes.body.refresh_token;

    const results = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        request(app)
          .post("/oauth/refresh")
          .send({ refresh_token: originalRefreshToken, client_id: "client-basic" })
      )
    );

    const successCount = results.filter((res) => res.status === 200).length;
    const invalidGrantCount = results.filter(
      (res) => res.status === 400 && res.body?.error === "invalid_grant"
    ).length;

    expect(successCount).toBe(1);
    expect(invalidGrantCount).toBe(9);
  });
});
