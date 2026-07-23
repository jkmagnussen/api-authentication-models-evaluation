"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const allowedRedirects = ["https://example.com/callback"];
async function authorize(req, res) {
    const redirectUri = req.body.redirectUri;
    const scope = req.body.scope ?? "read";
    if (!allowedRedirects.includes(redirectUri)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
    }
    return res.status(200).json({ redirectUri, scope });
}
