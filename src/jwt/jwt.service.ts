import jwt, { SignOptions } from 'jsonwebtoken';
import { findUserByEmail as findUserByEmailFromDb } from '../auth/user';
import { getVariantOverrides } from '../variant-overrides';
import APP_CONFIG from '../config';
import {
  getJwtAlgorithm,
  getJwtSignContext,
  getJwtVerifyKey,
  type SupportedJwtAlgorithm,
} from './jwt.keys';

export function getJwtAudience() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || APP_CONFIG.jwt.audience;
}

export function getJwtIssuer() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || APP_CONFIG.jwt.issuer;
}

function getJwtExpiry() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.expiry || process.env.JWT_EXPIRES_IN || APP_CONFIG.jwt.expiresIn;
}

export function generateJwt(userId: string) {
  const variantOverrides = getVariantOverrides();
  const { algorithm, signingKey, keyId } = getJwtSignContext(variantOverrides.jwt?.algorithm);
  const signOptions: SignOptions = {
    expiresIn: getJwtExpiry() as SignOptions['expiresIn'],
    audience: getJwtAudience(),
    issuer: getJwtIssuer(),
    algorithm: algorithm as SignOptions['algorithm'],
  };

  if (keyId) {
    signOptions.keyid = keyId;
  }

  if (algorithm === 'none') {
    return jwt.sign({ userId }, null as any, {
      ...signOptions,
      algorithm: 'none',
    });
  }

  return jwt.sign({ userId }, signingKey as string, signOptions);
}

export function verifyJwt(token: string) {
  const decodedHeader = jwt.decode(token, { complete: true });
  const header =
    typeof decodedHeader === 'object' && decodedHeader && 'header' in decodedHeader
      ? (decodedHeader.header as { alg?: string; kid?: string })
      : undefined;
  const expectedAlgorithm = getJwtAlgorithm(getVariantOverrides().jwt?.algorithm);
  const verificationAlgorithm = (
    expectedAlgorithm === 'none' ? 'none' : (header?.alg ?? expectedAlgorithm)
  ) as SupportedJwtAlgorithm;
  const key = getJwtVerifyKey(verificationAlgorithm, header?.kid);
  const algorithms = [verificationAlgorithm] as NonNullable<SignOptions['algorithm']>[];

  return jwt.verify(token, key as any, {
    algorithms,
  }) as unknown as { userId: string; aud?: string; iss?: string };
}

export async function findUserByEmail(email: string) {
  return findUserByEmailFromDb(email);
}
