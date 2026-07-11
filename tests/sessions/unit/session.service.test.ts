import { prisma } from "../../../src/db";
import { createSession, findSession, deleteSession } from "../../../src/sessions/session.service";

describe("Session Service – Unit Tests", () => {

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: "user-123",
        email: "test@example.com",
        password: "hashed"
      }
    });
  });

  test("createSession creates a session with correct fields", async () => {
    const session = await createSession("user-123");

    expect(session.userId).toBe("user-123");
    expect(session.expiresAt).toBeDefined();
    expect(session.id).toBeDefined();
  });

  test("findSession returns a session when it exists", async () => {
    const created = await createSession("user-123");
    const found = await findSession(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  test("findSession returns null for non-existent session", async () => {
    const found = await findSession("does-not-exist");
    expect(found).toBeNull();
  });

  test("deleteSession removes a session", async () => {
    const created = await createSession("user-123");
    await deleteSession(created.id);

    const found = await findSession(created.id);
    expect(found).toBeNull();
  });
});