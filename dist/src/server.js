"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./express-session-augment");
require("dotenv/config");
const net_1 = __importDefault(require("net"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const pkce_1 = require("./oauth/pkce");
// Optional PKCE startup output for Postman-driven testing.
async function printPkce() {
    if (process.env.LOG_PKCE_STARTUP !== 'true')
        return;
    const { code_verifier, code_challenge } = await (0, pkce_1.createPkcePair)();
    (0, logger_1.log)('info', 'pkce.startup', {
        message: 'Generated PKCE Pair',
        code_challenge,
        code_verifier,
    });
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
    try {
        await printPkce();
    }
    catch (error) {
        (0, logger_1.log)('error', 'pkce.startup.failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
    const hasExplicitPort = process.env.PORT !== undefined && process.env.PORT !== '';
    const fallbackPorts = hasExplicitPort ? [config_1.PORT] : [config_1.PORT, config_1.PORT + 1, config_1.PORT + 2, config_1.PORT + 3, config_1.PORT + 4];
    const canBindPort = (port) => new Promise((resolve) => {
        const probe = net_1.default.createServer();
        probe.unref();
        probe.on('error', () => resolve(false));
        probe.listen(port, () => {
            probe.close(() => resolve(true));
        });
    });
    let selectedPort = null;
    for (const port of fallbackPorts) {
        if (await canBindPort(port)) {
            selectedPort = port;
            break;
        }
    }
    if (selectedPort === null) {
        (0, logger_1.log)('error', 'server.port.unavailable', {
            requestedPort: config_1.PORT,
            message: `Port ${config_1.PORT} is already in use. Stop the other process or change PORT.`,
        });
        process.exit(1);
    }
    if (!hasExplicitPort && selectedPort !== config_1.PORT) {
        (0, logger_1.log)('warn', 'server.port.fallback', {
            requestedPort: config_1.PORT,
            selectedPort,
            message: `Port ${config_1.PORT} is already in use; using ${selectedPort} instead.`,
        });
    }
    const server = app_1.default.listen(selectedPort, () => {
        (0, logger_1.log)('info', 'server.started', {
            port: selectedPort,
            url: `http://localhost:${selectedPort}`,
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
