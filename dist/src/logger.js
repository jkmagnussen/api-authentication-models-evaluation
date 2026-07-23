"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
const config_1 = require("./config");
const levelWeight = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
function shouldLog(level) {
    const configuredLevel = config_1.APP_CONFIG.observability.logLevel || "info";
    return levelWeight[level] >= levelWeight[configuredLevel];
}
function log(level, message, extra = {}) {
    if (!shouldLog(level))
        return;
    const payload = {
        ts: new Date().toISOString(),
        level,
        message,
        ...extra,
    };
    const line = JSON.stringify(payload);
    if (level === "error") {
        console.error(line);
        return;
    }
    if (level === "warn") {
        console.warn(line);
        return;
    }
    console.log(line);
}
