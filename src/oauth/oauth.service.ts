import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateCode() {
  return crypto.randomBytes(32).toString("hex");
}

function generateToken() {
  return crypto.randomBytes(48).toString("hex");
}

function expiresIn(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function createAuthorizationCode(userId: string) {
  return prisma.oAuthAuthorizationCode.create({
    data: {
      code: generateCode(),
      userId,
      expiresAt: expiresIn(5),
    },
  });
}

export async function exchangeCodeForToken(code: string) {
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode || authCode.expiresAt < new Date()) return null;

  const token = await prisma.oAuthAccessToken.create({
    data: {
      token: generateToken(),
      userId: authCode.userId,
      expiresAt: expiresIn(60),
    },
  });

  await prisma.oAuthAuthorizationCode.delete({ where: { code } });

  return token;
}

export async function validateAccessToken(token: string) {
  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { token },
  });

  if (!stored || stored.expiresAt < new Date()) return null;
  return stored;
}