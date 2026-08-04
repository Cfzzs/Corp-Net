import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import {
  FileText,
  AlertTriangle,
  Award,
  Calendar,
  FileSpreadsheet,
  Link as LinkIcon,
  User,
  ShieldAlert,
  Clock,
  Terminal,
  Shield,
  Cpu
} from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Busca dados completos do usuário diretamente do banco
  // (ignora o JWT cacheado para evitar loops com dados desatualizados)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      recordsReceived: {
        include: {
          createdBy: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Redireciona para onboarding se o Nome IC não estiver configurado no banco
  // (usa dado do banco, não do JWT, para evitar loops com JWT cacheado)
  if (!user.icName) {
    redirect("/cadastro");
  }


  // Contabiliza as advertências (Leve e Grave)
  const warnings = user.recordsReceived.filter(
    (r) => r.type === "ADVERTENCIA_LEVE" || r.type === "ADVERTENCIA_GRAVE"
  );
  const warningCount = warnings.length;

  // Cálculo de dias restantes de teste
  let daysRemaining = 0;
  let probationProgress = 0;
  if (user.status === "EM_TESTE" && user.probationEnd) {
    const timeDiff = new Date(user.probationEnd).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    // Período de teste padrão de 15 dias, mas se houver duração personalizada salva, usamos ela
    const probationDuration = user.probationDuration || 15;
    probationProgress = Math.min(100, Math.max(0, ((probationDuration - daysRemaining) / probationDuration) * 100));
  }

  const getRecordTypeBadge = (type: string) => {
    switch (type) {
      case "ELOGIO":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "OBSERVACAO":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ADVERTENCIA_LEVE":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "ADVERTENCIA_GRAVE":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const translateRecordType = (type: string) => {
    switch (type) {
      case "ELOGIO": return "Elogio";
      case "OBSERVACAO": return "Observação Geral";
      case "ADVERTENCIA_LEVE": return "Advertência Leve";
      case "ADVERTENCIA_GRAVE": return "Advertência Grave";
      default: return type;
    }
  };

  return (
    <LayoutWrapper title="DASHBOARD // MEU PERFIL">
      <div className="space-y-6 max-w-6xl">
        
        {/* CRITICAL WARNING ALERT */}
        {warningCount >= 3 && (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 flex gap-4 text-red-500 shadow-tactical-glow-red animate-pulse">
            <ShieldAlert className="w-10 h-10 shrink-0" />
            <div>
              <h3 className="font-mono font-bold text-lg uppercase tracking-wider">RECOMENDAÇÃO DE REBAIXAMENTO OU DEMISSÃO</h3>
              <p className="text-sm font-sans mt-1 text-gray-300 leading-relaxed">
                Este membro atingiu o limite crítico de advertências acumuladas no sistema ({warningCount}/3). A recomendação padrão do Alto Comando é o rebaixamento de patente imediato ou desligamento dos serviços corporativos.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PROFILE CARD — layout diferenciado para DEV */}
          {user.role === "DEV" ? (
            <div className="tactical-card rounded-2xl p-6 flex flex-col justify-between border border-violet-500/20 shadow-[0_0_20px_rgba(167,139,250,0.08)]">
              {/* Topo com ícone DEV */}
              <div>
                <div className="flex items-center gap-3 border-b border-violet-500/10 pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-violet-400 uppercase tracking-widest">IDENTIFICAÇÃO OPERACIONAL</h4>
                    <h3 className="text-base font-bold text-white font-mono uppercase">{user.icName || "Não Configurado"}</h3>
                  </div>
                </div>

                <div className="space-y-0 text-xs font-mono">
                  {/* Cargo Policial */}
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-gray-500 flex items-center gap-1.5"><Shield className="w-3 h-3" /> CARGO POLICIAL</span>
                    <span className="text-primary font-bold">{user.rank || "—"}</span>
                  </div>

                  {/* Nome Discord */}
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-gray-500">DISCORD</span>
                    <span className="text-gray-300">@{user.name}</span>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-gray-500">STATUS</span>
                    <span className="text-emerald-500 font-bold">ATIVO</span>
                  </div>

                  {/* Registro */}
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">REGISTRO</span>
                    <span className="text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge DEV — seção separada no rodapé do card */}
              <div className="mt-5 pt-4 border-t border-violet-500/20">
                <p className="text-[9px] font-mono text-violet-400/60 uppercase tracking-widest mb-2">CATEGORIA DO SISTEMA</p>
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-xl px-3 py-2.5">
                  <Terminal className="w-4 h-4 text-violet-300 shrink-0" />
                  <div>
                    <p className="text-violet-200 font-mono font-bold text-xs uppercase tracking-widest">DESENVOLVEDOR</p>
                    <p className="text-violet-400/70 font-mono text-[10px] mt-0.5">Acesso irrestrito ao sistema • Imune a exclusão</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PROFILE CARD — layout padrão para não-DEV */
            <div className="tactical-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs text-gray-500 uppercase">IDENTIDADE OPERATIVA</h4>
                    <h3 className="text-base font-bold text-white font-mono uppercase">{user.icName || "Não Configurado"}</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500">NOME DISCORD</span>
                    <span className="text-gray-300">{user.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500">DISCORD ID</span>
                    <span className="text-gray-300">{user.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500">CARGO / PATENTE</span>
                    <span className="text-primary font-semibold">{user.rank || user.role}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500">STATUS SERVIÇO</span>
                    <span className={user.status === "ATIVO" ? "text-emerald-500" : "text-yellow-500"}>
                      {user.status === "EM_TESTE" ? "EM PERÍODO TESTE" : user.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">REGISTRO NO PORTAL</span>
                    <span className="text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WARNING COUNTER CARD */}
          <div className="tactical-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">ADVERTÊNCIAS</h3>
                </div>
                <span className={`font-mono font-bold text-sm border px-2 py-0.5 rounded ${
                  warningCount >= 3 ? "text-red-500 bg-red-500/10 border-red-500/20 shadow-tactical-glow-red" : "text-primary bg-primary/5 border-primary/20"
                }`}>
                  {warningCount}/3
                </span>
              </div>

              <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                Contador cumulativo de advertências aplicadas pelos supervisores da corporação. Ao atingir o limite máximo de 3 ocorrências, a ficha entra em status de alerta crítico.
              </p>
            </div>

            {/* Tactical Warnings Meter */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 h-3.5">
                <div className={`rounded-md border ${
                  warningCount >= 1
                    ? "bg-amber-500/30 border-amber-500/50 shadow-tactical-glow"
                    : "bg-white/5 border-white/10"
                }`}></div>
                <div className={`rounded-md border ${
                  warningCount >= 2
                    ? "bg-orange-500/30 border-orange-500/50 shadow-tactical-glow"
                    : "bg-white/5 border-white/10"
                }`}></div>
                <div className={`rounded-md border ${
                  warningCount >= 3
                    ? "bg-red-500/40 border-red-500/60 shadow-tactical-glow-red animate-pulse"
                    : "bg-white/5 border-white/10"
                }`}></div>
              </div>
              <div className="flex justify-between font-mono text-[9px] text-gray-500 uppercase">
                <span>Leve</span>
                <span>Moderada</span>
                <span>Crítica</span>
              </div>
            </div>
          </div>

          {/* PROBATION CARD */}
          <div className="tactical-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">PERÍODO DE TESTE</h3>
                </div>
                <span className="font-mono font-bold text-xs text-primary">
                  {user.status === "EM_TESTE" ? `${daysRemaining} dias restantes` : "CONCLUÍDO"}
                </span>
              </div>

              {user.status === "EM_TESTE" ? (
                <>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                    Acompanhamento do período probatório do recruta. O período total regulamentar é de {user.probationDuration || 15} dias.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-white/5 rounded-full h-2 border border-white/10 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 shadow-tactical-glow"
                        style={{ width: `${probationProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-gray-500 uppercase">
                      <span>Dia 1</span>
                      <span>Dia {user.probationDuration || 15}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <Award className="w-10 h-10 text-emerald-500 mb-2 shadow-tactical-glow-green" />
                  <span className="text-emerald-500 font-mono text-xs uppercase tracking-wider font-bold">PERÍODO EFETIVADO</span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">MEMBRO ATIVO INTEGRANTE DA CORPORAÇÃO</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FEED / HISTÓRICO DE OCORRÊNCIAS */}
        <div className="tactical-card rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <h3 className="font-mono text-sm font-bold text-white uppercase">HISTÓRICO DE AVALIAÇÕES</h3>
            </div>
            <span className="font-mono text-xs text-gray-500">{user.recordsReceived.length} registros</span>
          </div>

          {user.recordsReceived.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-white/5 rounded-xl bg-black/5 font-mono text-xs">
              <FileText className="w-8 h-8 text-gray-600 mb-2" />
              <span>NENHUM REGISTRO OU PUNIÇÃO VINCULADOS A ESTA FICHA.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {user.recordsReceived.map((record) => (
                <div
                  key={record.id}
                  className="bg-tactical-dark border border-white/5 hover:border-white/10 rounded-xl p-4 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${getRecordTypeBadge(record.type)}`}>
                        {translateRecordType(record.type)}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(record.date).toLocaleDateString("pt-BR")} às {new Date(record.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-sans leading-relaxed">{record.description}</p>
                    <div className="text-[10px] text-gray-500 font-mono">
                      APLICADO POR: <span className="text-gray-400 font-semibold uppercase">{record.createdBy.icName || record.createdBy.name}</span>
                    </div>
                  </div>

                  {record.proofUrl && (
                    <a
                      href={record.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] px-3 py-1.5 rounded-lg border border-white/10 transition group"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
                      <span>Ver Prova</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
