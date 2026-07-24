"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionFixationMisconfiguration = void 0;
// In this variant, I turn off session ID regeneration on login.
// I use this to show session fixation risk: an attacker can pre-set a session ID and reuse it after login.
// This is a known issue and still appears in custom auth flows and older session setups.
exports.sessionFixationMisconfiguration = {
    regenerateOnLogin: false,
};
