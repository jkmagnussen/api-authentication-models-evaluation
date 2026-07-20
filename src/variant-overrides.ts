import { Algorithm } from "jsonwebtoken";

export type SessionCookieSameSite = "lax" | "strict" | "none";

export type VariantOverrides = {
  oauth?: {
    allowedRedirects?: string[];
    validateState?: boolean;
    defaultScopes?: string[];
  };
  jwt?: {
    audience?: string;
    issuer?: string;
    algorithm?: Algorithm | "none";
    expiry?: string;
  };
  sessions?: {
    regenerateOnLogin?: boolean;
    invalidateSessionOnLogout?: boolean;
    cookie?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: SessionCookieSameSite;
    };
  };
};

const DEFAULT_VARIANT_OVERRIDES: VariantOverrides = {};

let activeVariantOverrides: VariantOverrides = { ...DEFAULT_VARIANT_OVERRIDES };

export function setVariantOverrides(variantOverrides: VariantOverrides) {
  activeVariantOverrides = {
    ...activeVariantOverrides,
    ...variantOverrides,
    oauth: {
      ...activeVariantOverrides.oauth,
      ...variantOverrides.oauth,
    },
    jwt: {
      ...activeVariantOverrides.jwt,
      ...variantOverrides.jwt,
    },
    sessions: {
      ...activeVariantOverrides.sessions,
      ...variantOverrides.sessions,
      cookie: {
        ...activeVariantOverrides.sessions?.cookie,
        ...variantOverrides.sessions?.cookie,
      },
    },
  };
}

export function getVariantOverrides() {
  return activeVariantOverrides;
}

export function resetVariantOverrides() {
  activeVariantOverrides = { ...DEFAULT_VARIANT_OVERRIDES };
}