"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthStateMisconfiguration = void 0;
// In this variant, I disable OAuth state validation.
// I use this to show how removing state checks weakens CSRF protection in the authorization flow.
// This is still a common implementation mistake when OAuth is integrated quickly.
exports.oauthStateMisconfiguration = {
    validateState: false,
};
