import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { log } from "../logger";

type AuditEventInput = {
  userId?: string | null;
  eventType: string;
  outcome: "success" | "failure";
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(event: AuditEventInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: event.userId ?? null,
        eventType: event.eventType,
        outcome: event.outcome,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        metadata: event.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    log("error", "audit.write.failed", {
      eventType: event.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}