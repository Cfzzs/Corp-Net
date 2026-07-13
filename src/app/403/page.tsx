"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Terminal } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(239,68,68,0.01)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 text-center">
        <div className="tactical-card-red rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-danger/50 to-transparent"></div>

          <div className="w-16 h-16 rounded-full border border-danger/30 bg-danger/10 flex items-center justify-center mx-auto mb-6 shadow-tactical-glow-red animate-pulse">
            <ShieldAlert className="w-8 h-8 text-danger" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider font-mono">
            ACESSO NÃO AUTORIZADO
          </h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest font-mono mb-6 border-b border-white/5 pb-3">
            CÓDIGO DE ERRO // 403 FORBIDDEN
          </p>

          <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-xs text-danger font-mono text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 border-b border-danger/15 pb-1 font-bold">
              <Terminal className="w-3.5 h-3.5" /> SECURE GATEWAY AUDIT
            </div>
            <p>DETALHES DA OCORRÊNCIA:</p>
            <p className="pl-3 border-l border-danger/35 text-[11px] text-gray-300">
              O seu cargo não possui as permissões necessárias para acessar este diretório restrito. A tentativa foi logada.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 uppercase text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar ao Painel Operacional</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
