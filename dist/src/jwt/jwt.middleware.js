"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
const jwt_service_1 = require("./jwt.service");
function jwtAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = header.split(" ")[1];
    try {
        const decoded = (0, jwt_service_1.verifyJwt)(token);
        if (!decoded?.userId || typeof decoded.userId !== "string") {
            return res.status(401).json({ message: "Invalid token" });
        }
        const expectedAudience = process.env.JWT_AUDIENCE || "api-auth-eval";
        const expectedIssuer = process.env.JWT_ISSUER || "api-auth-service";
        if (decoded.aud && decoded.aud !== expectedAudience) {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (decoded.iss && decoded.iss !== expectedIssuer) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.userId = decoded.userId;
        return next();
    }
    catch (err) {
        if (err?.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}
