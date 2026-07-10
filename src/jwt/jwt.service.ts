import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function generateJwt(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
}

export async function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}