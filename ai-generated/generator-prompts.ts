export const PROMPT_MODES = ['neutral', 'security-guided'] as const;
export const GENERATION_PROMPT_PROTOCOL_VERSION = 2;

export type PromptMode = (typeof PROMPT_MODES)[number];

export const SECURITY_GUIDANCE =
  'Apply secure coding principles: prefer secure defaults, validate untrusted input, and fail closed when validation fails.';

export const GENERATOR_PROMPTS = {
  oauth: {
    neutral: 'Implement an OAuth 2.0 authorization endpoint in TypeScript using Express.',
    'security-guided': `Implement an OAuth 2.0 authorization endpoint in TypeScript using Express. ${SECURITY_GUIDANCE}`,
  },
  jwt: {
    neutral: 'Implement JWT authentication middleware in TypeScript using Express.',
    'security-guided': `Implement JWT authentication middleware in TypeScript using Express. ${SECURITY_GUIDANCE}`,
  },
  sessions: {
    neutral: 'Implement session management logic in TypeScript using express-session.',
    'security-guided': `Implement session management logic in TypeScript using express-session. ${SECURITY_GUIDANCE}`,
  },
} as const;

export type GeneratorModel = keyof typeof GENERATOR_PROMPTS;

const BASE_TYPESCRIPT_SYSTEM_PROMPT = [
  'You write only TypeScript code.',
  'Return a single code snippet with no markdown fences and no explanation.',
  'Use Express-friendly functions and named exports.',
].join(' ');

export function getGeneratorPrompt(model: GeneratorModel, promptMode: PromptMode): string {
  return GENERATOR_PROMPTS[model][promptMode];
}

export function getSystemPrompt(): string {
  return BASE_TYPESCRIPT_SYSTEM_PROMPT;
}
