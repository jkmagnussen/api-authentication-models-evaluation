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
    if (process.env.LOG_PKCE_STARTUP !== "true")
        return;
    const { code_verifier, code_challenge } = await (0, pkce_1.createPkcePair)();
    console.log("------------------------------------------------------------");
    console.log("🔐 Generated PKCE Pair:");
    console.log("code_challenge:", code_challenge);
    console.log("code_verifier:", code_verifier);
    console.log("------------------------------------------------------------");
}
async function startServer() {
    const configValidation = (0, config_1.validateRuntimeConfig)();
    for (const warning of configValidation.warnings) {
        (0, logger_1.log)("warn", "runtime.config.warning", { warning });
    }
    if (configValidation.errors.length > 0) {
        for (const error of configValidation.errors) {
            (0, logger_1.log)("error", "runtime.config.error", { error });
        }
        process.exit(1);
    }
    try {
        await printPkce();
    }
    catch (error) {
        console.error("Failed to generate startup PKCE pair:", error);
    }
    const hasExplicitPort = process.env.PORT !== undefined && process.env.PORT !== "";
    const fallbackPorts = hasExplicitPort ? [config_1.PORT] : [config_1.PORT, config_1.PORT + 1, config_1.PORT + 2, config_1.PORT + 3, config_1.PORT + 4];
    const canBindPort = (port) => new Promise((resolve) => {
        const probe = net_1.default.createServer();
        probe.unref();
        probe.on("error", () => resolve(false));
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
        console.error(`Port ${config_1.PORT} is already in use. Stop the other process or change PORT.`);
        process.exit(1);
    }
    if (!hasExplicitPort && selectedPort !== config_1.PORT) {
        console.warn(`Port ${config_1.PORT} is already in use; using ${selectedPort} instead.`);
    }
    const server = app_1.default.listen(selectedPort, () => {
        console.log(`Server running on http://localhost:${selectedPort}`);
    });
    server.on("error", (error) => {
        console.error("Server failed to start:", error);
        process.exit(1);
    });
}
void startServer();
