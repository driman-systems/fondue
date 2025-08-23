// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role;

    // Redireciona da página de login se já estiver autenticado
    if (pathname === '/login') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      } else if (role === 'user') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Exemplo: bloqueio por role em rotas admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // (opcional) bloqueio de outras rotas específicas por role aqui
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
