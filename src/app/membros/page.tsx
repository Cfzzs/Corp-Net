import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Search, UserCheck, AlertTriangle, Eye, ShieldAlert, Award, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
  };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Verificação de cargos (MEMBRO não acessa membros)
  if (session.user.role === "MEMBRO") {
    redirect("/403");
  }

  const query = searchParams?.q || "";

  // Busca todos os membros baseado na busca
  const members = await prisma.user.findMany({
    where: {
      OR: [
        { icName: { contains: query } },
        { name: { contains: query } },
        { id: { contains: query } },
      ],
    },
    include: {
      recordsReceived: true,
    },
    orderBy: {
      icName: "asc",
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "LIDER": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ATIVO": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "EM_TESTE": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "DEMITIDO": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <LayoutWrapper title="GESTÃO // BUSCA DE FICHA DE MEMBROS">
      <div className="space-y-6 max-w-6xl">
        {/* TOP BAR / SEARCH */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <form method="GET" action="/membros" className="relative flex-1 max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por Nome IC, Discord Username ou ID..."
              className="w-full bg-tactical-dark border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition font-mono"
            />
            <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <button type="submit" className="hidden">Buscar</button>
          </form>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>EXIBINDO {members.length} REGISTROS ATIVOS</span>
          </div>
        </div>

        {/* MEMBERS TABLE CARD */}
        <div className="tactical-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/10 font-mono text-xs text-gray-500 uppercase">
                  <th className="py-4 px-6">Nome IC / Discord</th>
                  <th className="py-4 px-6">Discord ID</th>
                  <th className="py-4 px-6">Patente / Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Advertências</th>
                  <th className="py-4 px-6 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans text-sm">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500 font-mono text-xs">
                      NENHUM MEMBRO LOCALIZADO COM OS PARÂMETROS INFORMADOS.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const warnings = member.recordsReceived.filter(
                      (r) => r.type === "ADVERTENCIA_LEVE" || r.type === "ADVERTENCIA_GRAVE"
                    ).length;

                    return (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                              {member.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-sm font-bold text-white uppercase block">
                                {member.icName || "Não Cadastrado"}
                              </span>
                              <span className="text-xs text-gray-500 font-mono block">
                                @{member.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-gray-400">
                          {member.id}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${getStatusBadgeColor(member.status)}`}>
                            {member.status === "EM_TESTE" ? "EM TESTE" : member.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {warnings >= 3 ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-500 font-mono animate-pulse bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded shadow-tactical-glow-red">
                                <ShieldAlert className="w-3.5 h-3.5" /> CRÍTICO ({warnings}/3)
                              </span>
                            ) : (
                              <span className={`font-mono text-xs border px-2 py-0.5 rounded font-bold ${
                                warnings > 0 ? "text-amber-500 bg-amber-500/5 border-amber-500/20" : "text-gray-500 border-white/5"
                              }`}>
                                {warnings}/3
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/membros/${member.id}`}
                            className="inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/40 font-mono text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Abrir Ficha</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
