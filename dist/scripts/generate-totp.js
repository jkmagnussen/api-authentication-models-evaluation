"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const totp_1 = require("../src/auth/totp");
const providedSecret = process.argv[2] ?? process.env.MFA_SECRET;
if (!providedSecret) {
    console.log((0, totp_1.generateTotpSecret)());
    process.exit(0);
}
console.log((0, totp_1.generateCurrentTotp)(providedSecret));
