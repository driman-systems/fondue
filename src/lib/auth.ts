/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // ✅ devolva apenas o necessário, mapeando username -> name
        return { id: user.id, name: user.username, role: user.role } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // ✅ garanta id/role/name dentro do token
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.name = (user as any).name; // <- vem do username mapeado acima
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // ✅ injete id/role/name na sessão
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        if (token.name) session.user.name = String(token.name);
        // fallback opcional:
        if (!session.user.name && session.user.email)
          session.user.name = session.user.email.split('@')[0];
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};
