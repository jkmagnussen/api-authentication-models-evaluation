import jwt from "jsonwebtoken";
import { findUserByEmail as findUserByEmailFromDb } from "../auth/user";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

export function generateJwt(userId: string) {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
}

export async function verifyJwt(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  return findUserByEmailFromDb(email);
}