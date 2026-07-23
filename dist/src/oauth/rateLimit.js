"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.oauthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "rate_limited",
        error_description: "Too many OAuth requests, slow down."
    }
});
