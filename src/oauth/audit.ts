import { prisma } from "../db";

type AuditEvent = {
  event: string;
  userId?: string | null;
  clientId?: string | null;
  ip?: string | null;
  success: boolean;
  errorCode?: string | null;
  details?: string | null;
};

export async function writeAuditLog(data: AuditEvent) {
  try {
    await prisma.auditLog.create({
      data: {
        event: data.event,
        userId: data.userId ?? null,
        clientId: data.clientId ?? null,
        ip: data.ip ?? null,
        success: data.success,
        errorCode: data.errorCode ?? null,
        details: data.details ?? null,
      },
    });
  } catch {
    // Logging must never break OAuth flows
  }
}
