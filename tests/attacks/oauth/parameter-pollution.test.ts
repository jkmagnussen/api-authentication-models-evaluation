import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Parameter pollution / duplicate-parameter attacks", () => {
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

  it("rejects polluted userId array on authorize", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: [validUUID, "11111111-1111-1111-1111-111111111111"],
        clientId: "client-basic",
        scope: "read",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("userId must be a string");
  });

  it("rejects polluted authorization code array on token", async () => {
    const res = await request(app)
      .post("/oauth/token")
      .send({
        code: ["code-a", "code-b"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("authorization code is required and must be a string");
  });
});
