"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.matchesStoredHashOrValue = matchesStoredHashOrValue;
exports.isValidPassword = isValidPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
async function hashPassword(value) {
    return bcrypt_1.default.hash(value, config_1.BCRYPT_SALT_ROUNDS);
}
async function matchesStoredHashOrValue(candidate, stored) {
    if (candidate === stored)
        return true;
    try {
        return await bcrypt_1.default.compare(candidate, stored);
    }
    catch {
        return false;
    }
}
async function isValidPassword(candidate, stored) {
    return matchesStoredHashOrValue(candidate, stored);
}
