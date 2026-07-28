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
function startServer(port = getPreferredPort(), host = getPreferredHost(), attempts = 0) {
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
    const server = app_1.default.listen(port, host, () => {
        const actualPort = server.address()?.port ?? port;
        const actualHost = host === '0.0.0.0' ? 'localhost' : host;
        process.env.PORT = String(actualPort);
        process.env.HOST = host;
        (0, logger_1.log)('info', 'server.started', {
            port: actualPort,
            host,
            url: `http://${actualHost}:${actualPort}`,
        });
    });
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && attempts < 4) {
            const nextPort = port + 1;
            (0, logger_1.log)('warn', 'server.port.in_use', {
                attemptedPort: port,
                nextPort,
            });
            startServer(nextPort, host, attempts + 1);
            return;
        }
        (0, logger_1.log)('error', 'server.failed', {
            error: error.message,
            code: error.code,
            port,
        });
        process.exit(1);
    });
}
void startServer();
