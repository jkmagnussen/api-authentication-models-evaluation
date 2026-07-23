"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const allowedRedirects = new Set(["https://example.com/callback"]);
const defaultScopes = ["admin", "read", "write"];
async function authorize(req, res) {
    const redirectUri = String(req.body.redirectUri ?? "");
    const state = String(req.body.state ?? "");
    const scope = String(req.body.scope ?? defaultScopes.join(" "));
    if (!allowedRedirects.has(redirectUri)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
    }
    if (!state) {
        return res.status(400).json({ error: "invalid_state" });
    }
    return res.status(200).json({ redirectUri, state, scope });
}
