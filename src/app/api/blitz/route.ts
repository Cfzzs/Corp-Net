import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ["LIDER", "ADMIN", "DEV", "STAFF"];

function fmtHMS(millis: number): string {
  const total = Math.max(0, Math.floor(millis / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [String(h).padStart(2, "0"), String(m).padStart(2, "0"), String(s).padStart(2, "0")].join(":");
}

function fmtDateTime(d: Date | string): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

async function enviarDiscord(embed: any): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_BLITZ;
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL_BLITZ não configurado — notificação do Discord ignorada");
    return;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed),
    });
    if (!res.ok) console.error("Erro ao enviar blitz para Discord:", await res.text().catch(() => ""));
  } catch (error) {
    console.error("Erro ao enviar blitz para Discord:", error);
  }
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }
  return { session };
}

export async function GET() {
  try {
    const open = await prisma.blitz.findFirst({
      where: { fechadaEm: null },
      orderBy: { abertaEm: "desc" },
      include: {
        presencas: { orderBy: { entrada: "asc" } },
      },
    });

    const historico = await prisma.blitz.findMany({
      where: { fechadaEm: { not: null } },
      orderBy: { fechadaEm: "desc" },
      take: 10,
      include: {
        presencas: { orderBy: { entrada: "asc" } },
      },
    });

    return NextResponse.json({ blitzAberta: open, historico });
  } catch (error) {
    console.error("Erro ao buscar blitz:", error);
    return NextResponse.json({ error: "Erro ao buscar blitz" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const user = session!.user as any;

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "open") {
      if (!ADMIN_ROLES.includes(user.role)) {
        return NextResponse.json({ error: "Sem permissão para abrir blitz" }, { status: 403 });
      }
      const local = (formData.get("local") as string || "").trim();
      if (!local) {
        return NextResponse.json({ error: "Informe o local da blitz" }, { status: 400 });
      }

      const existing = await prisma.blitz.findFirst({ where: { fechadaEm: null } });
      if (existing) {
        return NextResponse.json({ error: "Já existe uma blitz aberta" }, { status: 400 });
      }

      const blitz = await prisma.blitz.create({
        data: {
          local,
          abertaPor: user.id,
          abertaPorNome: user.name || "Agente",
          abertaPorIcName: user.icName || user.name || "Não configurado",
        },
      });

      await enviarDiscord({
        content: "<@&1341103708519403522>",
        embeds: [
          {
            title: "🚨 BLITZ INICIADA - PRS",
            color: 15158332,
            fields: [
              { name: "📍 Local", value: local, inline: true },
              { name: "🕐 Início", value: fmtDateTime(blitz.abertaEm), inline: true },
              { name: "👮 Responsável", value: `${blitz.abertaPorIcName} (@${blitz.abertaPorNome})`, inline: false },
              { name: "👥 Presença", value: "Marque sua presença no sistema (CORP//NET → Blitz).", inline: false },
            ],
            footer: {
              text: "PRS - Polícia Rodoviária Street. Disciplina, compromisso e excelência no patrulhamento.",
              icon_url: "https://cdn.discordapp.com/embed/avatars/0.png",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await prisma.auditLog.create({
        data: {
          action: "ABRIR_BLITZ",
          details: `Blitz aberta em ${local}.`,
          executorId: user.id,
        },
      }).catch((e) => console.error("Erro ao criar log:", e));

      return NextResponse.json({ success: true, blitz }, { status: 200 });
    }

    if (action === "presenca") {
      const matricula = (formData.get("matricula") as string || "").trim();
      const patente = (formData.get("patente") as string || "").trim();

      const blitz = await prisma.blitz.findFirst({ where: { fechadaEm: null } });
      if (!blitz) {
        return NextResponse.json({ error: "Nenhuma blitz aberta no momento" }, { status: 400 });
      }

      const ativa = await prisma.blitzPresenca.findFirst({
        where: { blitzId: blitz.id, userId: user.id, saida: null },
      });
      if (ativa) {
        return NextResponse.json({ error: "Você já está presente nesta blitz" }, { status: 400 });
      }

      const presenca = await prisma.blitzPresenca.create({
        data: {
          blitzId: blitz.id,
          userId: user.id,
          nome: user.icName || user.name || "Agente",
          discord: user.name || "Desconhecido",
          matricula: matricula || "—",
          patente: patente || "—",
        },
      });

      return NextResponse.json({ success: true, presenca }, { status: 200 });
    }

    if (action === "sair") {
      const blitz = await prisma.blitz.findFirst({ where: { fechadaEm: null } });
      if (!blitz) {
        return NextResponse.json({ error: "Nenhuma blitz aberta no momento" }, { status: 400 });
      }

      const ativa = await prisma.blitzPresenca.findFirst({
        where: { blitzId: blitz.id, userId: user.id, saida: null },
      });
      if (!ativa) {
        return NextResponse.json({ error: "Você não está presente nesta blitz" }, { status: 400 });
      }

      await prisma.blitzPresenca.update({
        where: { id: ativa.id },
        data: { saida: new Date() },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "fechar") {
      if (!ADMIN_ROLES.includes(user.role)) {
        return NextResponse.json({ error: "Sem permissão para fechar blitz" }, { status: 403 });
      }

      const blitz = await prisma.blitz.findFirst({ where: { fechadaEm: null } });
      if (!blitz) {
        return NextResponse.json({ error: "Nenhuma blitz aberta para fechar" }, { status: 400 });
      }

      const veiculosTexto = (formData.get("veiculos") as string || "").trim();
      const veiculosApreendidos = veiculosTexto
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

      const agora = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.blitz.update({
          where: { id: blitz.id },
          data: { fechadaEm: agora, veiculosApreendidos },
        });
        await tx.blitzPresenca.updateMany({
          where: { blitzId: blitz.id, saida: null },
          data: { saida: agora },
        });
      });

      const presencas = await prisma.blitzPresenca.findMany({
        where: { blitzId: blitz.id },
        orderBy: { entrada: "asc" },
      });

      const porUsuario = new Map<string, { nome: string; matricula: string; patente: string; total: number }>();
      for (const p of presencas) {
        const fim = p.saida || agora;
        const dur = fim.getTime() - p.entrada.getTime();
        const atual = porUsuario.get(p.userId) || {
          nome: p.nome,
          matricula: p.matricula,
          patente: p.patente,
          total: 0,
        };
        atual.total += dur;
        porUsuario.set(p.userId, atual);
      }

      const listaPresentes = Array.from(porUsuario.entries()).map(([userId, v]) => ({
        userId,
        nome: v.nome,
        matricula: v.matricula,
        patente: v.patente,
        tempo: fmtHMS(v.total),
      }));

      const duracao = fmtHMS(agora.getTime() - blitz.abertaEm.getTime());

      const presentesTexto = listaPresentes.length
        ? listaPresentes
            .map((p) => `- **${p.nome}** (${p.patente} | Matrícula ${p.matricula}) — ⏱️ ${p.tempo}`)
            .join("\n")
        : "Nenhuma presença registrada.";

      const veiculosTextoEmbed = veiculosApreendidos.length
        ? veiculosApreendidos.map((v) => `- ${v}`).join("\n")
        : "Nenhum veículo apreendido.";

      await enviarDiscord({
        content: "<@&1341103708519403522>",
        embeds: [
          {
            title: "🔒 BLITZ ENCERRADA - PRS",
            color: 42168,
            fields: [
              { name: "📍 Local", value: blitz.local, inline: true },
              { name: "⏱️ Duração", value: duracao, inline: true },
              { name: "🕐 Início", value: fmtDateTime(blitz.abertaEm), inline: true },
              { name: "🕐 Fim", value: fmtDateTime(agora), inline: true },
              { name: "👥 Agentes Presentes", value: presentesTexto.substring(0, 1000), inline: false },
              { name: "🚗 Veículos Apreendidos", value: veiculosTextoEmbed.substring(0, 1000), inline: false },
            ],
            footer: {
              text: "PRS - Polícia Rodoviária Street. Disciplina, compromisso e excelência no patrulhamento.",
              icon_url: "https://cdn.discordapp.com/embed/avatars/0.png",
            },
            timestamp: agora.toISOString(),
          },
        ],
      });

      await prisma.auditLog.create({
        data: {
          action: "FECHAR_BLITZ",
          details: `Blitz fechada em ${blitz.local}. Duração: ${duracao}. Presentes: ${listaPresentes.length}. Veículos apreendidos: ${veiculosApreendidos.length}.`,
          executorId: user.id,
        },
      }).catch((e) => console.error("Erro ao criar log:", e));

      return NextResponse.json({ success: true, blitzId: blitz.id }, { status: 200 });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar ação da blitz:", error);
    return NextResponse.json({ error: "Erro interno ao processar ação" }, { status: 500 });
  }
}
