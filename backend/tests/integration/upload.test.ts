import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  teacher: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  instrument: { findMany: vi.fn(), upsert: vi.fn() },
  auditLog: { create: vi.fn() },
}));
vi.mock('../../src/config/prisma', () => ({ prisma: prismaMock }));

const { uploadStreamMock, destroyMock } = vi.hoisted(() => ({
  uploadStreamMock: vi.fn(),
  destroyMock: vi.fn(),
}));

vi.mock('../../src/config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: uploadStreamMock,
      destroy: destroyMock,
    },
  },
}));

import { createApp } from '../../src/app';

const app = createApp();

function authCookie() {
  const token = jwt.sign(
    { sub: 'admin-1', email: 'admin@asafe.org', name: 'Admin' },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );
  return `${process.env.AUTH_COOKIE_NAME}=${token}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.adminUser.findUnique.mockResolvedValue({ updatedAt: new Date('2020-01-01T00:00:00.000Z') });
});

describe('POST /api/upload/:folder', () => {
  it('envia imagem válida e retorna url + publicId (mock Cloudinary)', async () => {
    uploadStreamMock.mockImplementation((_options, callback) => {
      callback(null, {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/asafe/students/foo.jpg',
        public_id: 'asafe/students/foo',
      });
      return { end: vi.fn() };
    });

    const res = await request(app)
      .post('/api/upload/students')
      .set('Cookie', authCookie())
      .attach('photo', Buffer.from('fake-image-content'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.publicId).toBe('asafe/students/foo');
    expect(res.body.data.url).toContain('cloudinary.com');
  });

  it('rejeita arquivo com tipo MIME não permitido', async () => {
    const res = await request(app)
      .post('/api/upload/students')
      .set('Cookie', authCookie())
      .attach('photo', Buffer.from('conteudo'), {
        filename: 'arquivo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
  });

  it('rejeita categoria de upload inválida', async () => {
    const res = await request(app)
      .post('/api/upload/invalido')
      .set('Cookie', authCookie())
      .attach('photo', Buffer.from('fake-image-content'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/api/upload/students')
      .attach('photo', Buffer.from('fake-image-content'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/upload', () => {
  it('remove imagem existente no Cloudinary', async () => {
    destroyMock.mockResolvedValue({ result: 'ok' });

    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'asafe/students/foo' });

    expect(res.status).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith('asafe/students/foo');
  });

  it('rejeita publicId fora do namespace desta aplicação (BOLA)', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'outra-conta/outra-pasta/foo' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('rejeita publicId dentro da pasta da aplicação mas fora das subpastas permitidas', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'asafe/outra-coisa/foo' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('rejeita publicId com segmento de path traversal ("..") mesmo com prefixo válido', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'asafe/students/../../../secret' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('rejeita publicId sem identificador de arquivo (só pasta)', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'asafe/students' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });
});

describe('Proteção CSRF (verificação de Origin)', () => {
  it('permite upload quando a Origin está na allowlist de CORS_ORIGIN', async () => {
    uploadStreamMock.mockImplementation((_options, callback) => {
      callback(null, {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/asafe/students/foo.jpg',
        public_id: 'asafe/students/foo',
      });
      return { end: vi.fn() };
    });

    const res = await request(app)
      .post('/api/upload/students')
      .set('Cookie', authCookie())
      .set('Origin', process.env.CORS_ORIGIN as string)
      .attach('photo', Buffer.from('fake-image-content'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
  });

  it('bloqueia upload vindo de uma Origin fora da allowlist', async () => {
    const res = await request(app)
      .post('/api/upload/students')
      .set('Cookie', authCookie())
      .set('Origin', 'https://site-malicioso.example')
      .attach('photo', Buffer.from('fake-image-content'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(403);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('bloqueia remoção de imagem vinda de uma Origin fora da allowlist', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .set('Origin', 'https://site-malicioso.example')
      .send({ publicId: 'asafe/students/foo' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('bloqueia quando o header Origin vem presente mas vazio', async () => {
    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .set('Origin', '')
      .send({ publicId: 'asafe/students/foo' });

    expect(res.status).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('permite quando não há Origin nem Referer (cliente não-browser, ex.: chamadas internas/testes)', async () => {
    destroyMock.mockResolvedValue({ result: 'ok' });

    const res = await request(app)
      .delete('/api/upload')
      .set('Cookie', authCookie())
      .send({ publicId: 'asafe/students/foo' });

    expect(res.status).toBe(200);
  });
});
