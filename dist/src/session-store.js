"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSessionStore = buildSessionStore;
exports.getRedisStatus = getRedisStatus;
const connect_redis_1 = require("connect-redis");
const redis_1 = require("redis");
const config_1 = require("./config");
const logger_1 = require("./logger");
let redisClient = null;
let redisConnectStarted = false;
function ensureRedisClient() {
    if (!config_1.APP_CONFIG.session.redisUrl) {
        return null;
    }
    if (!redisClient) {
        redisClient = (0, redis_1.createClient)({
            url: config_1.APP_CONFIG.session.redisUrl,
            socket: {
                reconnectStrategy(retries) {
                    return Math.min(retries * 100, 3000);
                },
            },
        });
        redisClient.on('error', (error) => {
            (0, logger_1.log)('error', 'Redis client error', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
        redisClient.on('ready', () => {
            (0, logger_1.log)('info', 'Redis session store ready');
        });
    }
    if (!redisConnectStarted) {
        redisConnectStarted = true;
        void redisClient.connect().catch((error) => {
            redisConnectStarted = false;
            (0, logger_1.log)('error', 'Failed to connect Redis session store', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    return redisClient;
}
function buildSessionStore() {
    const client = ensureRedisClient();
    if (!client) {
        return undefined;
    }
    return new connect_redis_1.RedisStore({
        client,
        prefix: 'api-auth:sess:',
        ttl: config_1.APP_CONFIG.session.ttlSeconds,
    });
}
function getRedisStatus() {
    if (!redisClient)
        return config_1.APP_CONFIG.session.redisUrl ? 'configured' : 'disabled';
    return redisClient.isReady ? 'ready' : 'connecting';
}
