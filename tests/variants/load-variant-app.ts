export function loadVariantApp() {
  const appVariant = process.env.APP_VARIANT;

  switch (appVariant) {
    case 'oauth-redirect-misconfiguration':
      return require('../../misconfigurations/oauth/redirect-misconfiguration/app.variant').default;
    case 'oauth-state-misconfiguration':
      return require('../../misconfigurations/oauth/state-misconfiguration/app.variant').default;
    case 'oauth-scope-misconfiguration':
      return require('../../misconfigurations/oauth/scope-misconfiguration/app.variant').default;
    case 'jwt-audience-misconfiguration':
      return require('../../misconfigurations/jwt/audience-misconfiguration/app.variant').default;
    case 'jwt-algorithm-misconfiguration':
      return require('../../misconfigurations/jwt/algorithm-misconfiguration/app.variant').default;
    case 'jwt-expiry-misconfiguration':
      return require('../../misconfigurations/jwt/expiry-misconfiguration/app.variant').default;
    case 'sessions-fixation-misconfiguration':
      return require('../../misconfigurations/sessions/fixation-misconfiguration/app.variant')
        .default;
    case 'sessions-cookie-flag-misconfiguration':
      return require('../../misconfigurations/sessions/cookie-flag-misconfiguration/app.variant')
        .default;
    case 'sessions-logout-misconfiguration':
      return require('../../misconfigurations/sessions/logout-misconfiguration/app.variant')
        .default;
    default:
      return require('../../src/app').default;
  }
}
