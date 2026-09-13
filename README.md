# Associação Asafe — Sistema de Cadastro

Sistema web administrativo para a **Associação Amor e Fé (Asafe)**, uma escola de música. Permite gerenciar o cadastro de **alunos** e **professores** com autenticação, dashboard, upload de fotos e busca/filtros.

A identidade visual (cores, tipografia) foi derivada da logo da Asafe: dourado (lua), vermelho/preto (o "A"), verde (folha) e roxo (coração), sobre fundo claro.

## Arquitetura

Monorepo com duas aplicações independentes, cada uma com deploy próprio:

```
sistema-cadastro/
├── backend/     API REST (Node.js + TypeScript + Express + Prisma + PostgreSQL)
└── frontend/    Painel administrativo (React + TypeScript + Vite + Tailwind CSS)
```

| Camada          | Tecnologia                                                   |
| --------------- | ------------------------------------------------------------- |
| Frontend        | React 18 + TypeScript + Vite + Tailwind CSS + React Router     |
| Formulários     | react-hook-form + Zod                                          |
| Ícones          | lucide-react                                                    |
| Backend         | Node.js + TypeScript + Express                                 |
| Banco de dados  | PostgreSQL (Railway) + Prisma ORM                               |
| Autenticação    | JWT em cookie httpOnly + bcrypt (hash de senha)                 |
| Upload de fotos | Cloudinary (upload mediado pelo backend, secret nunca exposto) |
| Validação       | Zod (frontend e backend)                                       |
| Testes          | Vitest + Supertest (backend), Vitest + Testing Library (frontend) |

Por que essa arquitetura: o backend e o frontend são publicados em serviços diferentes (Railway e Vercel/Netlify, respectivamente), então optamos por dois projetos Node independentes em vez de um monorepo com pacote compartilhado — isso evita complicar o build de cada plataforma. Os schemas de validação Zod são pequenos e ficam duplicados (documentados) em cada lado.

## Estrutura do backend

```
backend/
├── prisma/
│   ├── schema.prisma        # Modelos: AdminUser, Teacher, Student, Instrument, AuditLog
│   ├── migrations/          # Migration inicial (SQL) já gerada
│   └── seed.ts              # Cria admin inicial + instrumentos + exemplos
├── src/
│   ├── config/               # env, prisma client, cloudinary
│   ├── middlewares/          # auth (JWT), validate (Zod), upload (multer), errorHandler
│   ├── modules/
│   │   ├── auth/              # login, logout, me
│   │   ├── students/          # CRUD de alunos
│   │   ├── teachers/          # CRUD de professores
│   │   ├── instruments/       # lista de instrumentos/cursos
│   │   ├── upload/            # upload/remoção de imagens (Cloudinary)
│   │   └── dashboard/         # totais e cadastros recentes
│   ├── routes/index.ts       # agrega as rotas com documentação básica
│   ├── utils/                 # ApiError, asyncHandler, pagination, auditLog
│   ├── app.ts / server.ts
└── tests/                    # Vitest + Supertest (mocks de Prisma e Cloudinary)
```

## Estrutura do frontend

```
frontend/src/
├── assets/logo-asafe.png     # logo oficial usada no login e na sidebar
├── components/
│   ├── layout/                 # Sidebar, Header, AdminLayout
│   └── ui/                     # Button, Field, Modal, ConfirmDialog, Pagination, PhotoUpload...
├── context/                   # AuthContext (sessão) e ToastContext (feedback)
├── hooks/                     # useDebounce, useInstruments, useTeacherOptions
├── lib/api.ts                 # cliente fetch tipado (cookies httpOnly, credentials: include)
├── pages/
│   ├── Login.tsx / Dashboard.tsx
│   ├── students/               # Lista, Formulário, Detalhe
│   └── teachers/                # Lista, Formulário, Detalhe
├── services/                  # 1 arquivo por domínio (auth, students, teachers, upload...)
└── types/                     # tipos compartilhados entre páginas e services
```

## Pré-requisitos

