"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const allowedRedirects = new Set(["https://example.com/callback"]);
const allowedScopes = new Set(["read", "write"]);
async function authorize(req, res) {
    const { redirectUri, state, scope } = req.body;
    if (!allowedRedirects.has(redirectUri)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
    }
    if (typeof state !== "string" || state.length < 8) {
        return res.status(400).json({ error: "invalid_state" });
    }
    const requestedScopes = String(scope ?? "read").split(" ");
    const invalidScope = requestedScopes.some((entry) => !allowedScopes.has(entry));
    if (invalidScope) {
        return res.status(400).json({ error: "invalid_scope" });
    }
    return res.status(200).json({ redirectUri, state, scope: requestedScopes.join(" ") });
}
