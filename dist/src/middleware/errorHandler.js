"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../logger");
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    if (status >= 500) {
        (0, logger_1.log)("error", "Unhandled request error", {
            method: req.method,
            path: req.originalUrl,
            status,
            error: message,
        });
    }
    res.status(status).json({ error: message });
}
