import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role;

    // DEV tem acesso irrestrito a tudo — bypass total
    if (userRole === "DEV") {
      return NextResponse.next();
    }

    // Proteção de rotas baseada em Roles (Permissões)
    // Rotas exclusivas de Líderes/Supervisores e Admins
    const isLeaderRoute = path.startsWith("/membros") || path.startsWith("/testes");
    if (isLeaderRoute && userRole === "MEMBRO") {
      return NextResponse.rewrite(new URL("/403", req.url));
    }

    // Rotas exclusivas de Admins
    const isAdminRoute = path.startsWith("/admin");
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.rewrite(new URL("/403", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Só executa o middleware se o usuário estiver logado
    },
  }
);

// Rotas que serão protegidas por este Middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/membros/:path*",
    "/testes/:path*",
    "/blacklist/:path*",
    "/cadastro",
    "/admin/:path*",
    "/apreensoes",
  ],
};
