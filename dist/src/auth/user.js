"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
const db_1 = require("../db");
async function findUserByEmail(email) {
    return db_1.prisma.user.findUnique({ where: { email } });
}
