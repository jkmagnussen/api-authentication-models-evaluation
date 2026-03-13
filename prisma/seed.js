"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.role.createMany({
        data: [
            { name: "USER" },
            { name: "ADMIN" }
        ],
        skipDuplicates: true
    });
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
