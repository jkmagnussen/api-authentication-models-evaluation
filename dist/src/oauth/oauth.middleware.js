"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
exports.validateAuthorize = validateAuthorize;
exports.validateToken = validateToken;
const oauth_service_1 = require("./oauth.service");
const db_1 = require("../db");
// 🔐 Validate Bearer access token
async function verifyAccessToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = header.replace("Bearer ", "");
    const valid = await (0, oauth_service_1.validateAccessToken)(token);
    if (!valid) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.userId = valid.userId;
    req.clientId = valid.clientId;
    req.scope = valid.scope;
    next();
}
// 🔐 Validate /authorize input
async function validateAuthorize(req, res, next) {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    if (typeof userId !== "string") {
        return res.status(400).json({ error: "userId must be a string" });
    }
    if (/^\d+$/.test(userId)) {
        return res.status(400).json({ error: "userId cannot be numeric" });
    }
    if (/[<>]/.test(userId)) {
        return res.status(400).json({ error: "userId contains invalid characters" });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: "userId must be a valid UUID" });
    }
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        return res.status(400).json({ error: "User does not exist" });
    }
    next();
}
// 🔐 Validate /token input
function validateToken(req, res, next) {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
        return res.status(400).json({
            error: "authorization code is required and must be a string"
        });
    }
    next();
}
