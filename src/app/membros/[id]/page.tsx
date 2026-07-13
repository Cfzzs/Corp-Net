import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import { revalidatePath } from "next/cache";
import {
  User,
  Shield,
  Clock,
  AlertTriangle,
  Award,
  Calendar,
  FileSpreadsheet,
  Link as LinkIcon,
  Trash2,
  PlusCircle,
  Settings,
  ShieldAlert
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function MemberDetailPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Apenas LIDER ou ADMIN acessam a ficha de membros
  if (session.user.role === "MEMBRO") {
    redirect("/403");
  }

  const currentUserRole = session.user.role;

  // Busca dados completos do membro alvo
  const member = await prisma.user.findUnique({
    where: { id: params.id },
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

  if (!member) {
    return (
      <LayoutWrapper title="GESTÃO // DETALHES DO MEMBRO">
        <div className="tactical-card rounded-2xl p-8 text-center text-gray-500 font-mono text-xs max-w-xl mx-auto mt-12">
          AGENTE NÃO LOCALIZADO NO BANCO DE DADOS DA CORPORAÇÃO.
        </div>
      </LayoutWrapper>
    );
  }

  // Contabiliza as advertências (Leve e Grave)
  const warnings = member.recordsReceived.filter(
    (r) => r.type === "ADVERTENCIA_LEVE" || r.type === "ADVERTENCIA_GRAVE"
  );
  const warningCount = warnings.length;

  // Cálculo de dias restantes de teste
  let daysRemaining = 0;
  let probationProgress = 0;
  if (member.status === "EM_TESTE" && member.probationEnd) {
    const timeDiff = new Date(member.probationEnd).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    // Período de teste padrão de 15 dias
    probationProgress = Math.min(100, Math.max(0, ((15 - daysRemaining) / 15) * 100));
  }

  // SERVER ACTION: Adicionar Ocorrência
  async function addRecordAction(formData: FormData) {
    "use server";
    const type = formData.get("type") as "ELOGIO" | "OBSERVACAO" | "ADVERTENCIA_LEVE" | "ADVERTENCIA_GRAVE";
    const description = formData.get("description") as string;
    const proofUrl = formData.get("proofUrl") as string;

    if (!type || !description.trim()) return;

    await prisma.record.create({
      data: {
        type,
        description: description.trim(),
        proofUrl: proofUrl.trim() || null,
        userId: params.id,
        createdById: session!.user.id,
      },
    });

    revalidatePath(`/membros/${params.id}`);
    revalidatePath("/membros");
    revalidatePath("/dashboard");
  }

  // SERVER ACTION: Atualizar Cargo/Status
  async function updateMemberSettingsAction(formData: FormData) {
    "use server";
    const role = formData.get("role") as "MEMBRO" | "LIDER" | "ADMIN";
    const status = formData.get("status") as "ATIVO" | "EM_TESTE" | "DEMITIDO";
    const rank = formData.get("rank") as string;

    if (!role || !status) return;

    const data: any = { role, status, rank: rank.trim() || null };

    if (status === "EM_TESTE") {
      // 15 dias de período de teste padrão configurado conforme feedback do usuário
      data.probationEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    } else {
      data.probationEnd = null;
    }

    await prisma.user.update({
      where: { id: params.id },
      data,
    });

    revalidatePath(`/membros/${params.id}`);
    revalidatePath("/membros");
  }

  // SERVER ACTION: Deletar Ocorrência (Apenas ADMIN)
  async function deleteRecordAction(formData: FormData) {
    "use server";
    const recordId = formData.get("recordId") as string;

    if (currentUserRole !== "ADMIN" && currentUserRole !== "DEV") return;

    await prisma.record.delete({
      where: { id: recordId },
    });

    revalidatePath(`/membros/${params.id}`);
    revalidatePath("/membros");
  }

  // SERVER ACTION: Excluir Perfil (LIDER, ADMIN, DEV)
  // Perfis com role DEV são protegidos e não podem ser excluídos por ninguém
  async function deleteProfileAction(formData: FormData) {
    "use server";
    const targetId = formData.get("targetId") as string;

    // Só LIDER ou superior pode excluir
    if (currentUserRole === "MEMBRO") return;

    // Proteção: perfis DEV nunca podem ser excluídos
    const targetUser = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
    if (!targetUser || targetUser.role === "DEV") return;

    // Remove registros vinculados que NÃO têm cascade automático no schema:
    // 1. Records que este usuário CRIOU (avisos, elogios aplicados em outros)
    await prisma.record.deleteMany({ where: { createdById: targetId } });
    // 2. Entradas de blacklist que este usuário criou
    await prisma.blacklist.deleteMany({ where: { createdById: targetId } });
    // 3. Deleta o usuário — RecordsReceived têm cascade automático no schema
    await prisma.user.delete({ where: { id: targetId } });

    redirect("/membros");
  }

  const getRecordTypeBadge = (type: string) => {
    switch (type) {
      case "ELOGIO": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "OBSERVACAO": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ADVERTENCIA_LEVE": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "ADVERTENCIA_GRAVE": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <LayoutWrapper title={`FICHA // ${member.icName || member.name}`}>
      <div className="space-y-6 max-w-6xl">

        {/* ALERTA CRÍTICO SE TIVER 3/3 ADVERTÊNCIAS */}
        {warningCount >= 3 && (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 flex gap-4 text-red-500 shadow-tactical-glow-red animate-pulse">
            <ShieldAlert className="w-10 h-10 shrink-0" />
            <div>
              <h3 className="font-mono font-bold text-lg uppercase tracking-wider">Membro com limite crítico excedido</h3>
              <p className="text-sm font-sans mt-1 text-gray-300">
                Atenção líder: Esta ficha alcançou o acúmulo de {warningCount}/3 advertências. Analise o histórico e tome as providências de desligamento ou rebaixamento.
              </p>
            </div>
          </div>
        )}

        {/* TRÊS CARDS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PROFILE CARD */}
          <div className="tactical-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-mono text-xs text-gray-500 uppercase">IDENTIDADE OPERATIVA</h4>
                  <h3 className="text-base font-bold text-white font-mono uppercase">{member.icName || "Não Configurado"}</h3>
                </div>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-500">NOME DISCORD</span>
                  <span className="text-gray-300">@{member.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-500">DISCORD ID</span>
                  <span className="text-gray-300">{member.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-500">PATENTE</span>
                  <span className="text-primary font-semibold">{member.role}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-500">STATUS SERVIÇO</span>
                  <span className={member.status === "ATIVO" ? "text-emerald-500" : member.status === "EM_TESTE" ? "text-yellow-500" : "text-red-500"}>
                    {member.status === "EM_TESTE" ? "EM PERÍODO TESTE" : member.status}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">CADASTRO NO PORTAL</span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WARNING METER CARD */}
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
                Contador cumulativo de advertências. Fichas em 3/3 devem ser penalizadas de forma severa.
              </p>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 h-3.5">
                <div className={`rounded-md border ${warningCount >= 1 ? "bg-amber-500/30 border-amber-500/50 shadow-tactical-glow" : "bg-white/5 border-white/10"}`}></div>
                <div className={`rounded-md border ${warningCount >= 2 ? "bg-orange-500/30 border-orange-500/50 shadow-tactical-glow" : "bg-white/5 border-white/10"}`}></div>
                <div className={`rounded-md border ${warningCount >= 3 ? "bg-red-500/40 border-red-500/60 shadow-tactical-glow-red animate-pulse" : "bg-white/5 border-white/10"}`}></div>
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
                  {member.status === "EM_TESTE" ? `${daysRemaining} dias` : "ATIVO"}
                </span>
              </div>

              {member.status === "EM_TESTE" ? (
                <>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                    Acompanhamento do período probatório do recruta. (Padrão: 15 dias).
                  </p>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-white/5 rounded-full h-2 border border-white/10 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500 shadow-tactical-glow" style={{ width: `${probationProgress}%` }}></div>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-gray-500 uppercase">
                      <span>Dia 1</span>
                      <span>Dia 15</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <Award className="w-10 h-10 text-emerald-500 mb-2 shadow-tactical-glow-green" />
                  <span className="text-emerald-500 font-mono text-xs uppercase tracking-wider font-bold">MEMBRO EFETIVADO</span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">ESTADO DA FICHA ATIVA</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA: LISTA DE HISTÓRICO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="tactical-card rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">AVALIAÇÕES E OCORRÊNCIAS</h3>
                </div>
                <span className="font-mono text-xs text-gray-500">{member.recordsReceived.length} registros</span>
              </div>

              {member.recordsReceived.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-white/5 rounded-xl bg-black/5 font-mono text-xs">
                  <span>ESTA FICHA NÃO POSSUI REGISTROS CADASTRADOS.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {member.recordsReceived.map((record) => (
                    <div key={record.id} className="bg-tactical-dark border border-white/5 hover:border-white/10 rounded-xl p-4 transition flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${getRecordTypeBadge(record.type)}`}>
                            {record.type.replace("_", " ")}
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

                      <div className="flex items-center gap-2 shrink-0">
                        {record.proofUrl && (
                          <a href={record.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] px-2 py-1 rounded border border-white/10 transition">
                            <LinkIcon className="w-3 h-3 text-gray-400" />
                          </a>
                        )}
                        {(currentUserRole === "ADMIN" || currentUserRole === "DEV") && (
                          <form action={deleteRecordAction}>
                            <input type="hidden" name="recordId" value={record.id} />
                            <button type="submit" className="flex items-center gap-1 bg-danger/10 hover:bg-danger/20 text-danger font-mono text-[10px] px-2 py-1 rounded border border-danger/20 hover:border-danger/40 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIOS DE CONTROLE */}
          <div className="space-y-6">
            {/* ADICIONAR OCORRÊNCIA */}
            <div className="tactical-card rounded-2xl p-6">
              <h3 className="font-mono text-sm font-bold text-white uppercase border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-primary" /> LANÇAR AVALIAÇÃO
              </h3>
              
              <form action={addRecordAction} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Tipo de Registro</label>
                  <select name="type" className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition">
                    <option value="OBSERVACAO">OBSERVAÇÃO GERAL</option>
                    <option value="ELOGIO">ELOGIO DE DESEMPENHO</option>
                    <option value="ADVERTENCIA_LEVE">ADVERTÊNCIA LEVE (1/3)</option>
                    <option value="ADVERTENCIA_GRAVE">ADVERTÊNCIA GRAVE (1/3)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Descrição dos Fatos</label>
                  <textarea name="description" rows={4} placeholder="Descreva os acontecimentos de forma técnica e objetiva..." required className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2 focus:outline-none transition font-sans text-sm"></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Link de Prova (Imgur, Medal, YT)</label>
                  <input type="url" name="proofUrl" placeholder="https://..." className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition" />
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition uppercase">
                  <span>Registrar Ocorrência</span>
                </button>
              </form>
            </div>

            {/* PAINEL OPERACIONAL: ALTERAR DADOS */}
            <div className="tactical-card rounded-2xl p-6">
              <h3 className="font-mono text-sm font-bold text-white uppercase border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> CONTROLE PATENTE & STATUS
              </h3>

              <form action={updateMemberSettingsAction} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Patente / Role</label>
                  <select name="role" defaultValue={member.role} className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition">
                    <option value="MEMBRO">MEMBRO</option>
                    <option value="LIDER">LÍDER / SUPERVISOR</option>
                    <option value="ADMIN">ADMIN / COMANDO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Cargo Policial (título)</label>
                  <input
                    type="text"
                    name="rank"
                    defaultValue={member.rank || ""}
                    placeholder="Ex: Agente Especial, Sargento..."
                    className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase tracking-wider">Status Corporativo</label>
                  <select name="status" defaultValue={member.status} className="w-full bg-tactical-dark border border-white/10 focus:border-primary/50 text-white rounded-xl px-3 py-2.5 focus:outline-none transition">
                    <option value="ATIVO">ATIVO</option>
                    <option value="EM_TESTE">EM PERÍODO TESTE (15 dias)</option>
                    <option value="DEMITIDO">DEMITIDO (BLOQUEIA ACESSO)</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition uppercase">
                  <span>Atualizar Cadastro</span>
                </button>
              </form>
            </div>

            {/* BOTÃO EXCLUIR PERFIL — oculto para DEV e oculto do próprio perfil */}
            {member.role !== "DEV" && (currentUserRole === "LIDER" || currentUserRole === "ADMIN" || currentUserRole === "DEV") && (
              <DeleteProfileButton
                deleteAction={deleteProfileAction}
                memberId={member.id}
                memberName={member.icName || member.name}
              />
            )}
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
