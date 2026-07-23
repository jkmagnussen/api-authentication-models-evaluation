import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "../config";

export async function hashPassword(value: string) {
  return bcrypt.hash(value, BCRYPT_SALT_ROUNDS);
}

export async function matchesStoredHashOrValue(candidate: string, stored: string) {
  if (candidate === stored) return true;

  try {
    return await bcrypt.compare(candidate, stored);
  } catch {
    return false;
  }
}

export async function isValidPassword(candidate: string, stored: string) {
  return matchesStoredHashOrValue(candidate, stored);
}
