"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTotpSecret = generateTotpSecret;
exports.buildOtpAuthUrl = buildOtpAuthUrl;
exports.verifyTotp = verifyTotp;
exports.generateCurrentTotp = generateCurrentTotp;
const crypto_1 = __importDefault(require("crypto"));
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function toBase32(buffer) {
    let bits = 0;
    let value = 0;
    let output = "";
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}
function fromBase32(input) {
    const normalized = input.replace(/=+$/g, "").toUpperCase();
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char);
        if (index === -1) {
            throw new Error("Invalid base32 secret");
        }
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}
function generateTotp(secret, offset = 0) {
    const step = 30;
    const counter = Math.floor(Date.now() / 1000 / step) + offset;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter % 0x100000000, 4);
    const key = fromBase32(secret);
    const hmac = crypto_1.default.createHmac("sha1", key).update(counterBuffer).digest();
    const dynamicOffset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[dynamicOffset] & 0x7f) << 24)
        | ((hmac[dynamicOffset + 1] & 0xff) << 16)
        | ((hmac[dynamicOffset + 2] & 0xff) << 8)
        | (hmac[dynamicOffset + 3] & 0xff);
    return String(code % 1000000).padStart(6, "0");
}
function generateTotpSecret() {
    return toBase32(crypto_1.default.randomBytes(20));
}
function buildOtpAuthUrl(email, issuer, secret) {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
function verifyTotp(code, secret) {
    return [0, -1, 1].some((offset) => generateTotp(secret, offset) === code);
}
function generateCurrentTotp(secret) {
    return generateTotp(secret);
}
