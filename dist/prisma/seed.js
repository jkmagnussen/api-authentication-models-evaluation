"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
// npx ts-node prisma/seed.ts
async function main() {
    // Seed main user with fixed ID
    const passwordHash = await bcrypt_1.default.hash("password123", 10);
    const basicSecretHash = await bcrypt_1.default.hash("basic-secret", 10);
    const privilegedSecretHash = await bcrypt_1.default.hash("privileged-secret", 10);
    const adminSecretHash = await bcrypt_1.default.hash("admin-secret", 10);
    await db_1.prisma.user.upsert({
        where: { id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925" },
        update: {},
        create: {
            id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925",
            email: "main@example.com",
            password: passwordHash,
        },
    });
    // -----------------------------
    // BASIC CLIENT (read-only)
    // -----------------------------
    await db_1.prisma.oAuthClient.upsert({
        where: { id: "client-basic" },
        update: {},
        create: {
            id: "client-basic",
            secret: basicSecretHash,
            name: "Basic Client",
        },
    });
    // -----------------------------
    // PRIVILEGED CLIENT (read + write)
    // -----------------------------
    await db_1.prisma.oAuthClient.upsert({
        where: { id: "client-privileged" },
        update: {},
        create: {
            id: "client-privileged",
            secret: privilegedSecretHash,
            name: "Privileged Client",
        },
    });
    // -----------------------------
    // ADMIN CLIENT (read + write + admin)
    // -----------------------------
    await db_1.prisma.oAuthClient.upsert({
        where: { id: "client-admin" },
        update: {},
        create: {
            id: "client-admin",
            secret: adminSecretHash,
            name: "Admin Client",
        },
    });
    console.log("Seed complete.");
}
main().finally(() => process.exit(0));
