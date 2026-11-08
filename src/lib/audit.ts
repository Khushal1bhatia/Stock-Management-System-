import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  actorId?: string | null;
  actorName: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
};

type AuditClient = Pick<Prisma.TransactionClient, "auditLog">;

export async function writeAudit(input: AuditInput, client: AuditClient = prisma) {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorName: input.actorName.slice(0, 80),
      action: input.action.slice(0, 60),
      entityType: input.entityType?.slice(0, 40) ?? null,
      entityId: input.entityId?.slice(0, 40) ?? null,
      detail: input.detail?.slice(0, 500) ?? null,
      ipAddress: input.ipAddress?.slice(0, 64) ?? null
    }
  });
}
