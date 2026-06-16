"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const config_1 = require("../config");
async function registerUser(email, password) {
    const existing = await db_1.prisma.user.findUnique({
        where: { email }
    });
    if (existing) {
        throw new Error("Email already registered");
    }
    const passwordHash = await bcryptjs_1.default.hash(password, config_1.BCRYPT_SALT_ROUNDS);
    //   For below, example post header - 
    //   {
    //   "email": "test-email@example.com",
    //   "password": "test-password"
    // }
    const user = await db_1.prisma.user.create({
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
