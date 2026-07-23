import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient, type RedisClientType } from "redis";
import { APP_CONFIG } from "./config";
import { log } from "./logger";

let redisClient: RedisClientType | null = null;
let redisConnectStarted = false;

function ensureRedisClient() {
  if (!APP_CONFIG.session.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({
      url: APP_CONFIG.session.redisUrl,
      socket: {
        reconnectStrategy(retries) {
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (error) => {
      log("error", "Redis client error", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    redisClient.on("ready", () => {
      log("info", "Redis session store ready");
    });
  }

  if (!redisConnectStarted) {
    redisConnectStarted = true;
    void redisClient.connect().catch((error) => {
      redisConnectStarted = false;
      log("error", "Failed to connect Redis session store", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return redisClient;
}

export function buildSessionStore(): session.Store | undefined {
  const client = ensureRedisClient();

  if (!client) {
    return undefined;
  }

  return new RedisStore({
    client,
    prefix: "api-auth:sess:",
    ttl: APP_CONFIG.session.ttlSeconds,
  });
}

export function getRedisStatus() {
  if (!redisClient) return APP_CONFIG.session.redisUrl ? "configured" : "disabled";
  return redisClient.isReady ? "ready" : "connecting";
}