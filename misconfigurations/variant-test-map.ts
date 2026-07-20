export const variantTestMap = {
  "oauth-redirect-misconfiguration": {
    category: "oauth",
    focusedTest: "tests/variants/oauth/redirect-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/oauth/redirect.test.ts"],
    regression: "Untrusted redirect URI is accepted instead of rejected.",
    command: "npm run test:variant:oauth:redirect",
  },
  "oauth-state-misconfiguration": {
    category: "oauth",
    focusedTest: "tests/variants/oauth/state-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/oauth/replay.test.ts", "tests/attacks/oauth/state.test.ts"],
    regression: "Authorization code exchange succeeds despite mismatched state.",
    command: "npm run test:variant:oauth:state",
  },
  "oauth-scope-misconfiguration": {
    category: "oauth",
    focusedTest: "tests/variants/oauth/scope-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/oauth/scope.test.ts", "tests/attacks/oauth/scope-escalation.high-impact.test.ts"],
    regression: "Over-privileged scopes are granted to low-privilege clients.",
    command: "npm run test:variant:oauth:scope",
  },
  "jwt-audience-misconfiguration": {
    category: "jwt",
    focusedTest: "tests/variants/jwt/audience-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/jwt/audience-issuer-mismatch.test.ts"],
    regression: "Tokens minted for weak audience/issuer values are accepted.",
    command: "npm run test:variant:jwt:audience",
  },
  "jwt-algorithm-misconfiguration": {
    category: "jwt",
    focusedTest: "tests/variants/jwt/algorithm-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/jwt/audience-issuer-mismatch.test.ts", "tests/attacks/jwt/claim-abuse.test.ts"],
    regression: "Unsigned JWTs with alg=none are accepted.",
    command: "npm run test:variant:jwt:algorithm",
  },
  "jwt-expiry-misconfiguration": {
    category: "jwt",
    focusedTest: "tests/variants/jwt/expiry-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/jwt/integration/expiry.test.ts"],
    regression: "Issued JWT lifetime becomes excessively long.",
    command: "npm run test:variant:jwt:expiry",
  },
  "sessions-fixation-misconfiguration": {
    category: "sessions",
    focusedTest: "tests/variants/sessions/fixation-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/sessions/fixation.test.ts", "tests/attacks/auth.security.test.ts"],
    regression: "Attacker-controlled session id survives login.",
    command: "npm run test:variant:sessions:fixation",
  },
  "sessions-cookie-flag-misconfiguration": {
    category: "sessions",
    focusedTest: "tests/variants/sessions/cookie-flag-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/sessions/csrf.test.ts"],
    regression: "Session cookie loses HttpOnly protection.",
    command: "npm run test:variant:sessions:cookie",
  },
  "sessions-logout-misconfiguration": {
    category: "sessions",
    focusedTest: "tests/variants/sessions/logout-misconfiguration.variant.test.ts",
    baselineEvidence: ["tests/attacks/auth.security.test.ts"],
    regression: "Logged-out session remains valid for replay with stolen cookie.",
    command: "npm run test:variant:sessions:logout",
  },
} as const;

export type VariantName = keyof typeof variantTestMap;
