"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabase = resetDatabase;
const db_1 = require("../../../src/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function resetDatabase() {
    await db_1.prisma.user.deleteMany();
    await db_1.prisma.user.create({
        data: {
            id: "user-123",
            email: "test@example.com",
            password: await bcryptjs_1.default.hash("password", 10),
        },
    });
}
