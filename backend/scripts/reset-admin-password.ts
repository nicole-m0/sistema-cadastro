/**
 * Comando administrativo explícito para redefinir a senha de um AdminUser.
 *
 * Uso:
 *   npm run admin:reset-password -- --email admin@asafe.org
 *
 * A nova senha é sempre digitada de forma interativa e mascarada (nunca via
 * argumento de linha de comando ou variável de ambiente), e nunca é impressa
 * no terminal, logada ou registrada no audit log.
 *
 * Este script grava diretamente no banco apontado por DATABASE_URL — confirme
 * qual ambiente está configurado antes de confirmar a operação.
 */
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const PASSWORD_HASH_ROUNDS = 12;

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const prefix = `--${name}`;
  const arg = process.argv.find((a) => a === prefix || a.startsWith(`${prefix}=`));
  if (!arg) return undefined;
  if (arg.includes('=')) return arg.split('=').slice(1).join('=');
  const index = process.argv.indexOf(arg);
  return process.argv[index + 1];
}

function promptVisible(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);

    let input = '';
    const isTTY = stdin.isTTY;
    if (isTTY) stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (chunk: string) => {
      const char = chunk.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '':
          if (isTTY) stdin.setRawMode?.(false);
          stdin.removeListener('data', onData);
          stdin.pause();
          process.stdout.write('\n');
          resolve(input);
          break;
        case '':
          process.stdout.write('\n');
          process.exit(1);
          break;
        case '':
        case '\b':
          input = input.slice(0, -1);
          break;
        default:
          input += char;
          break;
      }
    };

    stdin.on('data', onData);
  });
}

function validateComplexity(password: string): string | null {
  if (password.length < 8) return 'A nova senha deve ter ao menos 8 caracteres.';
  if (!/[a-z]/.test(password)) return 'A nova senha deve conter ao menos uma letra minúscula.';
  if (!/[A-Z]/.test(password)) return 'A nova senha deve conter ao menos uma letra maiúscula.';
  if (!/[0-9]/.test(password)) return 'A nova senha deve conter ao menos um número.';
  return null;
}

async function main() {
  const email = getArg('email');
  if (!email) {
    console.error('Uso: npm run admin:reset-password -- --email <email-do-admin>');
    process.exitCode = 1;
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    console.error(`Nenhum administrador encontrado com o e-mail informado.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Alvo: ${admin.name} <${admin.email}>`);
  console.log('Este comando grava diretamente no banco de dados configurado em DATABASE_URL.');

  const confirmation = await promptVisible('Digite CONFIRMAR para prosseguir: ');
  if (confirmation !== 'CONFIRMAR') {
    console.log('Operação cancelada.');
    return;
  }

  const newPassword = await promptHidden('Nova senha: ');
  const complexityError = validateComplexity(newPassword);
  if (complexityError) {
    console.error(complexityError);
    process.exitCode = 1;
    return;
  }

  const confirmPassword = await promptHidden('Confirme a nova senha: ');
  if (newPassword !== confirmPassword) {
    console.error('A confirmação não corresponde à nova senha.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'ADMIN_USER',
      entityId: admin.id,
      action: 'UPDATE',
      changes: { event: 'password_reset_via_cli' },
    },
  });

  console.log('Senha atualizada com sucesso. Sessões existentes desse administrador foram invalidadas.');
}

main()
  .catch((err) => {
    console.error('Erro ao redefinir a senha:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
