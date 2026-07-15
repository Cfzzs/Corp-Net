import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { revalidatePath } from "next/cache";
import { Search, Skull, PlusCircle, Trash2, Link as LinkIcon, AlertTriangle, ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BlacklistPage({
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
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "DEV";
  const query = searchParams?.q || "";

  // Busca registros na Blacklist baseados na query
  const bannedPlayers = await prisma.blacklist.findMany({
    where: {
      OR: [
        { icName: { contains: query } },
        { discordId: { contains: query } },
        { reason: { contains: query } },
      ],
    },
    include: {
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // SERVER ACTION: Adicionar à Blacklist (Apenas ADMIN)
  async function addToBlacklistAction(formData: FormData) {
    "use server";
    const discordId = formData.get("discordId") as string;
    const icName = formData.get("icName") as string;
    const reason = formData.get("reason") as string;
    const proofUrl = formData.get("proofUrl") as string;

    if (!discordId || !icName || !reason) return;

    try {
      await prisma.blacklist.create({
        data: {
          discordId: discordId.trim(),
          icName: icName.trim(),
          reason: reason.trim(),
          proofUrl: proofUrl.trim() || null,
          createdById: session!.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "ADD_BLACKLIST",
          details: `Adicionou ${icName.trim()} (ID: ${discordId.trim()}) à Blacklist. Motivo: ${reason.trim()}`,
          executorId: session!.user.id,
        },
      });
    } catch (error) {
      console.error("Erro ao inserir na Blacklist:", error);
    }

    revalidatePath("/blacklist");
  }

  // SERVER ACTION: Remover da Blacklist (Apenas ADMIN)
  async function removeFromBlacklistAction(formData: FormData) {
    "use server";
    const blacklistId = formData.get("blacklistId") as string;

    if (currentUserRole !== "ADMIN" && currentUserRole !== "DEV") return;

    try {
      const deletedEntry = await prisma.blacklist.delete({
        where: { id: blacklistId },
      });

      await prisma.auditLog.create({
        data: {
          action: "REMOVE_BLACKLIST",
          details: `Removeu ${deletedEntry.icName} (ID: ${deletedEntry.discordId}) da Blacklist.`,
          executorId: session!.user.id,
        },
      });
    } catch (error) {
      console.error("Erro ao deletar da Blacklist:", error);
    }

    revalidatePath("/blacklist");
  }

  return (
    <LayoutWrapper title="SEGURANÇA // LISTA NEGRA (BLACKLIST)">
      <div className="space-y-6 max-w-6xl">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
          Arquivo de jogadores expulsos e banidos da corporação para consulta operacional
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TABELA DE CONSULTA DA BLACKLIST */}
          <div className="lg:col-span-2 space-y-4">
            {/* SEARCH */}
            <form method="GET" action="/blacklist" className="relative">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por Nome IC, Discord ID ou motivo..."
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
                      <th className="py-4 px-6">Identidade Jogador</th>
                      <th className="py-4 px-6">Motivo da Expulsão</th>
                      <th className="py-4 px-6">Responsável / Data</th>
                      <th className="py-4 px-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans text-sm">
                    {bannedPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-gray-500 font-mono text-xs">
                          NENHUM REGISTRO DE BANIDO VINCULADO NO ARQUIVO.
                        </td>
                      </tr>
                    ) : (
                      bannedPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-white/[0.01] transition">
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-mono text-sm font-bold text-red-500 uppercase block flex items-center gap-1.5">
                                <Skull className="w-3.5 h-3.5 shrink-0" />
                                {player.icName}
                              </span>
                              <span className="text-xs text-gray-500 font-mono block mt-0.5">
                                ID Discord: {player.discordId}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-gray-300 font-mono max-w-xs leading-relaxed">{player.reason}</p>
                            {player.proofUrl && (
                              <a
                                href={player.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 font-mono"
                              >
                                <LinkIcon className="w-3 h-3" /> Ver Mídia de Prova
                              </a>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs">
                            <span className="text-gray-400 block uppercase font-semibold">
                              {player.createdBy.icName || player.createdBy.name}
                            </span>
                            <span className="text-gray-500 block text-[10px] mt-0.5">
                              {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {isAdmin ? (
                              <form action={removeFromBlacklistAction}>
                                <input type="hidden" name="blacklistId" value={player.id} />
                                <button
                                  type="submit"
                                  className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40 px-2.5 py-1.5 rounded-lg transition"
                                  title="Remover da Blacklist"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-mono uppercase">Protegido</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: REGISTRAR BANIDO (APENAS ADMIN) */}
          <div className="space-y-4">
            {isAdmin ? (
              <div className="tactical-card rounded-2xl p-6">
                <h3 className="font-mono text-sm font-bold text-white uppercase border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-red-500" /> INCLUIR NA BLACKLIST
                </h3>

                <form action={addToBlacklistAction} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase tracking-wider">Discord ID do Jogador</label>
                    <input
                      type="text"
                      name="discordId"
                      placeholder="Ex: 28392039203920"
                      required
                      className="w-full bg-tactical-dark border border-white/10 focus:border-danger/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase tracking-wider">Nome IC do Jogador</label>
                    <input
                      type="text"
                      name="icName"
                      placeholder="Ex: John_Doe"
                      required
                      className="w-full bg-tactical-dark border border-white/10 focus:border-danger/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase tracking-wider">Motivo / Justificativa</label>
                    <textarea
                      name="reason"
                      rows={4}
                      placeholder="Descreva o motivo do banimento e da demissão por justa causa..."
                      required
                      className="w-full bg-tactical-dark border border-white/10 focus:border-danger/50 text-white rounded-xl px-3 py-2 focus:outline-none transition font-sans text-sm"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase tracking-wider">Link de Prova (Imgur, Medal, YT)</label>
                    <input
                      type="url"
                      name="proofUrl"
                      placeholder="https://..."
                      className="w-full bg-tactical-dark border border-white/10 focus:border-danger/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-danger hover:bg-danger-hover text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition uppercase"
                  >
                    <span>Banir e Fichar</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="tactical-card rounded-2xl p-6 bg-yellow-500/5 border-yellow-500/10 flex flex-col items-center text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mb-3 animate-pulse" />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">ACESSO LIMITADO A CONSULTA</h4>
                <p className="text-gray-400 text-[11px] leading-relaxed mt-2">
                  Apenas membros com cargo do Alto Comando/Patente Administrativa (<span className="text-primary font-bold">ADMIN</span>) podem cadastrar ou remover registros desta lista de segurança.
                </p>
              </div>
            )}
            
            <div className="tactical-card rounded-2xl p-6 bg-emerald-500/5 border-emerald-500/10 flex flex-col items-center text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-3 shadow-tactical-glow-green" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">BANCO DE DADOS PROTEGIDO</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed mt-2">
                Qualquer acesso ou consulta a este arquivo é registrado internamente com carimbo de data/hora e o ID do operador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
