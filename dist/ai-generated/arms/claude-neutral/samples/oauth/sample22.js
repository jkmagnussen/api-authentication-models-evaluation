"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const redirectBase = "https://example.com/callback";
const allowedScopes = ["read", "write"];
async function authorize(req, res) {
    const redirectUri = String(req.body.redirectUri ?? "");
    const requestedState = String(req.body.state ?? "");
    const requestedScopes = String(req.body.scope ?? "read").split(" ");
    if (!redirectUri.startsWith(redirectBase)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
    }
    if (!requestedState) {
        return res.status(400).json({ error: "invalid_state" });
    }
    if (requestedScopes.some((scope) => !allowedScopes.includes(scope))) {
        return res.status(400).json({ error: "invalid_scope" });
    }
    return res.status(200).json({ redirectUri, requestedState, requestedScopes });
}
