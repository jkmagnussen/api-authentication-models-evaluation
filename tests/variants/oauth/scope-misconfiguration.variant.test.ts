import request from "supertest";
import { loadVariantApp } from "../load-variant-app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

const app = loadVariantApp();
const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth scope misconfiguration exploit", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUuid,
        email: "test@example.com",
        password: "hashed-password",
      },
    });
  });

  it("grants admin scope to a basic client", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUuid,
        clientId: "client-basic",
        scope: "admin",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
  });
});
