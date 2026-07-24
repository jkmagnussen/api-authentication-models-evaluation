"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditEvent = writeAuditEvent;
const db_1 = require("../db");
const logger_1 = require("../logger");
async function writeAuditEvent(event) {
    try {
        await db_1.prisma.auditLog.create({
            data: {
                userId: event.userId ?? null,
                eventType: event.eventType,
                outcome: event.outcome,
                ipAddress: event.ipAddress ?? null,
                userAgent: event.userAgent ?? null,
                metadata: event.metadata,
            },
        });
    }
    catch (error) {
        (0, logger_1.log)('error', 'audit.write.failed', {
            eventType: event.eventType,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
