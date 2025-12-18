Projeto POS (Next.js + Prisma + NextAuth) para gestão de pedidos e caixa.

## Stack
- Next.js 15 (App Router) + React 19
- Prisma (PostgreSQL)
- NextAuth (Credentials + JWT)
- Tailwind CSS v4
- Zustand

## Pré‑requisitos
- Node.js 20+
- Banco PostgreSQL e a variável `DATABASE_URL` configurada no `.env`

## Configuração
1. Instale as dependências:
   - `npm install`
2. Configure as variáveis de ambiente em `.env` (ex.: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
3. Gere o cliente Prisma e aplique o schema (em dev, só `generate`; em prod o build já roda `migrate deploy`):
   - `npx prisma generate`
4. (Opcional) Popule um usuário admin padrão:
   - `npm run seed`

## Executar em desenvolvimento
```
npm run dev
```
Acesse `http://localhost:3000`.

## Scripts úteis
- `npm run dev`: inicia o servidor de desenvolvimento
- `npm run build`: aplica migrações (`prisma migrate deploy`) e compila o app
- `npm start`: inicia o build em produção
- `npm run seed`: cria/atualiza o usuário `admin` com senha padrão (ajuste em `prisma/seed.ts`)

## Estrutura principal
- `src/app` — páginas do POS e área admin (`/admin`)
- `src/app/api` — rotas da API (produtos, pedidos, pagamentos, caixa)
- `src/components` — componentes do POS e formulários
- `prisma/schema.prisma` — schema do banco

## Notas
- O login usa usuário/senha (Credentials). O adapter Prisma do NextAuth não é utilizado; os usuários vivem no modelo `User` do Prisma.
- O fechamento de caixa soma os pagamentos do caixa e atualiza `finalCash`.
