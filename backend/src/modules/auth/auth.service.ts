import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { recordAuditLog } from '../../utils/auditLog';
import { ChangePasswordInput, LoginInput } from './auth.schema';

const PASSWORD_HASH_ROUNDS = 12;

export async function authenticateAdmin({ email, password }: LoginInput) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    throw ApiError.unauthorized('E-mail ou senha inválidos.');
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('E-mail ou senha inválidos.');
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, name: admin.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email },
  };
}

export async function getAdminById(id: string) {
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) {
    throw ApiError.unauthorized('Usuário não encontrado.');
  }
  return { id: admin.id, name: admin.name, email: admin.email };
}

export async function changeAdminPassword(adminId: string, input: ChangePasswordInput) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw ApiError.unauthorized('Usuário não encontrado.');
  }

  const currentMatches = await bcrypt.compare(input.currentPassword, admin.passwordHash);
  if (!currentMatches) {
    throw ApiError.badRequest('Senha atual incorreta.');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_HASH_ROUNDS);

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { passwordHash },
  });

  await recordAuditLog({
    entityType: 'ADMIN_USER',
    entityId: adminId,
    action: 'UPDATE',
    userId: adminId,
    changes: { event: 'password_changed' },
  });
}
