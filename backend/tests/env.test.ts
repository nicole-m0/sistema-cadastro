import { describe, it, expect, afterEach, vi } from 'vitest';

// dotenv/config teria efeito colateral de recarregar backend/.env (que define NODE_ENV
// localmente) a cada reimport do módulo — isso mascararia justamente os cenários de "variável
// ausente" que este arquivo testa. Neutralizamos esse side effect só aqui.
vi.mock('dotenv/config', () => ({}));

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

describe('validação de variáveis de ambiente (config/env.ts)', () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  it('recusa iniciar se NODE_ENV não estiver definido', async () => {
    vi.resetModules();
    delete process.env.NODE_ENV;

    await expect(import('../src/config/env')).rejects.toThrow(
      /Configuração de ambiente inválida/,
    );
  });

  it('recusa iniciar se NODE_ENV tiver um valor fora de development|production|test', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'staging';

    await expect(import('../src/config/env')).rejects.toThrow();
  });

  it('recusa iniciar se JWT_SECRET tiver menos de 32 caracteres', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'segredo-curto-demais';

    await expect(import('../src/config/env')).rejects.toThrow();
  });

  it('inicia normalmente com NODE_ENV e JWT_SECRET válidos', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'a'.repeat(32);

    const mod = await import('../src/config/env');
    expect(mod.env.NODE_ENV).toBe('test');
    expect(mod.isProduction).toBe(false);
  });
});
