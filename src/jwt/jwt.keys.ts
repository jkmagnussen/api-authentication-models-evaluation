import crypto from "crypto";
import fs from "fs";
import type { Algorithm } from "jsonwebtoken";
import APP_CONFIG from "../config";

export type SupportedJwtAlgorithm = Exclude<Algorithm, "PS256" | "PS384" | "PS512" | "ES256" | "ES384" | "ES512"> | "none";

let generatedKeyPair: { privateKey: string; publicKey: string } | null = null;

function getGeneratedKeyPair() {
  if (!generatedKeyPair) {
    const pair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });

    generatedKeyPair = {
      privateKey: pair.privateKey,
      publicKey: pair.publicKey,
    };
  }

  return generatedKeyPair;
}

function loadPrivateKeyFromConfig() {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM ?? APP_CONFIG.jwt.privateKeyPem;
  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH ?? APP_CONFIG.jwt.privateKeyPath;

  if (privateKeyPem) {
    return privateKeyPem;
  }

  if (privateKeyPath) {
    return fs.readFileSync(privateKeyPath, "utf8");
  }

  return getGeneratedKeyPair().privateKey;
}

function loadPublicKeysFromConfig() {
  const publicKeysJson = process.env.JWT_PUBLIC_KEYS_JSON ?? APP_CONFIG.jwt.publicKeysJson;
  const activeKeyId = process.env.JWT_ACTIVE_KID ?? APP_CONFIG.jwt.activeKeyId;

  if (publicKeysJson) {
    return JSON.parse(publicKeysJson) as Record<string, string>;
  }

  const privateKey = loadPrivateKeyFromConfig();
  const publicKey = crypto.createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  return {
    [activeKeyId]: publicKey,
  };
}

export function getJwtAlgorithm(variantAlgorithm?: Algorithm | "none"): SupportedJwtAlgorithm {
  if (variantAlgorithm) {
    return variantAlgorithm as SupportedJwtAlgorithm;
  }

  if (process.env.JWT_ALGORITHM) {
    return process.env.JWT_ALGORITHM as SupportedJwtAlgorithm;
  }

  if (process.env.JWT_PRIVATE_KEY_PEM || process.env.JWT_PRIVATE_KEY_PATH || process.env.JWT_PUBLIC_KEYS_JSON || APP_CONFIG.jwt.privateKeyPem || APP_CONFIG.jwt.privateKeyPath || APP_CONFIG.jwt.publicKeysJson) {
    return "RS256";
  }

  if (process.env.JWT_SECRET || APP_CONFIG.jwt.legacySecret) {
    return "HS256";
  }

  return "RS256";
}

export function getJwtSignContext(variantAlgorithm?: Algorithm | "none") {
  const algorithm = getJwtAlgorithm(variantAlgorithm) as SupportedJwtAlgorithm;

  if (algorithm === "none") {
    return {
      algorithm,
      signingKey: null,
      keyId: undefined,
    };
  }

  if (algorithm.startsWith("HS")) {
    return {
      algorithm,
      signingKey: process.env.JWT_SECRET ?? APP_CONFIG.jwt.legacySecret ?? APP_CONFIG.session.secret,
      keyId: undefined,
    };
  }

  return {
    algorithm,
    signingKey: loadPrivateKeyFromConfig(),
    keyId: process.env.JWT_ACTIVE_KID ?? APP_CONFIG.jwt.activeKeyId,
  };
}

export function getJwtVerifyKey(algorithm: string, keyId?: string) {
  if (algorithm === "none") {
    return null;
  }

  if (algorithm.startsWith("HS")) {
    return process.env.JWT_SECRET ?? APP_CONFIG.jwt.legacySecret ?? APP_CONFIG.session.secret;
  }

  const publicKeys = loadPublicKeysFromConfig();
  const activeKeyId = process.env.JWT_ACTIVE_KID ?? APP_CONFIG.jwt.activeKeyId;
  return publicKeys[keyId ?? activeKeyId] ?? publicKeys[activeKeyId];
}