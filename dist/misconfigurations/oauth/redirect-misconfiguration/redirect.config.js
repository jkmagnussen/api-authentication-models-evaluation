"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRedirectMisconfiguration = void 0;
// In this variant, I allow an untrusted redirect URI (`http://evil.com`).
// I use this to show how weak redirect checks can leak authorization codes or tokens to attacker endpoints.
// This is one of the most common OAuth mistakes when redirect allowlists are managed manually.
exports.oauthRedirectMisconfiguration = {
    allowedRedirects: ['https://example.com/callback', 'http://evil.com'],
};
