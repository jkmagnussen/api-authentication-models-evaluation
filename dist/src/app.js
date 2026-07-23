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
const oauth_routes_1 = __importDefault(require("./oauth/oauth.routes"));
const sessions_routes_1 = __importDefault(require("./sessions/sessions.routes"));
const jwt_routes_1 = __importDefault(require("./jwt/jwt.routes"));
const variant_overrides_1 = require("./variant-overrides");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
const sessionCookieOverride = variantOverrides.sessions?.cookie;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ["GET", "POST"]
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Session middleware
app.use((0, express_session_1.default)({
    secret: "super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: sessionCookieOverride?.secure ?? false,
        httpOnly: sessionCookieOverride?.httpOnly ?? true,
        sameSite: sessionCookieOverride?.sameSite ?? "none"
    }
}));
app.get("/", (req, res) => {
    res.send("API running");
});
// Routes
app.use("/oauth", oauth_routes_1.default);
app.use("/sessions", sessions_routes_1.default);
app.use("/jwt", jwt_routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
