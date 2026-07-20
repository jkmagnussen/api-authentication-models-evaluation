import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("OAuth – Scope Escalation / Privilege Confusion", () => {
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

  // ------------------------------------------------------------
  // BASIC CLIENT TESTS
  // ------------------------------------------------------------
  it("Basic client: requesting allowed scope 'read' should succeed", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        scope: "read",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
  });

  it("Basic client: requesting forbidden scope 'write' should fail", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-basic",
        scope: "write",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_scope");
  });

  // ------------------------------------------------------------
  // PRIVILEGED CLIENT TESTS
  // ------------------------------------------------------------
  it("Privileged client: requesting allowed scope 'write' should succeed", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-privileged",
        scope: "write",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
  });

  it("Privileged client: requesting forbidden scope 'admin' should fail", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-privileged",
        scope: "admin",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_scope");
  });

  // ------------------------------------------------------------
  // ADMIN CLIENT TESTS
  // ------------------------------------------------------------
  it("Admin client: requesting full scope 'read write admin' should succeed", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-admin",
        scope: "read write admin",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
  });

  it("Admin client: requesting invalid scope should fail", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: validUUID,
        clientId: "client-admin",
        scope: "delete-everything",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_scope");
  });
});
