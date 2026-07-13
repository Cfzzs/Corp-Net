"use client";

import React, { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Clock,
  Skull,
  LogOut,
  User,
  Terminal,
  ShieldCheck
} from "lucide-react";

export function LayoutWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  const { data: session, update } = useSession();
  const pathname = usePathname();

  // Força refresh do JWT ao montar o layout para sempre ter dados frescos do banco
  // Resolve o problema de role/icName desatualizados no JWT cacheado
  useEffect(() => {
    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userRole = session?.user?.role || "MEMBRO";
  const isLeaderOrAdmin = userRole === "LIDER" || userRole === "ADMIN" || userRole === "DEV";
  const isDev = userRole === "DEV";

  const navigation = [
    { name: "Meu Perfil", href: "/dashboard", icon: LayoutDashboard, roles: ["MEMBRO", "LIDER", "ADMIN", "DEV"] },
    { name: "Membros", href: "/membros", icon: Users, roles: ["LIDER", "ADMIN", "DEV"] },
    { name: "Em Teste", href: "/testes", icon: Clock, roles: ["LIDER", "ADMIN", "DEV"] },
    { name: "Lista Negra", href: "/blacklist", icon: Skull, roles: ["MEMBRO", "LIDER", "ADMIN", "DEV"] },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "DEV":
        return "bg-violet-500/20 text-violet-300 border-violet-500/40";
      case "ADMIN":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "LIDER":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "EM_TESTE":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "DEMITIDO":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-tactical-dark flex flex-col shrink-0">
        {/* LOGO */}
        <div className="h-16 border-b border-white/5 flex items-center px-6 gap-3">
          <Shield className="w-5 h-5 text-primary shadow-tactical-glow" />
          <span className="font-mono font-bold tracking-widest text-white text-sm">
            CORP<span className="text-primary">//</span>NET
          </span>
        </div>

        {/* PROFILE OVERVIEW */}
        <div className="p-6 border-b border-white/5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-3 relative overflow-hidden group">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
            )}
            <div className="absolute inset-0 border border-primary/20 rounded-full pointer-events-none"></div>
          </div>

          <h3 className="text-sm font-semibold text-white tracking-wide truncate max-w-full font-mono uppercase">
            {session?.user?.icName || session?.user?.name || "AGENTE MOCK"}
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-full">
            {session?.user?.email || "agente@mock.com"}
          </p>

          <div className="flex gap-1.5 mt-3 justify-center flex-wrap">
            {isDev ? (
              <span className="flex items-center gap-1 text-[9px] font-mono border px-2 py-0.5 rounded uppercase font-bold bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_8px_rgba(167,139,250,0.3)]">
                <Terminal className="w-2.5 h-2.5" /> DEV
              </span>
            ) : (
              <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase font-semibold ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            )}
            <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase font-semibold ${getStatusBadgeColor(session?.user?.status || "ATIVO")}`}>
              {session?.user?.status === "EM_TESTE" ? "EM TESTE" : session?.user?.status || "ATIVO"}
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest px-2 mb-3">
            Operações do sistema
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            if (!item.roles.includes(userRole)) return null;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs transition duration-150 border ${
                  isActive
                    ? "bg-primary/5 text-primary border-primary/20 shadow-tactical-glow"
                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono text-xs text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span className="hidden sm:inline-block border-r border-white/10 pr-4">SYS_STATUS: OPERACIONAL</span>
            <span className="flex items-center gap-1.5 text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE CON
            </span>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
