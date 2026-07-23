"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithSession = loginWithSession;
exports.logoutSession = logoutSession;
exports.getSessionProtected = getSessionProtected;
const user_1 = require("../auth/user");
const password_1 = require("../auth/password");
const session_service_1 = require("./session.service");
const session_service_2 = require("./session.service");
const variant_overrides_1 = require("../variant-overrides");
async function loginWithSession(req, res, next) {
    try {
        const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
        const regenerateOnLogin = variantOverrides.sessions?.regenerateOnLogin ?? true;
        const sessionCookieOverride = variantOverrides.sessions?.cookie;
        const { email, password } = req.body;
        const user = await (0, user_1.findUserByEmail)(email);
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const match = await (0, password_1.isValidPassword)(password, user.password);
        if (!match)
            return res.status(401).json({ message: "Invalid credentials" });
        const existingSessionId = req.cookies?.sessionId;
        if (existingSessionId && regenerateOnLogin) {
            await (0, session_service_2.deleteSession)(existingSessionId).catch(() => undefined);
        }
        const session = existingSessionId && !regenerateOnLogin
            ? await (0, session_service_2.createSessionWithId)(user.id, existingSessionId)
            : await (0, session_service_1.createSession)(user.id);
        res.cookie("sessionId", session.id, {
            httpOnly: sessionCookieOverride?.httpOnly ?? true,
            secure: sessionCookieOverride?.secure ?? false,
            sameSite: sessionCookieOverride?.sameSite ?? "lax",
        });
        return res.status(200).json({
            message: "Session created",
            user: { id: user.id, email: user.email },
        });
    }
    catch (err) {
        next(err);
    }
}
async function logoutSession(req, res) {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    const invalidateSessionOnLogout = variantOverrides.sessions?.invalidateSessionOnLogout ?? true;
    const sessionId = req.cookies.sessionId;
    if (sessionId && invalidateSessionOnLogout) {
        await (0, session_service_2.deleteSession)(sessionId); // delete from DB
    }
    res.clearCookie("sessionId"); // remove cookie
    return res.json({ message: "Logged out" });
}
function getSessionProtected(req, res) {
    return res.json({
        message: "Protected route accessed",
        userId: req.userId, // set by requireSession middleware
    });
}
