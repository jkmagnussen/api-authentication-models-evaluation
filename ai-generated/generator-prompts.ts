export const PROMPT_MODES = ["neutral", "security-guided"] as const;

export type PromptMode = typeof PROMPT_MODES[number];

export const GENERATOR_PROMPTS = {
  oauth: {
    neutral: "Implement an OAuth2 authorization endpoint in TypeScript using Express.",
    "security-guided":
      "Generate a secure OAuth2 authorization endpoint in TypeScript using Express. Include redirect validation, state parameter handling, and scope validation.",
  },
  jwt: {
    neutral: "Implement JWT authentication middleware in TypeScript using Express.",
    "security-guided":
      "Generate secure JWT authentication middleware in TypeScript using Express. Include audience validation, issuer validation, algorithm selection, and expiry configuration.",
  },
  sessions: {
    neutral: "Implement session management logic in TypeScript using express-session.",
    "security-guided":
      "Generate secure session management logic in TypeScript using express-session. Include session regeneration, cookie flags, and logout invalidation.",
  },
} as const;

export type GeneratorModel = keyof typeof GENERATOR_PROMPTS;

const BASE_TYPESCRIPT_SYSTEM_PROMPT = [
  "You write only TypeScript code.",
  "Return a single code snippet with no markdown fences and no explanation.",
  "Use Express-friendly functions and named exports.",
].join(" ");

const SECURITY_GUIDED_TYPESCRIPT_SYSTEM_PROMPT = [
  BASE_TYPESCRIPT_SYSTEM_PROMPT,
  "Prioritize secure defaults and explicit validation.",
].join(" ");

export function getGeneratorPrompt(model: GeneratorModel, promptMode: PromptMode): string {
  return GENERATOR_PROMPTS[model][promptMode];
}

export function getSystemPrompt(promptMode: PromptMode): string {
  return promptMode === "security-guided"
    ? SECURITY_GUIDED_TYPESCRIPT_SYSTEM_PROMPT
    : BASE_TYPESCRIPT_SYSTEM_PROMPT;
}
