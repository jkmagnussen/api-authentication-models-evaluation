"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferredPort = getPreferredPort;
exports.getPreferredHost = getPreferredHost;
require("./express-session-augment");
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./logger");
function getPreferredPort() {
    return Number(process.env.PORT ?? config_1.PORT);
}
function getPreferredHost() {
    return process.env.HOST ?? '0.0.0.0';
}
async function startServer() {
    const configValidation = (0, config_1.validateRuntimeConfig)();
    for (const warning of configValidation.warnings) {
        (0, logger_1.log)('warn', 'runtime.config.warning', { warning });
    }
    if (configValidation.errors.length > 0) {
        for (const error of configValidation.errors) {
            (0, logger_1.log)('error', 'runtime.config.error', { error });
        }
        process.exit(1);
    }
    const preferredPort = getPreferredPort();
    const preferredHost = getPreferredHost();
    const server = app_1.default.listen(preferredPort, preferredHost, () => {
        (0, logger_1.log)('info', 'server.started', {
            port: preferredPort,
            host: preferredHost,
            url: `http://${preferredHost === '0.0.0.0' ? 'localhost' : preferredHost}:${preferredPort}`,
        });
    });
    server.on('error', (error) => {
        (0, logger_1.log)('error', 'server.failed', {
            error: error.message,
            code: error.code,
        });
        process.exit(1);
    });
}
void startServer();
