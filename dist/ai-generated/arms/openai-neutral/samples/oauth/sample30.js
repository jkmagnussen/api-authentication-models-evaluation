"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const allowedRedirects = ["https://example.com/callback", "http://localhost/callback"];
const allowedScopes = ["read"];
async function authorize(req, res) {
    const redirectUri = String(req.body.redirectUri ?? "");
    const state = req.body.state;
    const scope = String(req.body.scope ?? "read");
    if (!allowedRedirects.includes(redirectUri)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
    }
    if (state && typeof state !== "string") {
        return res.status(400).json({ error: "invalid_state" });
    }
    if (!allowedScopes.includes(scope)) {
        return res.status(400).json({ error: "invalid_scope" });
    }
    return res.status(200).json({ redirectUri, state, scope });
}
