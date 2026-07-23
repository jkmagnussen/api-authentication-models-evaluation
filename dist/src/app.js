"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const db_1 = require("./db");
const oauth_routes_1 = __importDefault(require("./oauth/oauth.routes"));
const sessions_routes_1 = __importDefault(require("./sessions/sessions.routes"));
const jwt_routes_1 = __importDefault(require("./jwt/jwt.routes"));
const account_security_routes_1 = __importDefault(require("./auth/account-security.routes"));
const variant_overrides_1 = require("./variant-overrides");
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./logger");
const session_store_1 = require("./session-store");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
const sessionCookieOverride = variantOverrides.sessions?.cookie;
const allowedCorsOrigins = new Set(config_1.default.corsOrigins);
app.disable("x-powered-by");
if (config_1.default.trustProxy) {
    app.set("trust proxy", 1);
}
app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
        if (req.path.startsWith("/health"))
            return;
        (0, logger_1.log)("info", "request.completed", {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip,
        });
    });
    next();
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedCorsOrigins.size === 0 || allowedCorsOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Session middleware
app.use((0, express_session_1.default)({
    name: "appSessionId",
    secret: config_1.default.session.secret,
    resave: false,
    saveUninitialized: false,
    proxy: config_1.default.trustProxy,
    store: (0, session_store_1.buildSessionStore)(),
    cookie: {
        secure: sessionCookieOverride?.secure ?? config_1.default.cookie.secure,
        httpOnly: sessionCookieOverride?.httpOnly ?? config_1.default.cookie.httpOnly,
        sameSite: sessionCookieOverride?.sameSite ?? config_1.default.cookie.sameSite,
        domain: config_1.default.cookie.domain,
        maxAge: config_1.default.cookie.maxAgeMs,
    },
}));
app.get("/", (req, res) => {
    res.send("API running");
});
app.get("/health/live", (_req, res) => {
    res.json({ status: "ok" });
});
app.get("/health/ready", async (_req, res) => {
    try {
        await db_1.prisma.$queryRawUnsafe("SELECT 1");
        res.json({
            status: "ready",
            services: {
                database: "ready",
                redis: (0, session_store_1.getRedisStatus)(),
            },
        });
    }
    catch (error) {
        (0, logger_1.log)("error", "health.ready.failed", {
            error: error instanceof Error ? error.message : String(error),
        });
        res.status(503).json({
            status: "degraded",
            services: {
                database: "error",
                redis: (0, session_store_1.getRedisStatus)(),
            },
        });
    }
});
app.get("/metrics", (_req, res) => {
    res.json({
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssBytes: process.memoryUsage().rss,
        redis: (0, session_store_1.getRedisStatus)(),
        env: config_1.default.env,
    });
});
// Routes
app.use("/oauth", oauth_routes_1.default);
app.use("/sessions", sessions_routes_1.default);
app.use("/jwt", jwt_routes_1.default);
app.use("/auth/security", account_security_routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
