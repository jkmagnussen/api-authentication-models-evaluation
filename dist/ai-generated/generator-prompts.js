"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATOR_PROMPTS = exports.PROMPT_MODES = void 0;
exports.getGeneratorPrompt = getGeneratorPrompt;
exports.getSystemPrompt = getSystemPrompt;
exports.PROMPT_MODES = ["neutral", "security-guided"];
exports.GENERATOR_PROMPTS = {
    oauth: {
        neutral: "Implement an OAuth2 authorization endpoint in TypeScript using Express.",
        "security-guided": "Generate a secure OAuth2 authorization endpoint in TypeScript using Express. Include redirect validation, state parameter handling, and scope validation.",
    },
    jwt: {
        neutral: "Implement JWT authentication middleware in TypeScript using Express.",
        "security-guided": "Generate secure JWT authentication middleware in TypeScript using Express. Include audience validation, issuer validation, algorithm selection, and expiry configuration.",
    },
    sessions: {
        neutral: "Implement session management logic in TypeScript using express-session.",
        "security-guided": "Generate secure session management logic in TypeScript using express-session. Include session regeneration, cookie flags, and logout invalidation.",
    },
};
const BASE_TYPESCRIPT_SYSTEM_PROMPT = [
    "You write only TypeScript code.",
    "Return a single code snippet with no markdown fences and no explanation.",
    "Use Express-friendly functions and named exports.",
].join(" ");
const SECURITY_GUIDED_TYPESCRIPT_SYSTEM_PROMPT = [
    BASE_TYPESCRIPT_SYSTEM_PROMPT,
    "Prioritize secure defaults and explicit validation.",
].join(" ");
function getGeneratorPrompt(model, promptMode) {
    return exports.GENERATOR_PROMPTS[model][promptMode];
}
function getSystemPrompt(promptMode) {
    return promptMode === "security-guided"
        ? SECURITY_GUIDED_TYPESCRIPT_SYSTEM_PROMPT
        : BASE_TYPESCRIPT_SYSTEM_PROMPT;
}
