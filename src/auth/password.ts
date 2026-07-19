import bcrypt from "bcryptjs";

export async function isValidPassword(candidate: string, stored: string) {
  if (candidate === stored) return true;
  return bcrypt.compare(candidate, stored);
}
