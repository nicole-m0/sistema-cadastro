import { AuditAction, AuditEntity, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function recordAuditLog(params: {
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;
  userId?: string;
  changes?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      changes: params.changes,
    },
  });
}
