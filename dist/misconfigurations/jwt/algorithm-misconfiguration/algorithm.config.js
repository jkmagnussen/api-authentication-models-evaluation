"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAlgorithmMisconfiguration = void 0;
// In this variant, I set JWT to use `none`, so a token can be accepted without a real signature.
// I use this to show how signature verification can be bypassed if algorithm handling is too loose.
// It is less common in modern frameworks now, but it still appears in legacy code and rushed custom validators.
exports.jwtAlgorithmMisconfiguration = {
    algorithm: 'none',
};
