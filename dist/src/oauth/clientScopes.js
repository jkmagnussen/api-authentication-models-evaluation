"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientScopes = void 0;
exports.clientScopes = {
    'client-basic': ['read'], // read-only client
    'client-privileged': ['read', 'write'], // read + write client
    'client-admin': ['read', 'write', 'admin'], // full admin privileges
};
