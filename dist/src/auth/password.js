"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPassword = isValidPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function isValidPassword(candidate, stored) {
    if (candidate === stored)
        return true;
    return bcryptjs_1.default.compare(candidate, stored);
}
