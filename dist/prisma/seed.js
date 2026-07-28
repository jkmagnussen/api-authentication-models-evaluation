"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = require("../src/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
// npx ts-node prisma/seed.ts
async function main() {
    process.stdout.write('Resetting seeded data...\n');
    await db_1.prisma.$transaction([
        db_1.prisma.auditLog.deleteMany(),
        db_1.prisma.passwordResetToken.deleteMany(),
        db_1.prisma.session.deleteMany(),
        db_1.prisma.oAuthAccessToken.deleteMany(),
        db_1.prisma.oAuthAuthorizationCode.deleteMany(),
        db_1.prisma.oAuthClient.deleteMany(),
        db_1.prisma.user.deleteMany(),
    ]);
    // Seed main user with fixed ID
    const passwordHash = await bcrypt_1.default.hash('password123', 10);
    const basicSecretHash = await bcrypt_1.default.hash('basic-secret', 10);
    const privilegedSecretHash = await bcrypt_1.default.hash('privileged-secret', 10);
    const adminSecretHash = await bcrypt_1.default.hash('admin-secret', 10);
    await db_1.prisma.user.create({
        data: {
            id: 'd9c7dba3-3f97-4418-9f7b-f89d8fa5d925',
            email: 'main@example.com',
            password: passwordHash,
        },
    });
    // -----------------------------
    // BASIC CLIENT (read-only)
    // -----------------------------
    await db_1.prisma.oAuthClient.create({
        data: {
            id: 'client-basic',
            secret: basicSecretHash,
            name: 'Basic Client',
        },
    });
    // -----------------------------
    // PRIVILEGED CLIENT (read + write)
    // -----------------------------
    await db_1.prisma.oAuthClient.create({
        data: {
            id: 'client-privileged',
            secret: privilegedSecretHash,
            name: 'Privileged Client',
        },
    });
    // -----------------------------
    // ADMIN CLIENT (read + write + admin)
    // -----------------------------
    await db_1.prisma.oAuthClient.create({
        data: {
            id: 'client-admin',
            secret: adminSecretHash,
            name: 'Admin Client',
        },
    });
    process.stdout.write('Seed complete. Existing data was reset and reseeded.\n');
}
main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
    process.exit(0);
});
