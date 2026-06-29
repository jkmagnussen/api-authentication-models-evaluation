import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { BCRYPT_SALT_ROUNDS } from "../config";

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error("Email already registered");
  } 

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);


const user = await prisma.user.create({
  data: {
    email,
    password: passwordHash,
  },
  select: {
    id: true,
    email: true,
    createdAt: true,
  },
});

  return user;
} 

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new Error("Invalid credentials");
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}