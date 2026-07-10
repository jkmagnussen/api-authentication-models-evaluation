import { prisma } from "../src/db";
import bcrypt from "bcryptjs";

export async function resetDatabase() {
  // Clear all session-based authentication data
  await prisma.session.deleteMany();     // ← THIS WAS MISSING
  await prisma.user.deleteMany();

  // Recreate base user
  await prisma.user.create({
    data: {
      id: "user-123",
      email: "test@example.com",
      password: await bcrypt.hash("password", 10),
    },
  });
}