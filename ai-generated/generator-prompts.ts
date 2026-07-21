export const GENERATOR_PROMPTS = {
  oauth:
    "Generate a secure OAuth2 authorization endpoint in TypeScript using Express. Include redirect validation, state parameter handling, and scope validation.",
  jwt:
    "Generate secure JWT authentication middleware in TypeScript using Express. Include audience validation, issuer validation, algorithm selection, and expiry configuration.",
  sessions:
    "Generate secure session management logic in TypeScript using express-session. Include session regeneration, cookie flags, and logout invalidation.",
} as const;

export type GeneratorModel = keyof typeof GENERATOR_PROMPTS;

export const SECURE_TYPESCRIPT_SYSTEM_PROMPT = [
  "You write only TypeScript code.",
  "Return a single code snippet with no markdown fences and no explanation.",
  "Use Express-friendly functions and named exports.",
  "Prioritize secure defaults and explicit validation.",
].join(" ");
