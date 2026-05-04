"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.role.upsert({
        where: { name: "USER" },
        update: {},
        create: { name: "USER" }
    });
    await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN" }
    });
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
