"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPkcePair = createPkcePair;
const pkce_challenge_1 = __importDefault(require("pkce-challenge"));
async function createPkcePair() {
    const { code_verifier, code_challenge } = await (0, pkce_challenge_1.default)();
    return { code_verifier, code_challenge };
}
