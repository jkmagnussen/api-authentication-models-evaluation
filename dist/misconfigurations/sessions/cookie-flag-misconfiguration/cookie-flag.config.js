"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieFlagMisconfiguration = void 0;
// In this variant, I remove the HttpOnly cookie flag.
// I use this to show how a script-readable session cookie makes XSS-led session theft much easier.
// This is a very common mistake when cookie settings are tuned manually per environment.
exports.cookieFlagMisconfiguration = {
    cookie: {
        httpOnly: false,
    },
};
