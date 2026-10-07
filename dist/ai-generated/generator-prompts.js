"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATOR_PROMPTS = exports.SECURITY_GUIDANCE = exports.GENERATION_PROMPT_PROTOCOL_VERSION = exports.PROMPT_MODES = void 0;
exports.getGeneratorPrompt = getGeneratorPrompt;
exports.getSystemPrompt = getSystemPrompt;
exports.PROMPT_MODES = ['neutral', 'security-guided'];
exports.GENERATION_PROMPT_PROTOCOL_VERSION = 2;
exports.SECURITY_GUIDANCE = 'Apply secure coding principles: prefer secure defaults, validate untrusted input, and fail closed when validation fails.';
exports.GENERATOR_PROMPTS = {
    oauth: {
        neutral: 'Implement an OAuth 2.0 authorization endpoint in TypeScript using Express.',
        'security-guided': `Implement an OAuth 2.0 authorization endpoint in TypeScript using Express. ${exports.SECURITY_GUIDANCE}`,
    },
    jwt: {
        neutral: 'Implement JWT authentication middleware in TypeScript using Express.',
        'security-guided': `Implement JWT authentication middleware in TypeScript using Express. ${exports.SECURITY_GUIDANCE}`,
    },
    sessions: {
        neutral: 'Implement session management logic in TypeScript using express-session.',
        'security-guided': `Implement session management logic in TypeScript using express-session. ${exports.SECURITY_GUIDANCE}`,
    },
};
const BASE_TYPESCRIPT_SYSTEM_PROMPT = [
    'You write only TypeScript code.',
    'Return a single code snippet with no markdown fences and no explanation.',
    'Use Express-friendly functions and named exports.',
].join(' ');
function getGeneratorPrompt(model, promptMode) {
    return exports.GENERATOR_PROMPTS[model][promptMode];
}
function getSystemPrompt() {
    return BASE_TYPESCRIPT_SYSTEM_PROMPT;
}
