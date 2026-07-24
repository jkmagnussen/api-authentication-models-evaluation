import type { CheckResult } from './checks';

function hasPattern(sourceText: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(sourceText));
}

export function runOAuthChecksSecondary(sourceText: string): CheckResult[] {
  const hasRedirectAllowList = hasPattern(sourceText, [
    /allowedRedirects/,
    /redirectBase/,
    /new\s+URL\(/,
  ]);
  const hasRedirectRejectPath = hasPattern(sourceText, [
    /invalid_redirect_uri/,
    /return\s+res\.status\(400\)/,
    /throw\s+new\s+Error\(/,
  ]);
  const hasStateValidation = hasPattern(sourceText, [
    /invalid_state/,
    /state\s*\!==/,
    /state\s*===/,
    /state\s*\?\?/,
  ]);
  const hasScopeValidation = hasPattern(sourceText, [
    /allowedScopes/,
    /invalid_scope/,
    /scope\.split\(/,
    /requestedScopes/,
  ]);

  return [
    {
      name: 'redirect validation present',
      passed: hasRedirectAllowList && hasRedirectRejectPath,
      details:
        'Secondary checker: looks for redirect allow-listing or explicit redirect URI rejection.',
    },
    {
      name: 'state handling present',
      passed: /state/.test(sourceText) && hasStateValidation,
      details: 'Secondary checker: requires state mention plus a validation/rejection signal.',
    },
    {
      name: 'scope validation present',
      passed: /scope/.test(sourceText) && hasScopeValidation,
      details: 'Secondary checker: looks for scope parsing and allow-list style checks.',
    },
    {
      name: 'no permissive admin default',
      passed: !hasPattern(sourceText, [
        /scope\s*:\s*"admin"/,
        /defaultScopes\s*=\s*\[[^\]]*admin/i,
      ]),
      details: 'Secondary checker: flags hard-coded permissive admin scope defaults.',
    },
  ];
}

export function runJwtChecksSecondary(sourceText: string): CheckResult[] {
  const hasVerifyCall = /verify\(/.test(sourceText);
  const hasAudienceValidation = hasPattern(sourceText, [
    /audience\s*:/,
    /aud\s*:/,
    /invalid_audience/,
  ]);
  const hasIssuerValidation = hasPattern(sourceText, [/issuer\s*:/, /iss\s*:/, /invalid_issuer/]);

  return [
    {
      name: 'audience validation present',
      passed: hasVerifyCall && hasAudienceValidation,
      details: 'Secondary checker: requires audience claim handling in token verification flow.',
    },
    {
      name: 'issuer validation present',
      passed: hasVerifyCall && hasIssuerValidation,
      details: 'Secondary checker: requires issuer claim handling in token verification flow.',
    },
    {
      name: 'secure algorithm enforced',
      passed: !hasPattern(sourceText, [
        /algorithm\s*:\s*"none"/,
        /algorithms\s*:\s*\[\s*"none"\s*\]/,
      ]),
      details: 'Secondary checker: explicitly rejects none algorithm usage.',
    },
    {
      name: 'expiry not excessive',
      passed: !hasPattern(sourceText, [/expiresIn\s*:\s*"\d+y"/, /expiresIn\s*:\s*"999y"/]),
      details: 'Secondary checker: rejects highly excessive token lifetime expressions.',
    },
  ];
}

export function runSessionChecksSecondary(sourceText: string): CheckResult[] {
  const hasServerSideLogout = hasPattern(sourceText, [/session\.destroy\(/, /destroy\(/]);
  const hasCookieClear = /clearCookie\(/.test(sourceText);

  return [
    {
      name: 'session regeneration present',
      passed: hasPattern(sourceText, [/session\.regenerate\(/, /regenerate\(/]),
      details: 'Secondary checker: looks for explicit session regeneration on auth boundary.',
    },
    {
      name: 'httpOnly cookie flag present',
      passed: /httpOnly\s*:\s*true/.test(sourceText),
      details: 'Secondary checker: requires HttpOnly cookie flag to be set true.',
    },
    {
      name: 'logout invalidation present',
      passed: hasServerSideLogout && hasCookieClear,
      details:
        'Secondary checker: requires explicit server-side session invalidation or cookie clearing on logout.',
    },
    {
      name: 'cookie not insecure none/false pair',
      passed: !(/sameSite\s*:\s*"none"/.test(sourceText) && /secure\s*:\s*false/.test(sourceText)),
      details: 'Secondary checker: flags SameSite=None paired with secure=false.',
    },
  ];
}
