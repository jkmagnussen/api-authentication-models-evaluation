"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutMisconfiguration = void 0;
// In this variant, I disable server-side session invalidation on logout.
// I use this to show how a stolen cookie may still work after a user logs out.
// This is fairly common when logout is treated as UI state rather than a strict server-side security action.
exports.logoutMisconfiguration = {
    invalidateSessionOnLogout: false,
};
