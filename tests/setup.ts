// tests/setup.ts

import { prisma } from "../src/db";
import bcrypt from "bcryptjs";

// Mock ONLY OAuth service functions (integration tests need real Prisma)
jest.mock("../src/oauth/oauth.service", () => ({
  createAuthorizationCode: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  validateAccessToken: jest.fn(),
}));

export async function resetDatabase() {
  // Clear all authentication-related tables safely
  if (prisma.session?.deleteMany) {
    await prisma.session.deleteMany();
  }

  if (prisma.user?.deleteMany) {
    await prisma.user.deleteMany();
  }

  if (prisma.oAuthAuthorizationCode?.deleteMany) {
    await prisma.oAuthAuthorizationCode.deleteMany();
  }

  // Recreate base user
  await prisma.user.create({
    data: {
      id: "user-123",
      email: "test@example.com",
      password: await bcrypt.hash("password", 10),
    },
  });
}
