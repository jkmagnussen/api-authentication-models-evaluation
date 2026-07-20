import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth – State Parameter Attack", () => {
  beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.oAuthAccessToken.deleteMany();        // FIXED
  await prisma.oAuthAuthorizationCode.deleteMany();  // FIXED
  await prisma.user.deleteMany();                    // FIXED

  await prisma.user.create({
    data: {
      id: validUUID,
      email: "test@example.com",
      password: "hashed-password",
    },
  });
});

  it("State parameter is ignored (not supported)", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        state: "malicious"
      });

    expect(res.status).toBe(200);

    const stored = await prisma.oAuthAuthorizationCode.findFirst();
    expect(res.body.code).toBe(stored?.code);
  });
});
