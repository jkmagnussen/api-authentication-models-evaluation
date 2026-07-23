import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { hashOpaqueToken } from "../../../src/oauth/oauth.service";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth scope escalation high-impact", () => {
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

  it("rejects multi-scope escalation for basic client", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        scope: "read write admin",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_scope");
  });

  it("issues token only with requested allowed scope", async () => {
    const authRes = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-privileged",
        scope: "read write",
      });

    const tokenRes = await request(app)
      .post("/oauth/token")
      .send({ code: authRes.body.code });

    expect(tokenRes.status).toBe(200);

    const issued = await prisma.oAuthAccessToken.findUnique({
      where: { accessToken: hashOpaqueToken(tokenRes.body.access_token) },
    });

    expect(issued?.scope).toBe("read write");
  });
});
