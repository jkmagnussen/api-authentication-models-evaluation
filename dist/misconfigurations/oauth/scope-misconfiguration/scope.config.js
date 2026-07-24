"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthScopeMisconfiguration = void 0;
// In this variant, I set `admin`, `read`, and `write` as default scopes.
// That means clients effectively get broad access by default instead of receiving only an explicitly requested minimum scope.
// I use this to show how over-broad defaults break least privilege, and this is a common policy mistake when convenience wins.
exports.oauthScopeMisconfiguration = {
    defaultScopes: ['admin', 'read', 'write'],
};
