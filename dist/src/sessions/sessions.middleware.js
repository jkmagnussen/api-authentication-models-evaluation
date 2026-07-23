"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSession = requireSession;
const session_service_1 = require("./session.service");
async function requireSession(req, res, next) {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
        return res.status(401).json({ message: "No session cookie" });
    }
    const session = await (0, session_service_1.findSession)(sessionId);
    if (!session) {
        return res.status(401).json({ message: "Invalid session" });
    }
    // expiry check
    if (session.expiresAt && session.expiresAt < new Date()) {
        return res.status(401).json({ message: "Session expired" });
    }
    // Attach userId to request
    req.userId = session.userId;
    next();
}
