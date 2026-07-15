import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Activity, ShieldAlert, UserCog, UserX, Skull, Search, Trash2 } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function LogsPage({
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

  const currentUserRole = session.user.role;
  const isAuthorized = currentUserRole === "LIDER" || currentUserRole === "ADMIN" || currentUserRole === "DEV";

  if (!isAuthorized) {
    redirect("/dashboard");
  }

  const query = searchParams?.q || "";

  // Busca os logs mais recentes
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { details: { contains: query } },
        { executor: { icName: { contains: query } } },
        { executor: { name: { contains: query } } },
      ],
    },
    include: {
      executor: true,
      target: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limita aos últimos 100 logs
  });

  // SERVER ACTION: Apagar Log (Apenas DEV)
  async function deleteLogAction(formData: FormData) {
    "use server";
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "DEV") return;

    const logId = formData.get("logId") as string;
    try {
      await prisma.auditLog.delete({
        where: { id: logId },
      });
    } catch (error) {
      console.error("Erro ao deletar log:", error);
    }
    revalidatePath("/logs");
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "UPDATE_PROFILE": return <UserCog className="w-5 h-5 text-blue-400" />;
      case "DELETE_PROFILE": return <UserX className="w-5 h-5 text-red-500" />;
      case "ADD_RECORD": return <ShieldAlert className="w-5 h-5 text-yellow-500" />;
      case "DELETE_RECORD": return <ShieldAlert className="w-5 h-5 text-green-500" />;
      case "ADD_BLACKLIST": return <Skull className="w-5 h-5 text-red-600" />;
      case "REMOVE_BLACKLIST": return <Skull className="w-5 h-5 text-gray-500" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "UPDATE_PROFILE": return "ATUALIZAÇÃO DE PERFIL";
      case "DELETE_PROFILE": return "EXCLUSÃO DE FICHA";
      case "ADD_RECORD": return "NOVA OCORRÊNCIA";
      case "DELETE_RECORD": return "OCORRÊNCIA REMOVIDA";
      case "ADD_BLACKLIST": return "INCLUSÃO BLACKLIST";
      case "REMOVE_BLACKLIST": return "REMOÇÃO BLACKLIST";
      default: return action;
    }
  };

  return (
    <LayoutWrapper title="SEGURANÇA // AUDITORIA E LOGS">
      <div className="space-y-6 max-w-6xl">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
          Arquivo permanente e inalterável de atividades do Comando e Liderança. Nenhum registro pode ser apagado.
        </p>

        {/* SEARCH */}
        <form method="GET" action="/logs" className="relative max-w-xl">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome de quem executou ou detalhes da ação..."
            className="w-full bg-tactical-dark border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition font-mono"
          />
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <button type="submit" className="hidden">Buscar</button>
        </form>

        <div className="tactical-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/10 font-mono text-xs text-gray-500 uppercase">
                  <th className="py-4 px-6">Tipo / Data</th>
                  <th className="py-4 px-6">Quem Executou</th>
                  <th className="py-4 px-6">Detalhes da Ação</th>
                  {currentUserRole === "DEV" && <th className="py-4 px-6 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-gray-500 font-mono text-xs">
                      NENHUM REGISTRO DE AUDITORIA ENCONTRADO.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition">
                      {/* TIPO E DATA */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            {getActionIcon(log.action)}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-white uppercase block">
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                              {new Date(log.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* QUEM EXECUTOU */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {log.executor.image ? (
                            <Image
                              src={log.executor.image}
                              alt="Avatar"
                              width={24}
                              height={24}
                              className="rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{log.executor.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-mono text-xs font-bold text-white uppercase block">
                              {log.executor.icName || log.executor.name}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono block mt-0.5">
                              ID: {log.executorId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DETALHES */}
                      <td className="py-4 px-6">
                        <p className="text-xs text-gray-300 font-mono leading-relaxed">{log.details}</p>
                        {log.target && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400 font-mono">
                            Alvo: {log.target.icName || log.target.name}
                          </span>
                        )}
                      </td>

                      {/* APAGAR (APENAS DEV) */}
                      {currentUserRole === "DEV" && (
                        <td className="py-4 px-6 text-right">
                          <form action={deleteLogAction}>
                            <input type="hidden" name="logId" value={log.id} />
                            <button
                              type="submit"
                              className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40 px-2.5 py-1.5 rounded-lg transition"
                              title="Apagar Log Permanentemente (Acesso DEV)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
