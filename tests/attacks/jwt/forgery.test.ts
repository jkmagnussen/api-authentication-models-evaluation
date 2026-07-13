import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";

describe("JWT – Forgery Attack Tests", () => {
  let validToken: string;

  beforeAll(async () => {
    await resetDatabase();

    // Login → get a valid JWT
    const res = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    validToken = res.body.token;
  });

  test("Tampered payload should be rejected", async () => {
    // Split JWT into header.payload.signature
    const parts = validToken.split(".");
    const header = parts[0];
    const payload = parts[1];
    const signature = parts[2];

    // Modify payload (flip a character)
    const tamperedPayload = payload.replace(/.$/, "X");

    const forgedToken = `${header}.${tamperedPayload}.${signature}`;

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  test("Tampered signature should be rejected", async () => {
    const parts = validToken.split(".");
    const header = parts[0];
    const payload = parts[1];

    // Replace signature with garbage
    const forgedSignature = "invalidsignature";

    const forgedToken = `${header}.${payload}.${forgedSignature}`;

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  test("Algorithm confusion attack (alg: none) should be rejected", async () => {
    // Create a fake header claiming alg=none
    const fakeHeader = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" })
    ).toString("base64url");

    const parts = validToken.split(".");
    const payload = parts[1];

    // No signature
    const forgedToken = `${fakeHeader}.${payload}.`;

    const res = await request(app)
      .get("/jwt/protected")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });
});