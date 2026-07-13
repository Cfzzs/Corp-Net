import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { revalidatePath } from "next/cache";
import { Clock, Calendar, Check, X, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProbationPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Apenas LIDER ou ADMIN
  if (session.user.role === "MEMBRO") {
    redirect("/403");
  }

  // Busca todos os usuários com status EM_TESTE
  const recruits = await prisma.user.findMany({
    where: { status: "EM_TESTE" },
    orderBy: { probationEnd: "asc" },
  });

  // SERVER ACTION: Efetivar Recruta
  async function promoteRecruitAction(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;

    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "ATIVO",
        probationEnd: null,
      },
    });

    revalidatePath("/testes");
    revalidatePath("/membros");
    revalidatePath("/dashboard");
  }

  // SERVER ACTION: Desligar Recruta
  async function dismissRecruitAction(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;

    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "DEMITIDO",
        probationEnd: null,
      },
    });

    revalidatePath("/testes");
    revalidatePath("/membros");
    revalidatePath("/dashboard");
  }

  return (
    <LayoutWrapper title="RECRUTAMENTO // PERÍODOS DE TESTE">
      <div className="space-y-6 max-w-6xl">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-white/5 pb-3">
          Acompanhamento de período probatório e efetivação (Ciclo de 15 dias)
        </p>

        {recruits.length === 0 ? (
          <div className="tactical-card rounded-2xl p-12 text-center text-gray-500 font-mono text-xs">
            NENHUM MEMBRO ENCONTRA-SE EM PERÍODO PROBATÓRIO ATUALMENTE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recruits.map((recruit) => {
              let daysRemaining = 0;
              let progressPercent = 0;

              if (recruit.probationEnd) {
                const timeDiff = new Date(recruit.probationEnd).getTime() - Date.now();
                daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                // Ciclo regulamentar padrão de 15 dias
                progressPercent = Math.min(100, Math.max(0, ((15 - daysRemaining) / 15) * 100));
              }

              return (
                <div key={recruit.id} className="tactical-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  {/* RECRUIT HEADER */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                        {recruit.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={recruit.image} alt={recruit.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold text-white uppercase block">
                          {recruit.icName || "Recruta Sem Nome"}
                        </h3>
                        <span className="text-xs text-gray-500 font-mono block">@{recruit.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded uppercase font-mono font-bold">
                        Em Teste
                      </span>
                    </div>
                  </div>

                  {/* PROBATION PROGRESS BAR */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {daysRemaining} dias restantes
                      </span>
                      <span>{Math.round(progressPercent)}% Concluído</span>
                    </div>

                    <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/10 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 shadow-tactical-glow"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Início: {new Date(recruit.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span>
                        Fim: {recruit.probationEnd ? new Date(recruit.probationEnd).toLocaleDateString("pt-BR") : "Não definido"}
                      </span>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    {/* BUTTON PROMOTES */}
                    <form action={promoteRecruitAction}>
                      <input type="hidden" name="userId" value={recruit.id} />
                      <button
                        type="submit"
                        className="w-full bg-success/15 hover:bg-success/25 text-success border border-success/30 font-mono text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition uppercase font-bold"
                      >
                        <Check className="w-4 h-4" />
                        <span>Efetivar</span>
                      </button>
                    </form>

                    {/* BUTTON DISMISSES */}
                    <form action={dismissRecruitAction}>
                      <input type="hidden" name="userId" value={recruit.id} />
                      <button
                        type="submit"
                        className="w-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/25 hover:border-danger/40 font-mono text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition uppercase font-bold"
                      >
                        <X className="w-4 h-4" />
                        <span>Desligar</span>
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
