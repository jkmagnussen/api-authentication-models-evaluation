"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BCRYPT_SALT_ROUNDS = exports.DATABASE_URL = exports.PORT = void 0;
exports.PORT = Number(process.env.PORT ?? 3000);
exports.DATABASE_URL = process.env.DATABASE_URL ?? '';
exports.BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
exports.default = {
    PORT: exports.PORT,
    DATABASE_URL: exports.DATABASE_URL,
    BCRYPT_SALT_ROUNDS: exports.BCRYPT_SALT_ROUNDS,
};