- Node.js 20+
- Uma instância PostgreSQL (recomendado: [Railway](https://railway.app))
- Uma conta [Cloudinary](https://cloudinary.com) (plano gratuito é suficiente)

> **Nota sobre este ambiente de desenvolvimento:** o sistema foi implementado e testado (typecheck, lint, testes automatizados e build) sem acesso a um Postgres ou Cloudinary reais neste ambiente. Os testes automatizados do backend mockam o Prisma Client e o SDK do Cloudinary — isso valida a lógica da aplicação, mas **não substitui** rodar `prisma migrate deploy` e o seed contra um banco real antes do primeiro uso em produção.

## Configuração — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite `backend/.env` e preencha:

- `DATABASE_URL`: string de conexão do Postgres (Railway fornece automaticamente ao criar um serviço Postgres no seu projeto)
- `JWT_SECRET`: gere com `openssl rand -base64 48`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`: credenciais do administrador criado pelo seed
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: painel do Cloudinary → Dashboard
- `CORS_ORIGIN`: URL do frontend (ex: `http://localhost:5173` em dev)

Rodando as migrations e o seed:

```bash
npm run migrate:dev     # cria as tabelas no banco (ambiente local/dev)
npm run seed             # cria o administrador inicial + dados de exemplo
```

Em produção (Railway), use `npm run migrate:deploy` (já configurado no `railway.toml` para rodar automaticamente antes do start).

Subindo a API localmente:

```bash
npm run dev              # http://localhost:4000
```

### Criando o primeiro administrador

O script de seed (`npm run seed`) cria (ou atualiza) um administrador usando `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`, com a senha já em hash (bcrypt). Rode-o sempre que quiser (re)definir a senha do admin inicial.

### Typecheck, lint, testes e build (backend)

```bash
npm run typecheck
npm run lint
npm test
npm run build              # gera backend/dist/server.js
```

## Configuração — Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edite `frontend/.env`:

- `VITE_API_URL`: URL da API (ex: `http://localhost:4000/api` em dev, ou a URL pública do backend no Railway em produção)

Subindo o frontend localmente:

```bash
npm run dev               # http://localhost:5173
```

### Typecheck, lint, testes e build (frontend)

```bash
npm run typecheck
npm run lint
npm test
npm run build              # gera frontend/dist
```

## Testando com um PostgreSQL real (obrigatório antes de usar em produção)

Este ambiente de desenvolvimento **não tem PostgreSQL nem Docker instalados**, então o seed e as migrations não puderam ser executados contra um banco real durante a auditoria. Escolha uma das opções abaixo:

### Opção A — Docker local (mais rápido para testar)

```bash
docker run --name asafe-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=asafe_dev -p 5432:5432 -d postgres:16
```

Em `backend/.env`, defina:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asafe_dev"
```

Depois:

```bash
cd backend
npm run migrate:dev   # aplica a migration inicial (cria todas as tabelas)
npm run seed           # cria o admin + dados de exemplo
npm run dev
```

### Opção B — PostgreSQL instalado nativamente no Windows

Instale o PostgreSQL (https://www.postgresql.org/download/windows/), crie um banco `asafe_dev` e ajuste `DATABASE_URL` em `backend/.env` com o usuário/senha definidos na instalação. Depois rode os mesmos três comandos acima (`migrate:dev`, `seed`, `dev`).

### Opção C — Railway (ambiente de produção/homologação)

1. No painel do Railway, adicione um serviço **PostgreSQL** ao projeto.
2. Copie a variável `DATABASE_URL` gerada automaticamente pelo Railway.
3. Localmente, exporte essa URL temporariamente e rode:
   ```bash
   cd backend
   DATABASE_URL="<url-do-railway>" npm run migrate:deploy
   DATABASE_URL="<url-do-railway>" npm run seed
   ```
   (ou configure `DATABASE_URL` no `.env` local apontando para o Railway).
4. Em produção, o próprio `railway.toml` já roda `prisma migrate deploy` automaticamente antes do `start` — rode o `seed` manualmente apenas uma vez (aba **Shell** do serviço no Railway, ou localmente como acima).

Depois de rodar a migration + seed contra um Postgres real, confirme o login com as credenciais do seed (veja a seção seguinte) e teste a criação de um aluno/professor pela interface.

## Configurando o Cloudinary

1. Crie uma conta gratuita em https://cloudinary.com.
2. No Dashboard, copie **Cloud Name**, **API Key** e **API Secret**.
3. Cole esses valores em `backend/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
4. Não é necessário criar upload presets: o backend usa `cloudinary.uploader.upload_stream` autenticado com a API Secret, que **nunca** é exposta ao navegador. O frontend só envia o arquivo (multipart/form-data) para o backend; o backend fala com o Cloudinary.
5. Uploads ficam organizados em `asafe/students/...` e `asafe/teachers/...` (pasta configurável via `CLOUDINARY_FOLDER`).

## Deploy

### Backend (Railway)

1. Crie um novo projeto no Railway e adicione um serviço PostgreSQL (Railway gera `DATABASE_URL` automaticamente — copie-a).
2. Adicione um serviço a partir do repositório, com **Root Directory = `backend`**.
3. Configure as variáveis de ambiente do serviço (as mesmas do `.env.example`, incluindo `DATABASE_URL`, `JWT_SECRET`, credenciais do Cloudinary, `CORS_ORIGIN` apontando para a URL do frontend em produção).
4. O `railway.toml` já define:
   - Build: `npm ci && npm run build`
   - Start: roda `prisma migrate deploy` e então `npm run start`
   - Health check: `GET /health`
5. Após o primeiro deploy, rode o seed uma vez (Railway → aba "Shell" do serviço, ou localmente com `DATABASE_URL` de produção): `npm run seed`.

### Frontend (Vercel, Netlify ou Railway)

- **Root Directory**: `frontend`
- **Build command**: `npm run build`
- **Output/Publish directory**: `dist`
- Variável de ambiente: `VITE_API_URL` apontando para a URL pública da API no Railway (ex: `https://asafe-api.up.railway.app/api`)
- Arquivos `vercel.json` e `netlify.toml` já incluídos para o rewrite de SPA (todas as rotas → `index.html`).

Lembre-se de atualizar `CORS_ORIGIN` no backend com a URL final do frontend publicado.

## Segurança implementada

- Senhas de administrador com hash bcrypt (nunca em texto puro).
- Sessão via JWT em cookie **httpOnly** (`secure` + `sameSite=none` em produção), nunca em `localStorage`.
- Segredos apenas em variáveis de ambiente (`.env`, nunca commitado — veja `.gitignore`).
- Upload de imagem restrito a JPG/JPEG/PNG/WebP e até 5MB (`multer` + validação de MIME type), mediado pelo backend.
- CORS restrito à(s) origem(ns) configurada(s) em `CORS_ORIGIN`.
- Validação de entrada com Zod em todas as rotas de escrita, tanto no frontend quanto no backend.
- Rotas administrativas protegidas por middleware de autenticação (`requireAuth`); erros de autenticação/autorização retornam mensagens claras sem vazar detalhes internos.
- Exclusão de alunos/professores é **soft delete** (campo `deletedAt`), preservando histórico e auditoria (`AuditLog` registra criações, edições e exclusões).

## Limitações conhecidas deste ambiente de build

Este ambiente de desenvolvimento não tem PostgreSQL, Docker nem credenciais reais do Cloudinary instalados/configurados. O que foi validado de fato (comandos executados, não apenas descrito):

- `tsc` (typecheck) e `eslint` sem erros em backend e frontend;
- build de produção (`npm run build`) gerando `backend/dist/server.js` e `frontend/dist/index.html` corretamente;
- suíte de testes automatizados passando: **26 testes no backend** (Vitest + Supertest, mockando Prisma Client e o SDK do Cloudinary) e **5 testes no frontend** (Vitest + Testing Library);
- os servidores de desenvolvimento (`npm run dev`) sobem normalmente em ambos — o backend responde `200 OK` em `/health`, e uma chamada real a `/api/auth/login` chega até o Prisma e falha apenas com "Can't reach database server", confirmando que a cadeia rota → controller → service → Prisma está corretamente ligada a um Postgres real (não há dados simulados na aplicação final).

O que **não pôde** ser validado neste ambiente, por falta de infraestrutura, e precisa ser feito por você:

- Rodar `npm run migrate:dev` (ou `migrate:deploy`) e `npm run seed` contra um PostgreSQL real — siga a seção "Testando com um PostgreSQL real" acima.
- Testar um upload de imagem de verdade contra uma conta Cloudinary (as credenciais em `backend/.env.example` estão vazias por padrão).

## Licença

Projeto interno da Associação Asafe.
