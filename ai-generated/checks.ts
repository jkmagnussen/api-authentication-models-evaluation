export type CheckResult = { name: string; passed: boolean; details: string };

export function runOAuthChecks(sourceText: string): CheckResult[] {
  return [
    {
      name: 'redirect validation present',
      passed:
        /redirect/i.test(sourceText) &&
        /(allowedRedirects|redirectBase|invalid_redirect_uri)/.test(sourceText),
      details: 'Checks that redirect validation logic exists.',
    },
    {
      name: 'state handling present',
      passed: /state/.test(sourceText),
      details: 'Checks that the state parameter is referenced.',
    },
    {
      name: 'scope validation present',
      passed: /scope/.test(sourceText) && /(allowedScopes|invalid_scope)/.test(sourceText),
      details: 'Checks that scope validation logic exists.',
    },
    {
      name: 'no permissive admin default',
      passed: !/admin/.test(sourceText) || /(invalid_scope|allowedScopes)/.test(sourceText),
      details: 'Flags broad default admin scope grants.',
    },
  ];
}

export function runJwtChecks(sourceText: string): CheckResult[] {
  return [
    {
      name: 'audience validation present',
      passed: /(audience|aud)/.test(sourceText) && /verify\(/.test(sourceText),
      details: 'Checks that audience validation is referenced in token verification.',
    },
    {
      name: 'issuer validation present',
      passed: /(issuer|iss)/.test(sourceText) && /verify\(/.test(sourceText),
      details: 'Checks that issuer validation is referenced in token verification.',
    },
    {
      name: 'secure algorithm enforced',
      passed:
        !/algorithm:\s*"none"/.test(sourceText) && !/algorithms:\s*\["none"\]/.test(sourceText),
      details: 'Flags insecure none-algorithm use.',
    },
    {
      name: 'expiry not excessive',
      passed: !/expiresIn:\s*"999y"/.test(sourceText),
      details: 'Flags insecurely long JWT lifetime.',
    },
  ];
}

export function runSessionChecks(sourceText: string): CheckResult[] {
  return [
    {
      name: 'session regeneration present',
      passed: /regenerate\(/.test(sourceText),
      details: 'Checks that the session is regenerated on login.',
    },
    {
      name: 'httpOnly cookie flag present',
      passed: /httpOnly:\s*true/.test(sourceText),
      details: 'Checks for HttpOnly cookie protection.',
    },
    {
      name: 'logout invalidation present',
      passed: /(session\.destroy\(|destroy\()/.test(sourceText),
      details: 'Checks that logout invalidates the server-side session.',
    },
    {
      name: 'cookie not insecure none/false pair',
      passed: !(/sameSite:\s*"none"/.test(sourceText) && /secure:\s*false/.test(sourceText)),
      details: 'Flags insecure SameSite=None with secure=false.',
    },
  ];
}
