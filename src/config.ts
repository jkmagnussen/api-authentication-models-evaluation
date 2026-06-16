export const PORT = Number(process.env.PORT ?? 3000);
export const DATABASE_URL = process.env.DATABASE_URL ?? '';
export const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

export default {
  PORT,
  DATABASE_URL,
  BCRYPT_SALT_ROUNDS,
};
