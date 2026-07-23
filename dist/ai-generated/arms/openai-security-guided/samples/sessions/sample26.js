"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithSession = loginWithSession;
exports.logoutSession = logoutSession;
function loginWithSession(req, res) {
    req.session.regenerate((error) => {
        if (error) {
            return res.status(500).json({ error: "session_regeneration_failed" });
        }
        req.session.userId = req.body.userId;
        res.cookie("sessionId", req.sessionID, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        });
        return res.status(200).json({ message: "session_created" });
    });
}
function logoutSession(req, res) {
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.status(200).json({ message: "logged_out" });
    });
}
