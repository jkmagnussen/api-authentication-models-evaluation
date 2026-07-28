"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
/// <reference path="../prisma-client.d.ts" />
const client_1 = require("@prisma/client");
const config_1 = require("./config");
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: config_1.DATABASE_URL,
        },
    },
});
